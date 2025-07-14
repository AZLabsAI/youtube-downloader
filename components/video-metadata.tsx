import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VideoMetadataProps {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channel: string;
  views?: number;
  uploadDate?: string;
}

export function VideoMetadata({
  title,
  thumbnail,
  duration,
  channel,
  views,
  uploadDate,
}: VideoMetadataProps) {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          {/* Thumbnail */}
          <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
            <Image
              src={thumbnail}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 300px"
            />
            <Badge 
              variant="secondary" 
              className="absolute bottom-2 right-2 bg-black/80 text-white"
            >
              {formatDuration(duration)}
            </Badge>
          </div>

          {/* Video Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold line-clamp-2">{title}</h3>
              <p className="text-muted-foreground mt-1">{channel}</p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {views && <span>{formatViews(views)}</span>}
              {uploadDate && (
                <>
                  {views && <span>•</span>}
                  <span>{new Date(uploadDate).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}