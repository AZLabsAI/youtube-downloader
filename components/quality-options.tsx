import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QualityOption {
  id: string;
  title: string;
  description: string;
  quality: string;
  format: string;
  estimatedSize?: string;
  icon: string;
}

interface QualityOptionsProps {
  options: QualityOption[];
  onDownload: (qualityId: string) => void;
}

export function QualityOptions({ options, onDownload }: QualityOptionsProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const handleDownload = async (qualityId: string) => {
    setIsDownloading(true);
    setDownloadError('');
    
    try {
      await onDownload(qualityId);
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

  if (options.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            No download options available for this video
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Download Options</CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose your preferred quality and format
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {options.map((option) => (
            <div
              key={option.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{option.icon}</div>
                <div>
                  <h4 className="font-medium">{option.title}</h4>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {option.quality}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {option.format.toUpperCase()}
                    </Badge>
                    {option.estimatedSize && (
                      <Badge variant="outline" className="text-xs">
                        {option.estimatedSize}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => handleDownload(option.id)}
                disabled={isDownloading}
                size="sm"
              >
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
            </div>
          ))}
        </div>

        {downloadError && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {downloadError}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 