import { NextRequest, NextResponse } from 'next/server';
import { ytdlpService } from '@/services/ytdlp.service';

export async function POST(request: NextRequest) {
  try {
    const { url, cookies } = await request.json();

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

    // Get video metadata with optional cookies
    const metadata = await ytdlpService.getVideoMetadata(url, cookies);

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
      formats: formats
    });

  } catch (error: any) {
    console.error('Error fetching metadata:', error);
    
    // Check if the error is related to bot detection
    const errorMessage = error.message || 'Failed to fetch video metadata';
    const isBotDetection = errorMessage.includes('Sign in to confirm') || 
                          errorMessage.includes('not a bot') ||
                          errorMessage.includes('cookies');
    
    if (isBotDetection) {
      return NextResponse.json(
        { 
          error: 'YouTube detected automated access. Please upload your YouTube cookies to continue. Click the "YouTube Cookies" section below and follow the instructions.',
          requiresCookies: true
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}