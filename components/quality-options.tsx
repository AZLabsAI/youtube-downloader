import { useState } from 'react';

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [activeDownload, setActiveDownload] = useState<string | null>(null);

  const handleDownload = async (qualityId: string) => {
    setIsDownloading(true);
    setDownloadError('');
    setActiveDownload(qualityId);
    
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
      setActiveDownload(null);
    }
  };

  if (options.length === 0) {
    return (
      <div className="liquid-glass-lens rounded-liquid-2xl p-8">
        <p className="text-center text-gray-600 dark:text-gray-400 text-lg">
          No download options available for this video
        </p>
      </div>
    );
  }

  return (
    <div className="liquid-glass-lens rounded-liquid-2xl p-8 sm:p-10 space-y-7 liquid-ambient-glow">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Download Options
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Choose your preferred quality and format
        </p>
      </div>

      {/* Options Grid with Enhanced Glass */}
      <div className="grid gap-5">
        {options.map((option, index) => (
          <div
            key={option.id}
            className="liquid-glass-clear rounded-liquid-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 liquid-interactive liquid-light-source group/option animate-liquid-expand"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Option Info */}
            <div className="flex items-start sm:items-center gap-5 flex-1 min-w-0">
              {/* Icon with Glass Background */}
              <div className="flex-shrink-0 w-16 h-16 liquid-glass rounded-liquid-lg flex items-center justify-center text-4xl transform group-hover/option:scale-110 transition-transform duration-300">
                {option.icon}
              </div>
              
              {/* Details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1.5 truncate">
                  {option.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 truncate">
                  {option.description}
                </p>
                
                {/* Badges with Glass Effect */}
                <div className="flex flex-wrap gap-2.5">
                  <span className="px-3 py-1.5 liquid-glass rounded-liquid text-xs font-bold text-gray-900 dark:text-white">
                    {option.quality}
                  </span>
                  <span className="px-3 py-1.5 liquid-glass rounded-liquid text-xs font-bold text-blue-600 dark:text-blue-400">
                    {option.format.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Download Button with Enhanced Liquid Glass */}
            <button
              onClick={() => handleDownload(option.id)}
              disabled={isDownloading}
              className={`
                flex-shrink-0 h-12 px-7
                liquid-glass-button rounded-liquid-xl
                text-gray-900 dark:text-white font-bold
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-300
                liquid-light-source
                ${activeDownload === option.id ? 'animate-liquid-pulse' : ''}
              `}
            >
              {isDownloading && activeDownload === option.id ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 border-[3px] border-current border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Downloading...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden sm:inline">Download</span>
                  <span className="sm:hidden">Get</span>
                </div>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Error Message with Liquid Glass */}
      {downloadError && (
        <div className="liquid-glass rounded-liquid-lg p-5 border-2 border-red-500/20 animate-liquid-expand">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center shadow-md">
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed flex-1 pt-0.5">
              {downloadError}
            </p>
          </div>
        </div>
      )}

      {/* Info Banner with Subtle Glass */}
      <div className="liquid-glass rounded-liquid-lg p-5 border-2 border-blue-500/15">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              <span className="font-bold text-gray-900 dark:text-white">Best Quality</span> merges video and audio streams for maximum quality using ffmpeg. Files are automatically cleaned after download.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}