import { NextResponse } from 'next/server';
import { checkpointService } from '@/services/checkpoint.service';

export async function POST(request: Request) {
  try {
    const { videoId, targetStep } = await request.json();

    if (!videoId || !targetStep) {
      return NextResponse.json(
        { error: 'videoId and targetStep are required' },
        { status: 400 }
      );
    }

    const validSteps = ['download', 'transcribe', 'detect-moments', 'generate-clips', 'generate-metadata'];
    if (!validSteps.includes(targetStep)) {
      return NextResponse.json(
        { error: `Invalid step. Must be one of: ${validSteps.join(', ')}` },
        { status: 400 }
      );
    }

    // Skip to the target step
    const updatedState = checkpointService.skipToStep(videoId, targetStep);
    
    const lastCompleted = checkpointService.getLastCompletedStep(videoId);
    const nextStep = checkpointService.getNextStep(lastCompleted);
    const timeElapsed = checkpointService.getTimeElapsed(videoId);

    return NextResponse.json({
      videoId,
      videoUrl: updatedState.videoUrl,
      lastCompletedStep: lastCompleted,
      nextStep,
      timeElapsed,
      targetStep,
      message: `Skipped to step: ${targetStep}`,
      checkpoints: updatedState.checkpoints,
    });
  } catch (error) {
    console.error('Error skipping to step:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to skip to step' },
      { status: 500 }
    );
  }
}
