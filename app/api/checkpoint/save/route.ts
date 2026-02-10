import { NextResponse } from 'next/server';
import { checkpointService } from '@/services/checkpoint.service';

export async function POST(request: Request) {
  try {
    const { videoId, step, status, data, error, duration } = await request.json();

    if (!videoId || !step || !status) {
      return NextResponse.json(
        { error: 'videoId, step, and status are required' },
        { status: 400 }
      );
    }

    const validSteps = ['download', 'transcribe', 'detect-moments', 'generate-clips', 'generate-metadata'];
    if (!validSteps.includes(step)) {
      return NextResponse.json(
        { error: `Invalid step. Must be one of: ${validSteps.join(', ')}` },
        { status: 400 }
      );
    }

    const validStatuses = ['complete', 'failed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Save the checkpoint
    const updatedState = checkpointService.saveCheckpoint(
      videoId,
      step,
      status,
      data || null,
      error || null,
      duration || 0
    );

    return NextResponse.json({
      message: `Checkpoint saved for step: ${step}`,
      videoId,
      step,
      status,
      checkpoints: updatedState.checkpoints,
      totalDuration: updatedState.totalDuration,
    });
  } catch (error) {
    console.error('Error saving checkpoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save checkpoint' },
      { status: 500 }
    );
  }
}
