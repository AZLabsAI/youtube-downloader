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
}

interface QualitySelectorProps {
  formats: Format[];
  videoUrl: string;
  onDownload: (formatId: string) => void;
}

export function QualitySelector({ formats, videoUrl, onDownload }: QualitySelectorProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) {
      return `${mb.toFixed(1)} MB`;
    }
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  const videoFormats = formats.filter(f => f.hasVideo);
  const audioFormats = formats.filter(f => !f.hasVideo && f.hasAudio);

  const displayFormats = activeTab === 'video' ? videoFormats : audioFormats;

  const handleDownload = () => {
    if (selectedFormat) {
      onDownload(selectedFormat);
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
            onClick={() => setActiveTab('video')}
          >
            Video
          </Button>
          <Button
            variant={activeTab === 'audio' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('audio')}
          >
            Audio Only
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
              onClick={() => setSelectedFormat(format.format_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="format"
                    value={format.format_id}
                    checked={selectedFormat === format.format_id}
                    onChange={() => setSelectedFormat(format.format_id)}
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
                <span className="text-sm text-muted-foreground">
                  {formatFileSize(format.filesize)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {displayFormats.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No {activeTab} formats available for this video
          </p>
        )}

        {selectedFormat && (
          <Button
            className="w-full mt-4"
            onClick={handleDownload}
          >
            Download {activeTab === 'video' ? 'Video' : 'Audio'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}