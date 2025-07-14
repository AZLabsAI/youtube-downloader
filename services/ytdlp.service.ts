import { spawn } from 'child_process';

export interface VideoMetadata {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channel: string;
  views?: number;
  uploadDate?: string;
  description?: string;
  formats: VideoFormat[];
}

export interface VideoFormat {
  format_id: string;
  ext: string;
  quality: string;
  resolution?: string;
  filesize?: number;
  format_note?: string;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  url: string;
}

class YTDLPService {
  private ytdlpPath: string = 'yt-dlp';

  /**
   * Extract video metadata from a YouTube URL
   */
  async getVideoMetadata(url: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const args = [
        '--dump-json',
        '--no-playlist',
        '--no-warnings',
        url
      ];

      const process = spawn(this.ytdlpPath, args);
      let data = '';
      let error = '';

      process.stdout.on('data', (chunk) => {
        data += chunk.toString();
      });

      process.stderr.on('data', (chunk) => {
        error += chunk.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp exited with code ${code}: ${error}`));
          return;
        }

        try {
          const metadata = JSON.parse(data);
          const videoMetadata: VideoMetadata = {
            id: metadata.id,
            title: metadata.title,
            thumbnail: metadata.thumbnail,
            duration: metadata.duration,
            channel: metadata.uploader || metadata.channel,
            views: metadata.view_count,
            uploadDate: metadata.upload_date,
            description: metadata.description,
            formats: this.processFormats(metadata.formats || [])
          };
          resolve(videoMetadata);
        } catch (err) {
          reject(new Error(`Failed to parse yt-dlp output: ${err}`));
        }
      });
    });
  }

  /**
   * Process and filter video formats
   */
  private processFormats(formats: any[]): VideoFormat[] {
    // Filter and sort formats
    const processedFormats = formats
      .filter(f => f.url && (f.vcodec !== 'none' || f.acodec !== 'none'))
      .map(f => ({
        format_id: f.format_id,
        ext: f.ext,
        quality: this.getQualityLabel(f),
        resolution: f.resolution || `${f.width}x${f.height}`,
        filesize: f.filesize || f.filesize_approx,
        format_note: f.format_note,
        fps: f.fps,
        vcodec: f.vcodec,
        acodec: f.acodec,
        url: f.url
      }))
      .sort((a, b) => {
        // Sort by quality (resolution)
        const aHeight = parseInt(a.resolution?.split('x')[1] || '0');
        const bHeight = parseInt(b.resolution?.split('x')[1] || '0');
        return bHeight - aHeight;
      });

    // Remove duplicates and return top formats
    const uniqueFormats = new Map<string, VideoFormat>();
    processedFormats.forEach(format => {
      const key = `${format.quality}-${format.ext}`;
      if (!uniqueFormats.has(key) || (format.filesize && format.filesize > 0)) {
        uniqueFormats.set(key, format);
      }
    });

    return Array.from(uniqueFormats.values());
  }

  /**
   * Get quality label for a format
   */
  private getQualityLabel(format: any): string {
    if (format.format_note) {
      return format.format_note;
    }
    
    if (format.height) {
      return `${format.height}p${format.fps ? ` ${format.fps}fps` : ''}`;
    }
    
    if (format.abr) {
      return `Audio ${format.abr}kbps`;
    }
    
    return format.format_id;
  }

  /**
   * Download a video with progress tracking
   */
  downloadVideo(
    url: string, 
    formatId: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputPath = `/tmp/download-${Date.now()}.%(ext)s`;
      const args = [
        '-f', formatId,
        '-o', outputPath,
        '--newline',
        '--no-playlist',
        url
      ];

      const process = spawn(this.ytdlpPath, args);
      let lastOutput = '';

      process.stdout.on('data', (chunk) => {
        const output = chunk.toString();
        lastOutput = output;

        // Parse progress
        const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?\s*(\d+\.?\d*\w+)\s+at\s+(\d+\.?\d*\w+\/s)/);
        if (progressMatch && onProgress) {
          onProgress({
            percentage: parseFloat(progressMatch[1]),
            size: progressMatch[2],
            speed: progressMatch[3]
          });
        }
      });

      process.stderr.on('data', (chunk) => {
        console.error('yt-dlp error:', chunk.toString());
      });

      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Download failed with code ${code}`));
          return;
        }

        // Extract actual filename from output
        const filenameMatch = lastOutput.match(/\[download\] Destination: (.+)/);
        if (filenameMatch) {
          resolve(filenameMatch[1]);
        } else {
          resolve(outputPath.replace('%(ext)s', 'mp4'));
        }
      });
    });
  }
}

export interface DownloadProgress {
  percentage: number;
  size: string;
  speed: string;
}

export const ytdlpService = new YTDLPService();