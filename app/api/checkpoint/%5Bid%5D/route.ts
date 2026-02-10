import { NextRequest, NextResponse } from 'next/server';
import { checkpointService } from '@/services/checkpoint.service';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  try {
    const params = await context.params;
    const videoId = params.id;

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
      );
    }

    // Check if checkpoint exists
    if (!checkpointService.hasCheckpoints(videoId)) {
      return NextResponse.json(
        { error: `No checkpoint found for video ${videoId}` },
        { status: 404 }
      );
    }

    // Clear the checkpoint
    checkpointService.clearCheckpoints(videoId);

    return NextResponse.json({
      message: `Checkpoint deleted for video ${videoId}`,
      videoId,
    });
  } catch (error) {
    console.error('Error deleting checkpoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete checkpoint' },
      { status: 500 }
    );
  }
}
