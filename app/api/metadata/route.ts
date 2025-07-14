import { NextRequest, NextResponse } from 'next/server';
import { ytdlpService } from '@/services/ytdlp.service';

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

    // Get video metadata
    const metadata = await ytdlpService.getVideoMetadata(url);

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
    }));

    return NextResponse.json({
      id: metadata.id,
      title: metadata.title,
      thumbnail: metadata.thumbnail,
      duration: metadata.duration,
      channel: metadata.channel,
      views: metadata.views,
      uploadDate: metadata.uploadDate,
      formats: formats
    });

  } catch (error: any) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch video metadata' },
      { status: 500 }
    );
  }
}