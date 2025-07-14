import { NextRequest, NextResponse } from 'next/server';
import { ytdlpService } from '@/services/ytdlp.service';
import { createReadStream, statSync } from 'fs';
import { basename } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { url, formatId } = await request.json();

    if (!url || !formatId) {
      return NextResponse.json(
        { error: 'URL and format ID are required' },
        { status: 400 }
      );
    }

    // Download the video
    const filePath = await ytdlpService.downloadVideo(url, formatId);
    
    // Get file stats
    const stats = statSync(filePath);
    const fileSize = stats.size;
    const fileName = basename(filePath);

    // Create read stream
    const stream = createReadStream(filePath);

    // Create response with proper headers
    const response = new Response(stream as any, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileSize.toString(),
      },
    });

    return response;

  } catch (error: any) {
    console.error('Error downloading video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download video' },
      { status: 500 }
    );
  }
}