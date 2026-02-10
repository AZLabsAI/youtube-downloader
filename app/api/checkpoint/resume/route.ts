import { NextResponse } from 'next/server';
import { checkpointService } from '@/services/checkpoint.service';

export async function POST(request: Request) {
  try {
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
      );
    }

    // Get the current state
    const state = checkpointService.getState(videoId);
    const lastCompleted = checkpointService.getLastCompletedStep(videoId);
    const nextStep = checkpointService.getNextStep(lastCompleted);
    const timeElapsed = checkpointService.getTimeElapsed(videoId);

    return NextResponse.json({
      videoId,
      videoUrl: state.videoUrl,
      lastCompletedStep: lastCompleted,
      nextStep,
      timeElapsed,
      checkpoints: state.checkpoints,
      shouldResume: true,
    });
  } catch (error) {
    console.error('Error resuming checkpoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resume checkpoint' },
      { status: 500 }
    );
  }
}
