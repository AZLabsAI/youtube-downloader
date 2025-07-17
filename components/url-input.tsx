'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface URLInputProps {
  onSubmit: (url: string) => void;
}

const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+(&[\w=]*)?$/;

const SAMPLE_URLS = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ'
];

export function URLInput({ onSubmit }: URLInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateYouTubeURL = (url: string): boolean => {
    return YOUTUBE_URL_REGEX.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeURL(url)) {
      setError('Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(url);
    } catch (err: any) {
      if (err.message?.includes('Invalid YouTube URL')) {
        setError('This YouTube URL is not valid or the video is not available');
      } else if (err.message?.includes('private') || err.message?.includes('unavailable')) {
        setError('This video is private or unavailable');
      } else if (err.message?.includes('network') || err.message?.includes('timeout')) {
        setError('Network error. Please check your connection and try again');
      } else {
        setError('Failed to fetch video information. Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="url"
          placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError('');
          }}
          className={error ? 'border-destructive' : ''}
          disabled={isLoading}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Supported formats: YouTube video URLs (youtube.com/watch?v=... or youtu.be/...)
        </p>
      </div>
      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? 'Loading...' : 'Get Video Info'}
      </Button>
    </form>
  );
}