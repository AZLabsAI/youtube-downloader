import { spawn } from 'child_process';
import { execSync } from 'child_process';
import { unlink, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

export interface VideoMetadata {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channel: string;
  channelUrl?: string;
  views?: number;
  uploadDate?: string;
  uploadDateFormatted?: string;
  description?: string;
  formats: VideoFormat[];
  originalUrl?: string;
  sanitizedTitle?: string;
  qualityOptions: QualityOption[];
}

export interface QualityOption {
  id: string;
  title: string;
  description: string;
  quality: string;
  format: string;
  estimatedSize?: string;
  icon: string;
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
  abr?: number; // Audio bitrate
  vbr?: number; // Video bitrate
  tbr?: number; // Total bitrate
  width?: number;
  height?: number;
}

class YTDLPService {
  private ytdlpPath: string = 'yt-dlp';
  private tempFiles: Set<string> = new Set();
  private cookiesFile: string = '/tmp/yt-cookies.txt';
  private cookiesInitialized: boolean = false;

  /**
   * Clean up temporary files
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
      this.tempFiles.delete(filePath);
      console.log(`Cleaned up temporary file: ${filePath}`);
    } catch (error) {
      console.error(`Failed to cleanup temporary file ${filePath}:`, error);
    }
  }

  /**
   * Clean up all temporary files
   */
  async cleanupAllTempFiles(): Promise<void> {
    const cleanupPromises = Array.from(this.tempFiles).map(filePath => 
      this.cleanupTempFile(filePath)
    );
    await Promise.all(cleanupPromises);
  }

  /**
   * Schedule cleanup of a specific file after a delay
   */
  scheduleFileCleanup(filePath: string, delayMs: number = 30000): void {
    setTimeout(async () => {
      await this.cleanupTempFile(filePath);
    }, delayMs);
  }

  /**
   * Initialize cookies from environment variable
   * Cookies should be base64 encoded and stored in YTDLP_COOKIES env var
   */
  private async initializeCookies(): Promise<void> {
    if (this.cookiesInitialized) {
      return;
    }

    const cookiesEnv = process.env.YTDLP_COOKIES;
    
    if (!cookiesEnv) {
      console.log('No YTDLP_COOKIES environment variable found - running without authentication');
      this.cookiesInitialized = true;
      return;
    }

    try {
      // Decode base64 cookies
      const cookiesContent = Buffer.from(cookiesEnv, 'base64').toString('utf-8');
      
      // Validate cookie format (should start with Netscape header or have youtube.com)
      if (!cookiesContent.includes('youtube.com') && !cookiesContent.includes('Netscape')) {
        console.warn('Cookie content does not appear to be valid YouTube cookies');
      }
      
      // Write to temp file
      await writeFile(this.cookiesFile, cookiesContent, 'utf-8');
      
      console.log('YouTube cookies initialized successfully from environment variable');
      this.cookiesInitialized = true;
    } catch (error) {
      console.error('Failed to initialize cookies:', error);
      this.cookiesInitialized = true; // Mark as initialized to avoid retrying
    }
  }

  /**
   * Get common yt-dlp args with cookies if available
   */
  private async getBaseArgs(): Promise<string[]> {
    const args: string[] = [];
    
    // Initialize cookies if not already done
    await this.initializeCookies();

    // Add cookies if available
    if (existsSync(this.cookiesFile)) {
      args.push('--cookies', this.cookiesFile);
      console.log('Using cookies for authentication');
    }

    return args;
  }

  /**
   * Extract video metadata from a YouTube URL
   */
  async getVideoMetadata(url: string): Promise<VideoMetadata> {
    const baseArgs = await this.getBaseArgs();
    
    return new Promise((resolve, reject) => {
      const args = [
        ...baseArgs,
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
          
          // Format upload date properly
          const uploadDate = metadata.upload_date;
          let uploadDateFormatted = '';
          if (uploadDate) {
            try {
              // upload_date is in format YYYYMMDD
              const year = uploadDate.substring(0, 4);
              const month = uploadDate.substring(4, 6);
              const day = uploadDate.substring(6, 8);
              const dateObj = new Date(year, month - 1, day);
              uploadDateFormatted = dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
            } catch (dateError) {
              console.error('Error formatting upload date:', dateError);
              uploadDateFormatted = uploadDate;
            }
          }

          // Sanitize title for filename
          const sanitizedTitle = this.sanitizeFilename(metadata.title);

          const processedFormats = this.processFormats(metadata.formats || []);
          const qualityOptions = this.generateQualityOptions(processedFormats);

          const videoMetadata: VideoMetadata = {
            id: metadata.id,
            title: metadata.title,
            thumbnail: metadata.thumbnail,
            duration: metadata.duration,
            channel: metadata.uploader || metadata.channel,
            channelUrl: metadata.uploader_url || metadata.channel_url,
            views: metadata.view_count,
            uploadDate: uploadDate,
            uploadDateFormatted: uploadDateFormatted,
            description: metadata.description,
            formats: processedFormats,
            originalUrl: url,
            sanitizedTitle: sanitizedTitle,
            qualityOptions: qualityOptions
          };

          resolve(videoMetadata);
        } catch (err) {
          reject(new Error(`Failed to parse yt-dlp output: ${err}`));
        }
      });
    });
  }

  /**
   * Sanitize title for use as filename with proper formatting
   */
  private sanitizeFilename(title: string): string {
    // Remove or replace characters that are not allowed in filenames
    let cleaned = title
      .replace(/[<>:"\/\\|?*\x00-\x1f]/g, '') // Remove invalid filename characters
      .replace(/[\s_-]+/g, ' ') // Replace multiple spaces/underscores/hyphens with single space
      .replace(/[.,;!?]+/g, '') // Remove punctuation
      .trim()
      .replace(/^\.+|\.+$/g, ''); // Remove leading/trailing dots
    
    // Capitalize first letter of each word for better readability
    cleaned = cleaned
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
    
    // Limit length to prevent filesystem issues
    if (cleaned.length > 120) {
      cleaned = cleaned.substring(0, 120).trim();
      // Remove partial word at end
      const lastSpace = cleaned.lastIndexOf(' ');
      if (lastSpace > 80) {
        cleaned = cleaned.substring(0, lastSpace);
      }
    }
    
    return cleaned || 'YouTube Video';
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
        resolution: f.resolution || (f.width && f.height ? `${f.width}x${f.height}` : undefined),
        filesize: f.filesize || f.filesize_approx,
        format_note: f.format_note,
        fps: f.fps,
        vcodec: f.vcodec,
        acodec: f.acodec,
        url: f.url,
        abr: f.abr, // Audio bitrate
        vbr: f.vbr, // Video bitrate
        tbr: f.tbr, // Total bitrate
        width: f.width,
        height: f.height
      }))
      .sort((a, b) => {
        // Sort by quality (resolution) for video formats
        if (a.height && b.height) {
          return b.height - a.height;
        }
        // Sort by bitrate for audio formats
        if (a.abr && b.abr) {
          return b.abr - a.abr;
        }
        return 0;
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
    // For video formats
    if (format.vcodec && format.vcodec !== 'none') {
      if (format.format_note) {
        return format.format_note;
      }
      
      if (format.height) {
        const fps = format.fps ? ` ${format.fps}fps` : '';
        const codec = format.vcodec?.includes('av01') ? ' (AV1)' : format.vcodec?.includes('vp9') ? ' (VP9)' : '';
        return `${format.height}p${fps}${codec}`;
      }
      
      if (format.resolution) {
        return format.resolution;
      }
    }
    
    // For audio formats
    if (format.acodec && format.acodec !== 'none') {
      if (format.format_note) {
        return format.format_note;
      }
      
      if (format.abr) {
        const codec = format.acodec?.includes('opus') ? ' (Opus)' : format.acodec?.includes('aac') ? ' (AAC)' : '';
        return `Audio ${format.abr}kbps${codec}`;
      }
      
      return `Audio ${format.ext?.toUpperCase()}`;
    }
    
    return format.format_id || 'Unknown';
  }

  /**
   * Generate quality options for the video
   */
  private generateQualityOptions(formats: VideoFormat[]): QualityOption[] {
    const videoFormats = formats.filter(f => f.vcodec && f.vcodec !== 'none');
    const audioFormats = formats.filter(f => f.acodec && f.acodec !== 'none');
    const combinedFormats = formats.filter(f => 
      f.vcodec && f.vcodec !== 'none' && 
      f.acodec && f.acodec !== 'none'
    );

    const options: QualityOption[] = [];

    // Option 1: Best Quality (Merged)
    if (videoFormats.length > 0 && audioFormats.length > 0) {
      const bestVideo = videoFormats.reduce((prev, curr) => 
        (curr.height || 0) > (prev.height || 0) ? curr : prev
      );
      const bestAudio = audioFormats.reduce((prev, curr) => 
        (curr.abr || 0) > (prev.abr || 0) ? curr : prev
      );
      
      options.push({
        id: 'best_merged',
        title: 'Best Quality',
        description: `${bestVideo.height || 'Unknown'}p + ${bestAudio.abr || 'High'} kbps audio`,
        quality: `${bestVideo.height || 'Unknown'}p`,
        format: 'mp4',
        estimatedSize: this.estimateMergedSize(bestVideo, bestAudio),
        icon: '🎬🎵'
      });
    }

    // Option 2: Combined Format (fallback to available quality)
    if (combinedFormats.length > 0) {
      const bestCombined = combinedFormats.reduce((prev, curr) => 
        (curr.height || 0) > (prev.height || 0) ? curr : prev
      );

      // If no 720p or below, use the best available
      let qualityLabel = bestCombined.height ? `${bestCombined.height}p` : 'Standard';
      if (bestCombined.height && bestCombined.height <= 720) {
        qualityLabel = `${bestCombined.height}p Combined`;
      } else {
        qualityLabel = `${bestCombined.height}p Combined`;
      }

      options.push({
        id: 'combined_720p',
        title: 'Combined Format',
        description: `${bestCombined.height || 'Standard'}p with built-in audio`,
        quality: qualityLabel,
        format: bestCombined.ext || 'mp4',
        estimatedSize: this.formatFileSize(bestCombined.filesize),
        icon: '📺'
      });
    }

    // Option 3: Audio Only
    if (audioFormats.length > 0) {
      const bestAudio = audioFormats.reduce((prev, curr) => 
        (curr.abr || 0) > (prev.abr || 0) ? curr : prev
      );

      options.push({
        id: 'audio_only',
        title: 'Audio Only',
        description: `${bestAudio.abr || 'High'} kbps audio`,
        quality: `${bestAudio.abr || 'High'} kbps`,
        format: 'mp3',
        estimatedSize: this.formatFileSize(bestAudio.filesize),
        icon: '🎵'
      });
    }

    return options;
  }

  /**
   * Estimate merged file size
   */
  private estimateMergedSize(videoFormat: VideoFormat, audioFormat: VideoFormat): string {
    const videoSize = videoFormat.filesize || 0;
    const audioSize = audioFormat.filesize || 0;
    const totalSize = videoSize + audioSize;
    
    if (totalSize === 0) {
      return 'Calculating...';
    }
    
    return this.formatFileSize(totalSize);
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes?: number): string {
    if (!bytes) return 'Calculating...';
    
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) {
      return `${mb.toFixed(1)} MB`;
    }
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  }

  /**
   * Download a video with progress tracking
   */
  downloadVideo(
    url: string, 
    formatId: string,
    videoTitle?: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create filename based on video title or use timestamp
      const timestamp = Date.now();
      const sanitizedTitle = videoTitle ? this.sanitizeFilename(videoTitle) : `youtube-download-${timestamp}`;
      const outputTemplate = `/tmp/${sanitizedTitle}.%(ext)s`;
      
      const args = [
        '-f', formatId,
        '-o', outputTemplate,
        '--newline',
        '--no-playlist',
        '--no-warnings',
        url
      ];

      console.log('Starting download with args:', args);
      const process = spawn(this.ytdlpPath, args);
      let downloadedFilePath = '';
      let errorOutput = '';

      process.stdout.on('data', (chunk) => {
        const output = chunk.toString();
        console.log('yt-dlp output:', output);

        // Extract the actual file path from the output
        const destinationMatch = output.match(/\[download\] Destination: (.+)/);
        if (destinationMatch) {
          downloadedFilePath = destinationMatch[1].trim();
        }

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
        const error = chunk.toString();
        console.error('yt-dlp stderr:', error);
        errorOutput += error;
      });

      process.on('close', (code) => {
        console.log(`yt-dlp process exited with code ${code}`);
        
        if (code !== 0) {
          reject(new Error(`Download failed with code ${code}: ${errorOutput}`));
          return;
        }

        if (downloadedFilePath) {
          // Track the file for cleanup
          this.tempFiles.add(downloadedFilePath);
          resolve(downloadedFilePath);
        } else {
          // Fallback: try to find the file based on the template
          try {
            const findResult = execSync(`find /tmp -name "${sanitizedTitle}.*" -type f`, { encoding: 'utf8' });
            const foundFiles = findResult.trim().split('\n').filter((f: string) => f);
            if (foundFiles.length > 0) {
              const filePath = foundFiles[0];
              this.tempFiles.add(filePath);
              resolve(filePath);
            } else {
              reject(new Error('Downloaded file not found'));
            }
          } catch (findError) {
            reject(new Error('Failed to locate downloaded file'));
          }
        }
      });
    });
  }

  /**
   * Download video with specific quality option
   */
  downloadVideoWithQuality(
    url: string,
    qualityId: string,
    videoTitle?: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    const timestamp = Date.now();
    const sanitizedTitle = videoTitle ? this.sanitizeFilename(videoTitle) : `youtube-download-${timestamp}`;
    
    return this.getBaseArgs().then((baseArgs) => {
      return new Promise<string>((resolve, reject) => {
        let args: string[] = [...baseArgs];
        let outputTemplate = '';

        switch (qualityId) {
          case 'best_merged':
            outputTemplate = `/tmp/${sanitizedTitle}.%(ext)s`;
            args = [
              ...args,
              '-f', 'bestvideo+bestaudio',
              '--merge-output-format', 'mp4',
              '-o', outputTemplate,
              '--newline',
              '--no-playlist',
              '--no-warnings',
              url
          ];
          break;

        case 'combined_720p':
          outputTemplate = `/tmp/${sanitizedTitle}.%(ext)s`;
          args = [
            ...args,
            '-f', 'best[height<=720][acodec!=none]/best[height<=480][acodec!=none]/best[acodec!=none]',
            '-o', outputTemplate,
            '--newline',
            '--no-playlist',
            '--no-warnings',
            url
          ];
          break;

        case 'audio_only':
          outputTemplate = `/tmp/${sanitizedTitle}.%(ext)s`;
          args = [
            ...args,
            '-f', 'bestaudio',
            '--extract-audio',
            '--audio-format', 'mp3',
            '-o', outputTemplate,
            '--newline',
            '--no-playlist',
            '--no-warnings',
            url
          ];
          break;

        default:
          reject(new Error('Invalid quality option'));
          return;
      }

      console.log('Starting download with args:', args);
      const process = spawn(this.ytdlpPath, args);
      let downloadedFilePath = '';
      let errorOutput = '';

      process.stdout.on('data', (chunk) => {
        const output = chunk.toString();
        console.log('yt-dlp output:', output);

        // Extract the actual file path from the output
        const destinationMatch = output.match(/\[download\] Destination: (.+)/);
        if (destinationMatch) {
          downloadedFilePath = destinationMatch[1].trim();
        }

        // Parse progress for regular downloads
        const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?\s*(\d+\.?\d*\w+)\s+at\s+(\d+\.?\d*\w+\/s)/);
        if (progressMatch && onProgress) {
          onProgress({
            percentage: parseFloat(progressMatch[1]),
            size: progressMatch[2],
            speed: progressMatch[3]
          });
        }

        // Parse progress for merge operations
        const mergeMatch = output.match(/\[Merger\] Merging formats into "(.+)"/);
        if (mergeMatch) {
          downloadedFilePath = mergeMatch[1].trim();
        }

        // Parse progress for audio extraction
        const extractMatch = output.match(/\[ExtractAudio\] Destination: (.+)/);
        if (extractMatch) {
          downloadedFilePath = extractMatch[1].trim();
        }
      });

      process.stderr.on('data', (chunk) => {
        const error = chunk.toString();
        console.error('yt-dlp stderr:', error);
        errorOutput += error;
      });

      process.on('close', (code) => {
        console.log(`yt-dlp process exited with code ${code}`);
        
        if (code !== 0) {
          reject(new Error(`Download failed with code ${code}: ${errorOutput}`));
          return;
        }

        if (downloadedFilePath) {
          this.tempFiles.add(downloadedFilePath);
          resolve(downloadedFilePath);
        } else {
          // Fallback: try to find the file based on the template
          try {
            const findResult = execSync(`find /tmp -name "${sanitizedTitle}.*" -type f`, { encoding: 'utf8' });
            const foundFiles = findResult.trim().split('\n').filter((f: string) => f);
            if (foundFiles.length > 0) {
              const filePath = foundFiles[0];
              this.tempFiles.add(filePath);
              resolve(filePath);
            } else {
              reject(new Error('Downloaded file not found'));
            }
          } catch (findError) {
            reject(new Error('Failed to locate downloaded file'));
          }
        }
      });
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
