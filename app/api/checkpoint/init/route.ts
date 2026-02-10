import { NextResponse } from 'next/server';
import { checkpointService } from '@/services/checkpoint.service';

export async function POST(request: Request) {
  try {
    const { videoId, videoUrl } = await request.json();

    if (!videoId || !videoUrl) {
      return NextResponse.json(
        { error: 'videoId and videoUrl are required' },
        { status: 400 }
      );
    }

    // Clear any existing checkpoint for this video
    try {
      checkpointService.clearCheckpoints(videoId);
    } catch (error) {
      // Ignore if checkpoint doesn't exist
    }

    // Initialize new workflow
    const state = checkpointService.initializeWorkflow(videoId, videoUrl);

    return NextResponse.json({
      message: 'Workflow initialized',
      videoId,
      videoUrl,
      state,
    });
  } catch (error) {
    console.error('Error initializing workflow:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initialize workflow' },
      { status: 500 }
    );
  }
}
