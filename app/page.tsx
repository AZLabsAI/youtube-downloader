'use client';

import { useState } from 'react';
import { URLInput } from '@/components/url-input';
import { VideoMetadata } from '@/components/video-metadata';
import { QualityOptions } from '@/components/quality-options';

interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channel: string;
  channelUrl?: string;
  views?: number;
  uploadDate?: string;
  uploadDateFormatted?: string;
  originalUrl?: string;
  qualityOptions: QualityOption[];
  formats: Format[];
}

interface QualityOption {
  id: string;
  title: string;
  description: string;
  quality: string;
  format: string;
  estimatedSize?: string;
  icon: string;
}

interface Format {
  quality: string;
  format: string;
  filesize?: number;
  format_id: string;
  resolution?: string;
  fps?: number;
  hasVideo: boolean;
  hasAudio: boolean;
  vcodec?: string;
  acodec?: string;
}

export default function Home() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [downloadUrl, setDownloadUrl] = useState('');

  const handleURLSubmit = async (url: string) => {
    setDownloadUrl(url);
    setIsLoading(true);
    try {
      const response = await fetch('/api/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch video info');
      }

      const data = await response.json();
      const mappedFormats = data.formats.map((format: any) => ({
        quality: format.quality || 'Unknown',
        format: format.format || format.ext || 'mp4',
        filesize: format.filesize,
        format_id: format.format_id,
        resolution: format.resolution,
        fps: format.fps,
        hasVideo: format.hasVideo || (format.vcodec && format.vcodec !== 'none'),
        hasAudio: format.hasAudio || (format.acodec && format.acodec !== 'none'),
        vcodec: format.vcodec || 'none',
        acodec: format.acodec || 'none',
      }));

      setVideoInfo({
        ...data,
        formats: mappedFormats,
      });
    } catch (error) {
      console.error('Error fetching video info:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (qualityId: string) => {
    if (!downloadUrl) return;
    
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: downloadUrl, qualityId }),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Create a blob from the response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link to trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = ''; // Browser will use the filename from Content-Disposition header
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download video. Please try again.');
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Enhanced Hero Section */}
      <div className="text-center mb-16">
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-purple-500/10 to-blue-500/10 blur-3xl -z-10" />
          
          {/* Main heading */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            YouTube Downloader
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Download videos and audio from YouTube in high quality
          </p>
          
          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-green-500/10 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              High Quality Downloads
            </div>
            <div className="flex items-center gap-2 bg-blue-500/10 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Multiple Formats
            </div>
            <div className="flex items-center gap-2 bg-purple-500/10 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Fast & Secure
            </div>
          </div>
          
          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">4K</div>
              <div className="text-sm text-muted-foreground">Max Resolution</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">MP4</div>
              <div className="text-sm text-muted-foreground">Video Format</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">MP3</div>
              <div className="text-sm text-muted-foreground">Audio Format</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">Free</div>
              <div className="text-sm text-muted-foreground">Always</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* URL Input Section */}
        <div className="bg-card rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Enter YouTube URL</h2>
          <URLInput onSubmit={handleURLSubmit} />
        </div>

        {/* Video Info or Placeholder */}
        {isLoading ? (
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Loading video information...</p>
          </div>
        ) : videoInfo ? (
          <div className="space-y-6">
            <VideoMetadata {...videoInfo} />
            <QualityOptions
              options={videoInfo.qualityOptions}
              onDownload={handleDownload}
            />
          </div>
        ) : (
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              Enter a YouTube URL to see video information and download options
            </p>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-12 p-4 bg-muted/30 rounded-lg text-center">
        <p className="text-sm text-muted-foreground">
          <strong>Disclaimer:</strong> This tool is for educational purposes only. 
          Please respect YouTube's Terms of Service and copyright laws. 
          Only download videos you have permission to download.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Downloads are rate-limited to 5 per minute per IP address.
        </p>
      </div>
    </main>
  );
}