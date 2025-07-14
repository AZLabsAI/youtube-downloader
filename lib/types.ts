export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channel: string;
  views?: number;
  uploadDate?: string;
  formats: VideoFormat[];
}

export interface VideoFormat {
  quality: string;
  format: string;
  filesize?: number;
  format_id: string;
  resolution?: string;
  fps?: number;
  hasVideo: boolean;
  hasAudio: boolean;
}

export interface DownloadProgress {
  percentage: number;
  size: string;
  speed: string;
}