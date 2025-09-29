"use client";

import Image from "next/image";

interface VideoMetadataProps {
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
}

export function VideoMetadata({
  id,
  title,
  thumbnail,
  duration,
  channel,
  channelUrl,
  views,
  uploadDateFormatted,
}: VideoMetadataProps) {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatViews = (viewCount: number): string => {
    if (viewCount >= 1000000000) {
      return `${(viewCount / 1000000000).toFixed(1)}B`;
    } else if (viewCount >= 1000000) {
      return `${(viewCount / 1000000).toFixed(1)}M`;
    } else if (viewCount >= 1000) {
      return `${(viewCount / 1000).toFixed(1)}K`;
    }
    return viewCount.toString();
  };

  const youtubeUrl = `https://www.youtube.com/watch?v=${id}`;

  return (
    <div className="liquid-glass-lens rounded-liquid-2xl overflow-hidden liquid-light-source">
      {/* Video Thumbnail Preview - Always show screenshot to avoid embed errors */}
      <a 
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative aspect-video overflow-hidden bg-gray-900 group block"
      >
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover transition-all duration-500 group-hover:scale-105"
          sizes="100vw"
          priority
        />
        
        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10" />
        
        {/* Duration Badge */}
        <div className="absolute bottom-4 right-4 z-20 px-3.5 py-2 liquid-glass-strong rounded-liquid text-sm font-bold text-white shadow-xl">
          {formatDuration(duration)}
        </div>
        
        {/* Hover Play Icon */}
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-400">
          <div className="w-20 h-20 liquid-glass-lens rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-all duration-300 shadow-2xl">
            <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </a>

      {/* Content Section - YouTube-style Layout */}
      <div className="p-6 sm:p-7">
        {/* Title - YouTube style */}
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
          {title}
        </h3>

        {/* Stats Row - YouTube style */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-5">
          {views !== undefined && (
            <>
              <span className="font-medium">{formatViews(views)} views</span>
              <span className="text-gray-400">•</span>
            </>
          )}
          {uploadDateFormatted && (
            <span className="font-medium">{uploadDateFormatted}</span>
          )}
        </div>

        {/* Channel & Actions Row - YouTube style */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Channel Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Channel Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>

            {/* Channel Name */}
            <div className="flex-1 min-w-0">
              {channelUrl ? (
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors truncate block"
                >
                  {channel}
                </a>
              ) : (
                <span className="font-semibold text-gray-900 dark:text-white truncate block">
                  {channel}
                </span>
              )}
            </div>
          </div>

          {/* Play on YouTube Button */}
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="
              liquid-glass-button rounded-liquid-lg px-5 py-2.5
              text-sm font-bold text-gray-900 dark:text-white
              liquid-light-source flex items-center gap-2
              whitespace-nowrap
            "
          >
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span>Play on YouTube</span>
          </a>
        </div>
      </div>
    </div>
  );
}