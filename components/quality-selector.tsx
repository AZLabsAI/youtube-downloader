'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface QualitySelectorProps {
  formats: Format[];
  videoUrl: string;
  onDownload: (formatId: string) => void;
}

export function QualitySelector({ formats, videoUrl: _videoUrl, onDownload }: QualitySelectorProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Calculating...';
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) {
      return `${mb.toFixed(1)} MB`;
    }
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  // Add error handling for formats array
  const safeFormats = formats || [];

  const videoFormats = safeFormats.filter(f => 
    f.hasVideo || (f.vcodec && f.vcodec !== 'none')
  );
  const audioFormats = safeFormats.filter(f => 
    f.hasAudio || (f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'))
  );

  const displayFormats = activeTab === 'video' ? videoFormats : audioFormats;

  const handleDownload = async () => {
    if (!selectedFormat) {
      setDownloadError('Please select a format first');
      return;
    }

    setIsDownloading(true);
    setDownloadError('');
    
    try {
      await onDownload(selectedFormat);
    } catch (err: any) {
      if (err.message?.includes('network') || err.message?.includes('timeout')) {
        setDownloadError('Network error. Please check your connection and try again');
      } else if (err.message?.includes('not found') || err.message?.includes('404')) {
        setDownloadError('Video not found or no longer available');
      } else if (err.message?.includes('private') || err.message?.includes('unavailable')) {
        setDownloadError('This video is private or unavailable for download');
      } else {
        setDownloadError('Download failed. Please try again');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Download Options</CardTitle>
        <div className="flex gap-2 mt-4">
          <Button
            variant={activeTab === 'video' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTab('video');
              setSelectedFormat('');
              setDownloadError('');
            }}
          >
            Video ({videoFormats.length})
          </Button>
          <Button
            variant={activeTab === 'audio' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTab('audio');
              setSelectedFormat('');
              setDownloadError('');
            }}
          >
            Audio Only ({audioFormats.length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayFormats.map((format) => (
            <div
              key={format.format_id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedFormat === format.format_id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
              onClick={() => {
                setSelectedFormat(format.format_id);
                setDownloadError('');
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="format"
                    value={format.format_id}
                    checked={selectedFormat === format.format_id}
                    onChange={() => {
                      setSelectedFormat(format.format_id);
                      setDownloadError('');
                    }}
                    className="h-4 w-4"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{format.quality}</span>
                      <Badge variant="secondary" className="text-xs">
                        {format.format.toUpperCase()}
                      </Badge>
                      {format.fps && format.fps > 30 && (
                        <Badge variant="outline" className="text-xs">
                          {format.fps}fps
                        </Badge>
                      )}
                    </div>
                    {format.resolution && (
                      <span className="text-sm text-muted-foreground">
                        {format.resolution}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {displayFormats.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No {activeTab} formats available for this video
          </p>
        )}

        {downloadError && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {downloadError}
          </div>
        )}

        {selectedFormat && (
          <Button
            className="w-full mt-4"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? 'Downloading...' : `Download ${activeTab === 'video' ? 'Video' : 'Audio'}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}