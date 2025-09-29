import { NextResponse } from 'next/server';
import { ytdlpService } from '@/services/ytdlp.service';
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

    // Get video metadata first to get the title
    const metadata = await ytdlpService.getVideoMetadata(url);
    
    // Download the video with the specified quality option
    const filePath = await ytdlpService.downloadVideoWithQuality(url, qualityId, metadata.title);
    
    // Schedule cleanup of the temporary file
    ytdlpService.scheduleFileCleanup(filePath, 30000); // Clean up after 30 seconds
    
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
      },
    });

    return response;
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download video' },
      { status: 500 }
    );
  }
}