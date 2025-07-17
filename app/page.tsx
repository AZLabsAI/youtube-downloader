'use client';

import { useState, useRef } from 'react';
import { URLInput } from '@/components/url-input';
import { VideoMetadata } from '@/components/video-metadata';
import { QualityOptions } from '@/components/quality-options';
import { HeroSection } from '@/components/hero-section';

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
  const urlInputRef = useRef<HTMLDivElement>(null);

  const scrollToUrlInput = () => {
    urlInputRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    <>
      {/* Hero Section */}
      <HeroSection onGetStarted={scrollToUrlInput} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="space-y-8">
          {/* URL Input Section */}
          <div ref={urlInputRef} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20">
            <h2 className="text-2xl font-semibold mb-6 text-center">Enter YouTube URL</h2>
            <URLInput onSubmit={handleURLSubmit} />
          </div>

          {/* Video Info or Placeholder */}
          {isLoading ? (
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-8 text-center shadow-lg border border-white/20">
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
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-8 text-center shadow-lg border border-white/20">
              <p className="text-muted-foreground">
                Enter a YouTube URL to see video information and download options
              </p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-12 p-6 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl text-center border border-white/20">
          <p className="text-sm text-muted-foreground">
            <strong>Disclaimer:</strong> This tool is for educational purposes only. 
            Please respect YouTube's Terms of Service and copyright laws. 
            Only download videos you have permission to download.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Downloads are rate-limited to 5 per minute per IP address.
          </p>
        </div>
      </div>
    </>
  );
}