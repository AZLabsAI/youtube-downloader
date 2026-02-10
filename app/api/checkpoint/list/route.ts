import { NextResponse } from 'next/server';
import { checkpointService } from '@/services/checkpoint.service';

export async function GET() {
  try {
    const incompleteCheckpoints = checkpointService.getIncompleteCheckpoints();

    return NextResponse.json({
      checkpoints: incompleteCheckpoints.map(({ videoId, state }) => {
        const lastCompleted = checkpointService.getLastCompletedStep(videoId);
        const nextStep = checkpointService.getNextStep(lastCompleted);
        const timeElapsed = checkpointService.getTimeElapsed(videoId);

        return {
          videoId,
          videoUrl: state.videoUrl,
          lastCompletedStep: lastCompleted,
          nextStep,
          timeElapsed,
          createdAt: state.createdAt,
          lastUpdatedAt: state.lastUpdatedAt,
          checkpoints: state.checkpoints,
        };
      }),
    });
  } catch (error) {
    console.error('Error listing checkpoints:', error);
    return NextResponse.json(
      { error: 'Failed to list checkpoints' },
      { status: 500 }
    );
  }
}
