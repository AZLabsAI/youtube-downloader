import { NextResponse } from 'next/server';
import { ytdlpService } from '@/services/ytdlp.service';
import { potProviderService } from '@/services/pot-provider.service';
import { checkpointService } from '@/services/checkpoint.service';
import { createReadStream, statSync } from 'fs';
import { basename } from 'path';

export async function POST(request: Request) {
  try {
    const { url, qualityId } = await request.json();

    if (!url || !qualityId) {
      return NextResponse.json(
        { error: 'URL and quality ID are required' },
        { status: 400 }
      );
    }

    // Ensure POT provider is running (required for restricted videos)
    await potProviderService.start();

    // Get video metadata first to get the title and ID
    const metadata = await ytdlpService.getVideoMetadata(url);
    const videoId = metadata.id;
    const startTime = Date.now();
    
    // Initialize checkpoint if this is the first step
    if (!checkpointService.hasCheckpoints(videoId)) {
      checkpointService.initializeWorkflow(videoId, url);
    }
    
    // Download the video with the specified quality option
    const filePath = await ytdlpService.downloadVideoWithQuality(url, qualityId, metadata.title);
    
    // Save download checkpoint
    const downloadDuration = Date.now() - startTime;
    checkpointService.saveCheckpoint(
      videoId,
      'download',
      'complete',
      {
        filePath,
        fileName: basename(filePath),
        fileSize: statSync(filePath).size,
        url: metadata.originalUrl || url,
      },
      null,
      downloadDuration
    );
    
    // Schedule cleanup of the temporary file
    ytdlpService.scheduleFileCleanup(filePath, 30000);
    
    // Get file stats
    const stats = statSync(filePath);
    const fileSize = stats.size;
    const fileName = basename(filePath);

    // Create a readable stream
    const fileStream = createReadStream(filePath);

    // Create the response with proper headers
    const response = new NextResponse(fileStream as any, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileSize.toString(),
        'X-Video-ID': videoId,
        'X-Checkpoint-Saved': 'true',
      },
    });

    return response;
  } catch (error) {
    console.error('Download error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to download video';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
