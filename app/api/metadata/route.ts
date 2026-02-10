import { NextRequest, NextResponse } from 'next/server';
import { ytdlpService } from '@/services/ytdlp.service';
import { potProviderService } from '@/services/pot-provider.service';
import { checkpointService } from '@/services/checkpoint.service';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+(&[\w=]*)?$/;
    if (!youtubeRegex.test(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Ensure POT provider is running (required for restricted videos)
    await potProviderService.start();

    // Get video metadata
    const metadata = await ytdlpService.getVideoMetadata(url);

    // Initialize checkpoint if not already started
    const videoId = metadata.id;
    let checkpointExists = checkpointService.hasCheckpoints(videoId);
    
    if (!checkpointExists) {
      try {
        checkpointService.initializeWorkflow(videoId, url);
        checkpointExists = true;
      } catch (error) {
        console.error('Error initializing checkpoint:', error);
        // Continue anyway, checkpoint creation is not critical for metadata fetch
      }
    }

    // Process formats for client
    const formats = metadata.formats.map(f => ({
      quality: f.quality,
      format: f.ext,
      filesize: f.filesize,
      format_id: f.format_id,
      resolution: f.resolution,
      fps: f.fps,
      hasVideo: f.vcodec !== 'none',
      hasAudio: f.acodec !== 'none',
      vcodec: f.vcodec,
      acodec: f.acodec,
    }));

    return NextResponse.json({
      id: metadata.id,
      title: metadata.title,
      thumbnail: metadata.thumbnail,
      duration: metadata.duration,
      channel: metadata.channel,
      channelUrl: metadata.channelUrl,
      views: metadata.views,
      uploadDate: metadata.uploadDate,
      uploadDateFormatted: metadata.uploadDateFormatted,
      originalUrl: metadata.originalUrl,
      qualityOptions: metadata.qualityOptions,
      formats: formats,
      checkpointInitialized: checkpointExists,
    });

  } catch (error: any) {
    console.error('Error fetching metadata:', error);
    
    const errorMessage = error.message || 'Failed to fetch video metadata';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
