"use client";

import { useState } from "react";
import { URLInput } from "@/components/url-input";
import { VideoMetadata } from "@/components/video-metadata";

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
  sanitizedTitle?: string;
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
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleURLSubmit = async (url: string) => {
    setDownloadUrl(url);
    setIsLoading(true);
    setError("");
    setVideoInfo(null);
    setDownloadSuccess(false);

    try {
      const response = await fetch("/api/metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch video info");
      }

      const data = await response.json();

      const mappedFormats = data.formats.map((format: any) => ({
        quality: format.quality || "Unknown",
        format: format.format || format.ext || "mp4",
        filesize: format.filesize,
        format_id: format.format_id,
        resolution: format.resolution,
        fps: format.fps,
        hasVideo:
          format.hasVideo || (format.vcodec && format.vcodec !== "none"),
        hasAudio:
          format.hasAudio || (format.acodec && format.acodec !== "none"),
        vcodec: format.vcodec || "none",
        acodec: format.acodec || "none",
      }));

      setVideoInfo({
        ...data,
        formats: mappedFormats,
      });
    } catch (err: any) {
      setError(
        err.message || "Failed to fetch video information. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDownload = async () => {
    if (!downloadUrl || !videoInfo) return;

    setIsDownloading(true);
    setDownloadProgress(0);
    setError("");

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Always use best quality (merged video + audio)
      const bestQuality = videoInfo.qualityOptions.find(q => q.id === 'best_merged') 
        || videoInfo.qualityOptions[0];

      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: downloadUrl, qualityId: bestQuality.id }),
      });

      if (!response.ok) {
        clearInterval(progressInterval);
        let errorMessage = "Download failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${videoInfo.sanitizedTitle || videoInfo.title}.mp4`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Ensure filename is properly formatted
      filename = formatFilename(filename);

      const blob = await response.blob();

      if (blob.size === 0) {
        clearInterval(progressInterval);
        throw new Error("Downloaded file is empty");
      }

      // Complete progress
      clearInterval(progressInterval);
      setDownloadProgress(100);

      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setDownloadSuccess(true);
        setIsDownloading(false);
        // Success state persists until user manually dismisses
      }, 100);
    } catch (err: any) {
      clearInterval(progressInterval);
      setIsDownloading(false);
      setDownloadProgress(0);
      setError(err.message || "Download failed. Please try again.");
    }
  };

  const formatFilename = (filename: string): string => {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    
    // Clean up the filename
    let cleaned = nameWithoutExt
      // Remove invalid characters
      .replace(/[<>:"\/\\|?*\x00-\x1f]/g, '')
      // Replace multiple spaces/underscores with single space
      .replace(/[\s_]+/g, ' ')
      // Remove leading/trailing spaces and dots
      .trim()
      .replace(/^\.+|\.+$/g, '');
    
    // Capitalize first letter of each word for better readability
    cleaned = cleaned
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    // Limit length
    if (cleaned.length > 100) {
      cleaned = cleaned.substring(0, 100).trim();
    }
    
    // Add extension back
    const extension = filename.match(/\.[^/.]+$/)?.[0] || '.mp4';
    return cleaned + extension;
  };

  return (
    <>
      {/* Enhanced SVG Filters for Authentic Liquid Glass */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          {/* Primary Liquid Glass Distortion Filter */}
          <filter id="liquid-glass-distortion" x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.01 0.015"
              numOctaves="4"
              seed="3"
              result="turbulence"
            />
            <feGaussianBlur in="turbulence" stdDeviation="2" result="smoothNoise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="smoothNoise"
              scale="10"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displacement"
            />
            <feGaussianBlur in="displacement" stdDeviation="0.4" result="finalBlur" />
            <feSpecularLighting
              in="smoothNoise"
              surfaceScale="5"
              specularConstant="1"
              specularExponent="30"
              lightingColor="#ffffff"
              result="specular"
            >
              <fePointLight x="-150" y="-150" z="300" />
            </feSpecularLighting>
            <feComposite in="specular" in2="finalBlur" operator="arithmetic" k1="0" k2="1" k3="0.18" k4="0" result="litGlass" />
            <feComposite in="litGlass" in2="SourceAlpha" operator="in" />
          </filter>
          
          {/* Download Success Glow Filter */}
          <filter id="success-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feFlood floodColor="#10b981" floodOpacity="0.8" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        {/* Rich Ambient Background - Softened for better text contrast */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/15" />
        
        {/* Animated Gradient Orbs - Creating colorful background for glass refraction */}
        <div className="fixed inset-0 opacity-25">
          <div className="absolute inset-0">
            <div className="liquid-orb liquid-orb-blue absolute top-[10%] left-[15%] w-[600px] h-[600px] animate-liquid-breathing" />
            <div className="liquid-orb liquid-orb-purple absolute top-[40%] right-[10%] w-[700px] h-[700px] animate-liquid-breathing" style={{ animationDelay: "2s" }} />
            <div className="liquid-orb liquid-orb-pink absolute bottom-[15%] left-[40%] w-[550px] h-[550px] animate-liquid-breathing" style={{ animationDelay: "4s" }} />
            <div className="liquid-orb liquid-orb-blue absolute top-[60%] left-[5%] w-[450px] h-[450px] animate-liquid-drift" />
            <div className="liquid-orb liquid-orb-purple absolute bottom-[25%] right-[20%] w-[500px] h-[500px] animate-liquid-drift" style={{ animationDelay: "3s" }} />
          </div>
        </div>
        
        {/* Subtle Grid Pattern */}
        <div className="fixed inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }} />
        </div>

        {/* Main Content */}
        <div className="relative z-10 w-full max-w-3xl">
          {/* Main Card - This is what user sees first */}
          {!videoInfo && !isLoading && !error && (
            <div className="liquid-glass-lens rounded-liquid-2xl p-10 sm:p-14 text-center animate-liquid-expand liquid-ambient-glow">
              {/* Minimal Branding */}
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-5 liquid-glass-clear rounded-liquid-2xl shadow-lg">
                  <svg className="w-10 h-10 text-red-500 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold drop-shadow-sm animate-liquid-pulse">
                  Paste your YouTube URL to download
                </p>
              </div>

              <URLInput onSubmit={handleURLSubmit} />
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="liquid-glass-strong rounded-liquid-2xl p-16 text-center animate-liquid-expand liquid-ambient-glow">
              <div className="inline-flex items-center justify-center w-24 h-24 mb-8 liquid-glass-clear rounded-full relative">
                <div className="absolute inset-0 animate-liquid-pulse">
                  <div className="w-full h-full border-[3px] border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
                <div className="absolute inset-0" style={{ animationDirection: "reverse", animationDuration: "2s" }}>
                  <div className="w-full h-full border-[3px] border-purple-500/20 border-b-purple-500 rounded-full animate-spin" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white drop-shadow-sm">
                Fetching video...
              </h3>
              <p className="text-gray-700 dark:text-gray-300 font-medium drop-shadow-sm">
                This will only take a moment
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="liquid-glass-lens rounded-liquid-2xl p-12 text-center border-2 border-red-500/20 animate-liquid-expand">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-br from-red-500 to-rose-500 rounded-liquid-xl shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white drop-shadow-sm">
                Oops!
              </h3>
              <p className="text-red-700 dark:text-red-400 mb-8 leading-relaxed max-w-md mx-auto font-medium drop-shadow-sm">
                {error}
              </p>
              <button
                onClick={() => {
                  setError("");
                  setVideoInfo(null);
                }}
                className="liquid-glass-button px-8 py-4 rounded-liquid-xl text-gray-900 dark:text-white font-bold liquid-light-source"
              >
                Try Another Video
              </button>
            </div>
          )}

          {/* Video Ready - Single Click Download */}
          {videoInfo && !isLoading && !error && !downloadSuccess && (
            <div className="space-y-5 animate-liquid-expand">
              {/* Back Button - Floating at Top */}
              <div className="flex justify-start">
                <button
                  onClick={() => {
                    setVideoInfo(null);
                    setDownloadUrl("");
                    setError("");
                  }}
                  className="
                    liquid-glass-button rounded-liquid-xl px-5 py-3
                    text-sm font-bold text-gray-900 dark:text-white
                    liquid-light-source group/back
                    inline-flex items-center gap-2
                  "
                >
                  <svg className="w-5 h-5 transform group-hover/back:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>New Video</span>
                </button>
              </div>

              {/* Video Preview Card */}
              <VideoMetadata {...videoInfo} />
              
              {/* One-Click Download Button */}
              <div className="liquid-glass-lens rounded-liquid-2xl p-8 sm:p-10 text-center liquid-ambient-glow relative">
                {!isDownloading ? (
                  <>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 drop-shadow-sm">
                      Ready to Download
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-8 font-medium drop-shadow-sm">
                      Best quality • Video + Audio • MP4 Format
                    </p>
                    
                    <button
                      onClick={handleQuickDownload}
                      className="
                        w-full sm:w-auto min-w-[280px] h-16 px-10
                        liquid-glass-button rounded-liquid-xl
                        text-gray-900 dark:text-white font-bold text-lg
                        liquid-light-source group/download
                        relative overflow-hidden
                      "
                    >
                      <span className="relative flex items-center justify-center gap-3">
                        <svg className="w-7 h-7 transform group-hover/download:scale-110 group-active/download:scale-95 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download Video</span>
                      </span>
                    </button>

                    {/* Quality Info */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-sm">
                      {videoInfo.qualityOptions[0] && (
                        <span className="px-3 py-1.5 liquid-glass rounded-liquid text-xs font-bold text-blue-600 dark:text-blue-400">
                          {videoInfo.qualityOptions[0].quality}
                        </span>
                      )}
                    </div>

                    {/* Small Cancel Button - Bottom Right */}
                    <button
                      onClick={() => {
                        setVideoInfo(null);
                        setDownloadUrl("");
                        setError("");
                      }}
                      className="
                        absolute bottom-4 right-4
                        w-10 h-10
                        liquid-glass-clear rounded-liquid
                        text-gray-600 dark:text-gray-400
                        hover:text-red-500 dark:hover:text-red-400
                        hover:bg-red-50/50 dark:hover:bg-red-900/20
                        transition-all duration-300
                        group/cancel
                        flex items-center justify-center
                      "
                      title="Cancel"
                    >
                      <svg className="w-5 h-5 transform group-hover/cancel:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Premium Download Progress Animation */}
                    <div className="mb-8">
                      <div className="inline-flex items-center justify-center w-32 h-32 mb-6 relative">
                        {/* Outer ring */}
                        <svg className="absolute inset-0 w-32 h-32 -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="58"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-gray-200 dark:text-gray-700 opacity-20"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="58"
                            fill="none"
                            stroke="url(#progressGradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 58}`}
                            strokeDashoffset={`${2 * Math.PI * 58 * (1 - downloadProgress / 100)}`}
                            className="transition-all duration-300 ease-out"
                          />
                        </svg>
                        
                        {/* Center icon */}
                        <div className="liquid-glass-clear rounded-full w-20 h-20 flex items-center justify-center animate-liquid-pulse">
                          <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 drop-shadow-sm">
                      Downloading...
                    </h3>
                    <div className="text-4xl font-bold mb-2 liquid-text-gradient drop-shadow-lg">
                      {downloadProgress}%
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium drop-shadow-sm">
                      Preparing your video
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Success State */}
          {downloadSuccess && (
            <div className="liquid-glass-lens rounded-liquid-2xl p-14 sm:p-16 text-center animate-liquid-expand liquid-ambient-glow border-2 border-green-500/30">
              {/* Success Icon with Enhanced Animation */}
              <div className="inline-flex items-center justify-center w-28 h-28 mb-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-liquid-2xl shadow-2xl animate-liquid-success-pop" style={{ filter: "url(#success-glow)" }}>
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Success Message */}
              <h3 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900 dark:text-white drop-shadow-sm">
                Download Complete!
              </h3>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-3 font-semibold drop-shadow-sm">
                Your video has been saved successfully
              </p>
              <p className="text-base text-gray-600 dark:text-gray-400 mb-10 font-medium drop-shadow-sm max-w-md mx-auto">
                Check your downloads folder to find your video. Ready to download another?
              </p>

              {/* Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => {
                    setVideoInfo(null);
                    setDownloadSuccess(false);
                    setDownloadUrl("");
                  }}
                  className="
                    w-full sm:w-auto min-w-[240px]
                    liquid-glass-button rounded-liquid-xl px-8 py-4 
                    text-lg font-bold text-gray-900 dark:text-white 
                    liquid-light-source group/back
                    relative overflow-hidden
                  "
                >
                  <span className="relative flex items-center justify-center gap-3">
                    <svg className="w-6 h-6 transform group-hover/back:scale-110 group-active/back:scale-95 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Download Another Video</span>
                  </span>
                </button>
              </div>

              {/* Helper Text */}
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-6 font-medium">
                Click above when you're ready to continue
              </p>
            </div>
          )}
        </div>


        {/* Gradient definition for progress */}
        <svg className="absolute w-0 h-0">
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </>
  );
}