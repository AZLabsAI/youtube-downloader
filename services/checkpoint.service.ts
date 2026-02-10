import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';

export interface Checkpoint {
  step: 'download' | 'transcribe' | 'detect-moments' | 'generate-clips' | 'generate-metadata';
  timestamp: number;
  status: 'complete' | 'failed';
  data?: any;
  error?: string;
  duration: number; // in milliseconds
}

export interface CheckpointState {
  videoId: string;
  videoUrl: string;
  checkpoints: {
    [key: string]: Checkpoint;
  };
  currentStep?: string;
  totalDuration: number; // cumulative duration of all completed steps
  createdAt: number;
  lastUpdatedAt: number;
}

export class CheckpointService {
  private dataDir: string;
  private checkpointsBaseDir: string;

  constructor() {
    this.dataDir = process.env.DATA_DIR || join(process.cwd(), 'data');
    this.checkpointsBaseDir = join(this.dataDir, 'checkpoints');
    
    // Ensure directories exist
    mkdirSync(this.dataDir, { recursive: true });
    mkdirSync(this.checkpointsBaseDir, { recursive: true });
  }

  /**
   * Initialize a new checkpoint workflow for a video
   */
  initializeWorkflow(videoId: string, videoUrl: string): CheckpointState {
    const state: CheckpointState = {
      videoId,
      videoUrl,
      checkpoints: {},
      totalDuration: 0,
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };

    this.saveState(state);
    return state;
  }

  /**
   * Save a checkpoint for a specific step
   */
  saveCheckpoint(
    videoId: string,
    step: Checkpoint['step'],
    status: 'complete' | 'failed',
    data: any = null,
    error: string | null = null,
    duration: number = 0
  ): CheckpointState {
    const state = this.getState(videoId);
    
    const checkpoint: Checkpoint = {
      step,
      timestamp: Date.now(),
      status,
      duration,
      ...(data && { data }),
      ...(error && { error }),
    };

    state.checkpoints[step] = checkpoint;
    state.currentStep = step;
    state.lastUpdatedAt = Date.now();

    // Update total duration for completed steps
    if (status === 'complete') {
      state.totalDuration += duration;
    }

    this.saveState(state);
    return state;
  }

  /**
   * Get the current workflow state for a video
   */
  getState(videoId: string): CheckpointState {
    const statePath = this.getStatePath(videoId);

    if (!existsSync(statePath)) {
      throw new Error(`No checkpoint state found for video ${videoId}`);
    }

    const content = readFileSync(statePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Check if a video has checkpoints
   */
  hasCheckpoints(videoId: string): boolean {
    return existsSync(this.getStatePath(videoId));
  }

  /**
   * Get the last completed step for a video
   */
  getLastCompletedStep(videoId: string): Checkpoint['step'] | null {
    try {
      const state = this.getState(videoId);
      const steps: Checkpoint['step'][] = ['download', 'transcribe', 'detect-moments', 'generate-clips', 'generate-metadata'];
      
      for (let i = steps.length - 1; i >= 0; i--) {
        const step = steps[i];
        if (state.checkpoints[step]?.status === 'complete') {
          return step;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get the next step to resume from
   */
  getNextStep(lastCompletedStep: Checkpoint['step'] | null): Checkpoint['step'] {
    const steps: Checkpoint['step'][] = ['download', 'transcribe', 'detect-moments', 'generate-clips', 'generate-metadata'];
    
    if (!lastCompletedStep) {
      return steps[0];
    }

    const currentIndex = steps.indexOf(lastCompletedStep);
    return steps[currentIndex + 1] || steps[steps.length - 1];
  }

  /**
   * Get all incomplete checkpoints (for UI recovery display)
   */
  getIncompleteCheckpoints(): Array<{ videoId: string; state: CheckpointState }> {
    const incomplete: Array<{ videoId: string; state: CheckpointState }> = [];

    if (!existsSync(this.checkpointsBaseDir)) {
      return incomplete;
    }

    const videos = readdirSync(this.checkpointsBaseDir);
    for (const videoId of videos) {
      try {
        const state = this.getState(videoId);
        const lastCompleted = this.getLastCompletedStep(videoId);
        const steps: Checkpoint['step'][] = ['download', 'transcribe', 'detect-moments', 'generate-clips', 'generate-metadata'];
        
        // Check if workflow is incomplete (not all steps are complete)
        const isIncomplete = lastCompleted === null || steps.indexOf(lastCompleted) < steps.length - 1;
        
        if (isIncomplete) {
          incomplete.push({ videoId, state });
        }
      } catch (error) {
        console.error(`Error reading checkpoint for ${videoId}:`, error);
      }
    }

    return incomplete;
  }

  /**
   * Clear all checkpoints for a video
   */
  clearCheckpoints(videoId: string): void {
    const checkpointDir = this.getCheckpointDir(videoId);
    if (existsSync(checkpointDir)) {
      rmSync(checkpointDir, { recursive: true, force: true });
    }
  }

  /**
   * Skip to a specific step (user wants to resume from a custom point)
   */
  skipToStep(videoId: string, targetStep: Checkpoint['step']): CheckpointState {
    const state = this.getState(videoId);
    
    // Mark all steps up to and including targetStep as needing to be redone
    // But keep their data if they were previously completed
    const steps: Checkpoint['step'][] = ['download', 'transcribe', 'detect-moments', 'generate-clips', 'generate-metadata'];
    const targetIndex = steps.indexOf(targetStep);

    for (let i = targetIndex; i < steps.length; i++) {
      const step = steps[i];
      if (state.checkpoints[step]) {
        state.checkpoints[step].status = 'failed'; // Mark as needing to be redone
      }
    }

    state.currentStep = targetStep;
    state.lastUpdatedAt = Date.now();
    this.saveState(state);

    return state;
  }

  /**
   * Get time elapsed for the workflow
   */
  getTimeElapsed(videoId: string): number {
    try {
      const state = this.getState(videoId);
      return state.totalDuration;
    } catch {
      return 0;
    }
  }

  /**
   * Save the state to file
   */
  private saveState(state: CheckpointState): void {
    const checkpointDir = this.getCheckpointDir(state.videoId);
    mkdirSync(checkpointDir, { recursive: true });

    const statePath = this.getStatePath(state.videoId);
    writeFileSync(statePath, JSON.stringify(state, null, 2));
  }

  /**
   * Get the checkpoint directory for a video
   */
  private getCheckpointDir(videoId: string): string {
    return join(this.checkpointsBaseDir, videoId);
  }

  /**
   * Get the state file path
   */
  private getStatePath(videoId: string): string {
    return join(this.getCheckpointDir(videoId), 'state.json');
  }

  /**
   * Get download directory for a video
   */
  getDownloadDir(videoId: string): string {
    return join(this.dataDir, 'downloads', videoId);
  }

  /**
   * Get output directory for clips
   */
  getOutputDir(videoId: string): string {
    return join(this.dataDir, 'output', videoId);
  }
}

export const checkpointService = new CheckpointService();
