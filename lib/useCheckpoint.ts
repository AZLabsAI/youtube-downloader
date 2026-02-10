import { useState, useCallback } from 'react';

export type CheckpointStep = 'download' | 'transcribe' | 'detect-moments' | 'generate-clips' | 'generate-metadata';

export interface CheckpointState {
  videoId: string;
  videoUrl: string;
  lastCompletedStep: CheckpointStep | null;
  nextStep: CheckpointStep;
  timeElapsed: number;
  checkpoints: Record<CheckpointStep, any>;
}

export const useCheckpoint = (videoId: string) => {
  const [checkpointState, setCheckpointState] = useState<CheckpointState | null>(null);
  const [isCheckpointLoading, setIsCheckpointLoading] = useState(false);
  const [checkpointError, setCheckpointError] = useState<string | null>(null);

  // Fetch checkpoint state
  const fetchCheckpoint = useCallback(async () => {
    if (!videoId) return;
    
    setIsCheckpointLoading(true);
    setCheckpointError(null);

    try {
      const response = await fetch('/api/checkpoint/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });

      if (response.ok) {
        const data = await response.json();
        setCheckpointState(data);
        return data;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch checkpoint';
      setCheckpointError(errorMsg);
    } finally {
      setIsCheckpointLoading(false);
    }
  }, [videoId]);

  // Save a checkpoint after completing a step
  const saveCheckpoint = useCallback(
    async (
      step: CheckpointStep,
      status: 'complete' | 'failed',
      data?: any,
      duration?: number
    ) => {
      if (!videoId) return;

      try {
        // In a real implementation, this would call an API endpoint
        // For now, we'll just log it
        console.log('Checkpoint saved:', { videoId, step, status, data, duration });
      } catch (error) {
        console.error('Error saving checkpoint:', error);
      }
    },
    [videoId]
  );

  // Skip to a specific step
  const skipToStep = useCallback(
    async (targetStep: CheckpointStep) => {
      if (!videoId) return;

      setIsCheckpointLoading(true);
      setCheckpointError(null);

      try {
        const response = await fetch('/api/checkpoint/skip-to-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId, targetStep }),
        });

        if (response.ok) {
          const data = await response.json();
          setCheckpointState(prev => prev ? { ...prev, ...data } : null);
          return data;
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to skip to step');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to skip to step';
        setCheckpointError(errorMsg);
        throw error;
      } finally {
        setIsCheckpointLoading(false);
      }
    },
    [videoId]
  );

  // Delete checkpoint
  const deleteCheckpoint = useCallback(async () => {
    if (!videoId) return;

    try {
      const response = await fetch(`/api/checkpoint/${videoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCheckpointState(null);
        return true;
      }
    } catch (error) {
      console.error('Error deleting checkpoint:', error);
      return false;
    }
  }, [videoId]);

  return {
    checkpointState,
    isCheckpointLoading,
    checkpointError,
    fetchCheckpoint,
    saveCheckpoint,
    skipToStep,
    deleteCheckpoint,
  };
};
