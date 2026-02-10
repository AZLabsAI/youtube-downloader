import { spawn } from "child_process";
import { execSync } from "child_process";
import { unlink } from "fs/promises";
import { randomUUID } from "crypto";

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
  abr?: number;
  vbr?: number;
  tbr?: number;
  width?: number;
  height?: number;
}

class YTDLPService {
  private ytdlpPath: string = "yt-dlp";
  private tempFiles: Set<string> = new Set();

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
    const cleanupPromises = Array.from(this.tempFiles).map((filePath) =>
      this.cleanupTempFile(filePath),
    );
    await Promise.all(cleanupPromises);
  }

  /**
   * Schedule file cleanup after a delay
   */
  scheduleFileCleanup(filePath: string, delayMs: number = 30000): void {
    setTimeout(() => {
      this.cleanupTempFile(filePath);
    }, delayMs);
  }

  /**
   * Sanitize filename for safe file creation
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 200);
  }

  /**
   * Get video metadata from YouTube
   */
  async getVideoMetadata(url: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const args = [
        "--dump-json",
        "--no-warnings",
        url,
      ];

      console.log("Extracting video metadata...");
      const process = spawn(this.ytdlpPath, args);
      let data = "";
      let error = "";

      process.stdout.on("data", (chunk) => {
        data += chunk.toString();
      });

      process.stderr.on("data", (chunk) => {
        error += chunk.toString();
      });

      process.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp exited with code ${code}: ${error}`));
          return;
        }

        try {
          const parsed = JSON.parse(data);

          const videoMetadata: VideoMetadata = {
            id: parsed.id || "",
            title: parsed.title || "Unknown",
            thumbnail: parsed.thumbnail || "",
            duration: parsed.duration || 0,
            channel: parsed.uploader || "Unknown",
            channelUrl: parsed.uploader_url,
            views: parsed.view_count,
            uploadDate: parsed.upload_date,
            uploadDateFormatted: parsed.upload_date
              ? new Date(
                  parsed.upload_date.replace(
                    /(\d{4})(\d{2})(\d{2})/,
                    "$1-$2-$3"
                  )
                ).toLocaleDateString()
              : undefined,
            description: parsed.description,
            formats: parsed.formats.map((f: any) => ({
              format_id: f.format_id,
              ext: f.ext || "mp4",
              quality: f.format_note || `${f.width || 0}x${f.height || 0}`,
              resolution: f.resolution || `${f.width || 0}x${f.height || 0}`,
              filesize: f.filesize,
              fps: f.fps,
              vcodec: f.vcodec || "none",
              acodec: f.acodec || "none",
              url: f.url,
              abr: f.abr,
              vbr: f.vbr,
              tbr: f.tbr,
              width: f.width,
              height: f.height,
            })),
            originalUrl: url,
            sanitizedTitle: this.sanitizeFilename(parsed.title || "Unknown"),
            qualityOptions: this.buildQualityOptions(parsed.formats),
          };

          resolve(videoMetadata);
        } catch (err) {
          reject(new Error(`Failed to parse yt-dlp output: ${err}`));
        }
      });
    });
  }

  /**
   * Download video with specified quality (POT tokens automatic)
   */
  downloadVideo(
    url: string,
    formatId: string,
    videoTitle?: string,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const sanitizedTitle = videoTitle
        ? this.sanitizeFilename(videoTitle)
        : `youtube-download-${timestamp}`;

      const outputTemplate = `/tmp/${sanitizedTitle}-${timestamp}.%(ext)s`;

      const args = [
        "-f",
        formatId,
        "-o",
        outputTemplate,
        "--no-warnings",
        url,
      ];

      console.log("Starting download with args:", args);
      const process = spawn(this.ytdlpPath, args);
      let downloadedFilePath = "";
      let errorOutput = "";

      process.stdout.on("data", (chunk) => {
        const output = chunk.toString();
        console.log("yt-dlp output:", output);

        const destinationMatch = output.match(/\[download\] Destination: (.+)/);
        if (destinationMatch) {
          downloadedFilePath = destinationMatch[1].trim();
        }

        const progressMatch = output.match(
          /\[download\]\s+(\d+\.?\d*)%\s+of\s+~?\s*(\d+\.?\d*\w+)\s+at\s+(\d+\.?\d*\w+\/s)/,
        );

        if (progressMatch && onProgress) {
          onProgress({
            percentage: parseFloat(progressMatch[1]),
            size: progressMatch[2],
            speed: progressMatch[3],
          });
        }
      });

      process.stderr.on("data", (chunk) => {
        const error = chunk.toString();
        console.error("yt-dlp stderr:", error);
        errorOutput += error;
      });

      process.on("close", (code) => {
        console.log(`yt-dlp process exited with code ${code}`);

        if (code !== 0) {
          reject(
            new Error(`Download failed with code ${code}: ${errorOutput}`),
          );
          return;
        }

        if (downloadedFilePath) {
          this.tempFiles.add(downloadedFilePath);
          resolve(downloadedFilePath);
        } else {
          if (process.exitCode === 0 && errorOutput.length === 0) {
            resolve(outputTemplate.replace("%(ext)s", "mp4"));
          } else {
            reject(new Error("Downloaded file not found"));
          }
        }
      });
    });
  }

  /**
   * Download video with quality option
   */
  downloadVideoWithQuality(
    url: string,
    qualityId: string,
    videoTitle?: string,
  ): Promise<string> {
    return this.downloadVideo(url, qualityId, videoTitle);
  }

  /**
   * Build quality options from formats
   */
  private buildQualityOptions(formats: any[]): QualityOption[] {
    const options: QualityOption[] = [];
    const seen = new Set<string>();

    // Group by resolution and get best quality
    const qualityMap = new Map<string, any>();

    for (const format of formats) {
      const resolution = format.resolution || `${format.width || 0}x${format.height || 0}`;
      const quality = format.format_note || resolution;

      if (!qualityMap.has(resolution)) {
        qualityMap.set(resolution, format);
      }
    }

    // Sort by resolution (highest first)
    const sortedResolutions = Array.from(qualityMap.entries())
      .sort((a, b) => {
        const aHeight = a[1].height || 0;
        const bHeight = b[1].height || 0;
        return bHeight - aHeight;
      })
      .slice(0, 5);

    for (const [resolution, format] of sortedResolutions) {
      const key = format.format_id;
      if (!seen.has(key)) {
        seen.add(key);
        const icon = this.getQualityIcon(resolution);

        options.push({
          id: format.format_id,
          title: resolution,
          description: `${format.ext.toUpperCase()} - ${format.format_note || ""}`,
          quality: resolution,
          format: format.ext || "mp4",
          estimatedSize: format.filesize
            ? `${(format.filesize / 1024 / 1024).toFixed(2)} MB`
            : undefined,
          icon: icon,
        });
      }
    }

    return options;
  }

  /**
   * Get emoji icon for quality
   */
  private getQualityIcon(resolution: string): string {
    if (resolution.includes("4320")) return "🎬";
    if (resolution.includes("2160")) return "📺";
    if (resolution.includes("1440")) return "📺";
    if (resolution.includes("1080")) return "🖥️";
    if (resolution.includes("720")) return "💻";
    if (resolution.includes("480")) return "📱";
    return "📹";
  }
}

export const ytdlpService = new YTDLPService();

export interface DownloadProgress {
  percentage: number;
  size: string;
  speed: string;
}
