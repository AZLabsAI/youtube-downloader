'use client';

import { useState } from 'react';
import { URLInput } from '@/components/url-input';
import { VideoMetadata } from '@/components/video-metadata';
import { QualitySelector } from '@/components/quality-selector';

interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channel: string;
  views?: number;
  uploadDate?: string;
  formats: Format[];
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
      setVideoInfo(data);
    } catch (error) {
      console.error('Error fetching video info:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (formatId: string) => {
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: downloadUrl, formatId }),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'download.mp4';

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download video. Please try again.');
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">YouTube Video Downloader</h1>
        <p className="text-muted-foreground text-lg">
          Download videos and audio from YouTube in various formats and qualities
        </p>
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
            <QualitySelector
              formats={videoInfo.formats}
              videoUrl={downloadUrl}
              onDownload={(formatId) => handleDownload(formatId)}
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