"use client";

import { useState, useEffect, useMemo } from "react";
import { URLInput } from "@/components/url-input";
import { VideoMetadata } from "@/components/video-metadata";
import { ResumeModal } from "@/components/resume-modal";

function seededRandom(seed: number): number {
  // Deterministic, engine-stable pseudo-random in [0, 1)
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

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

interface Checkpoint {
  videoId: string;
  videoUrl: string;
  lastCompletedStep: string | null;
  nextStep: string;
  timeElapsed: number;
  createdAt: number;
  lastUpdatedAt: number;
  checkpoints: any;
}

export default function Home() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [incompleteCheckpoints, setIncompleteCheckpoints] = useState<Checkpoint[]>([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Fetch incomplete checkpoints on component mount
  useEffect(() => {
    const fetchCheckpoints = async () => {
      try {
        const response = await fetch("/api/checkpoint/list");
        if (response.ok) {
          const data = await response.json();
          setIncompleteCheckpoints(data.checkpoints);
          
          // Show resume modal if there are incomplete checkpoints
          if (data.checkpoints.length > 0) {
            setSelectedCheckpoint(data.checkpoints[0]);
            setShowResumeModal(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch checkpoints:", error);
      }
    };

    fetchCheckpoints();
  }, []);

  const handleResumeCheckpoint = (videoId: string, skipToStep?: string) => {
    // In a real implementation, this would fetch the checkpoint state
    // and resume the workflow from where it left off
    console.log("Resuming from checkpoint:", videoId, skipToStep);
    setShowResumeModal(false);
    // You could initialize the workflow here
  };

  const handleDeleteCheckpoint = (videoId: string) => {
    // Remove from the list
    setIncompleteCheckpoints(prev => prev.filter(cp => cp.videoId !== videoId));
    setShowResumeModal(false);
    if (incompleteCheckpoints.length > 0) {
      const nextCheckpoint = incompleteCheckpoints.find(cp => cp.videoId !== videoId);
      if (nextCheckpoint) {
        setSelectedCheckpoint(nextCheckpoint);
        setShowResumeModal(true);
      }
    }
  };

  const handleStartFresh = () => {
    setShowResumeModal(false);
  };

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
      const bestQuality =
        videoInfo.qualityOptions.find((q) => q.id === "best_merged") ||
        videoInfo.qualityOptions[0];

      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: downloadUrl,
          qualityId: bestQuality.id,
        }),
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
      await new Promise((resolve) => setTimeout(resolve, 500));

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
      .replace(/[<>:"\/\\|?*\x00-\x1f]/g, "")
      // Replace multiple spaces/underscores with single space
      .replace(/[\s_]+/g, " ")
      // Remove leading/trailing spaces and dots
      .trim()
      .replace(/^\.+|\.+$/g, "");

    // Capitalize first letter of each word for better readability
    cleaned = cleaned
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    // Limit length
    if (cleaned.length > 100) {
      cleaned = cleaned.substring(0, 100).trim();
    }

    // Add extension back
    const extension = filename.match(/\.[^/.]+$/)?.[0] || ".mp4";
    return cleaned + extension;
  };

  return (
    <>
      {/* Resume Checkpoint Modal */}
      {showResumeModal && selectedCheckpoint && (
        <ResumeModal
          checkpoint={selectedCheckpoint}
          onResume={handleResumeCheckpoint}
          onDelete={handleDeleteCheckpoint}
          onStartFresh={handleStartFresh}
        />
      )}

      {/* Enhanced SVG Filters for Authentic Liquid Glass */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          {/* Primary Liquid Glass Distortion Filter */}
          <filter
            id="liquid-glass-distortion"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            filterUnits="objectBoundingBox"
            primitiveUnits="userSpaceOnUse"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.01 0.015"
              numOctaves="4"
              seed="3"
              result="turbulence"
            />
            <feGaussianBlur
              in="turbulence"
              stdDeviation="2"
              result="smoothNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="smoothNoise"
              scale="10"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displacement"
            />
            <feGaussianBlur
              in="displacement"
              stdDeviation="0.4"
              result="finalBlur"
            />
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
            <feComposite
              in="specular"
              in2="finalBlur"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="0.18"
              k4="0"
              result="litGlass"
            />
            <feComposite in="litGlass" in2="SourceAlpha" operator="in" />
          </filter>

          {/* Download Success Glow Filter */}
          <filter
            id="success-glow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
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
            <div
              className="liquid-orb liquid-orb-purple absolute top-[40%] right-[10%] w-[700px] h-[700px] animate-liquid-breathing"
              style={{ animationDelay: "2s" }}
            />
            <div
              className="liquid-orb liquid-orb-pink absolute bottom-[15%] left-[40%] w-[550px] h-[550px] animate-liquid-breathing"
              style={{ animationDelay: "4s" }}
            />
            <div className="liquid-orb liquid-orb-blue absolute top-[60%] left-[5%] w-[450px] h-[450px] animate-liquid-drift" />
            <div
              className="liquid-orb liquid-orb-purple absolute bottom-[25%] right-[20%] w-[500px] h-[500px] animate-liquid-drift"
              style={{ animationDelay: "3s" }}
            />
          </div>
        </div>

        {/* Subtle Grid Pattern */}
        <div className="fixed inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
            `,
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 w-full max-w-3xl">
          {/* Main Card - This is what user sees first */}
          {!videoInfo && !isLoading && !error && (
            <div className="liquid-glass-lens rounded-liquid-2xl p-10 sm:p-14 text-center animate-liquid-expand liquid-ambient-glow">
              {/* Minimal Branding */}
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-5 liquid-glass-clear rounded-liquid-2xl shadow-lg group cursor-default animate-liquid-float-subtle">
                  <svg
                    className="w-10 h-10 text-red-500 drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold drop-shadow-sm">
                  Paste your YouTube URL to download
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center justify-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 liquid-glass rounded text-[10px] font-mono">⌘V</kbd>
                  <span>to paste</span>
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
                <div
                  className="absolute inset-0"
                  style={{
                    animationDirection: "reverse",
                    animationDuration: "2s",
                  }}
                >
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
                <svg
                  className="w-10 h-10 text-white"
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
            <div className="space-y-4 animate-liquid-expand">
              {/* Back Button - Compact at Top */}
              <button
                onClick={() => {
                  setVideoInfo(null);
                  setDownloadUrl("");
                  setError("");
                }}
                className="
                  liquid-glass-clear rounded-liquid-lg px-4 py-2.5
                  text-sm font-bold text-gray-700 dark:text-gray-300
                  hover:bg-white/40 dark:hover:bg-white/10
                  transition-all duration-300 group/back
                  inline-flex items-center gap-2
                "
              >
                <svg
                  className="w-4 h-4 transform group-hover/back:-translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span>New Video</span>
              </button>

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
                        <svg
                          className="w-7 h-7 transform group-hover/download:scale-110 group-active/download:scale-95 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        <span>Download Video</span>
                      </span>
                    </button>

                    {/* Quality Info */}
                    <div className="mt-6 flex items-center justify-center gap-3">
                      {videoInfo.qualityOptions[0] && (
                        <div className="flex items-center gap-2.5 px-4 py-2.5 liquid-glass rounded-liquid-lg">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse" />
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                            {videoInfo.qualityOptions[0].quality}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {videoInfo.qualityOptions[0].format.toUpperCase()}
                          </span>
                          {videoInfo.qualityOptions[0].estimatedSize && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-500">
                                {videoInfo.qualityOptions[0].estimatedSize}
                              </span>
                            </>
                          )}
                        </div>
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
                      <svg
                        className="w-5 h-5 transform group-hover/cancel:rotate-90 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </>
                ) : (
                  <EpicDownloadAnimation 
                    progress={downloadProgress} 
                    videoTitle={videoInfo.title}
                    thumbnail={videoInfo.thumbnail}
                  />
                )}
              </div>
            </div>
          )}

          {/* Success State */}
          {downloadSuccess && (
            <SuccessCelebration 
              onDownloadAnother={() => {
                setVideoInfo(null);
                setDownloadSuccess(false);
                setDownloadUrl("");
              }}
            />
          )}
        </div>

        {/* Gradient definition for progress */}
        <svg className="absolute w-0 h-0">
          <defs>
            <linearGradient
              id="progressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
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

// Epic Download Animation Component
function EpicDownloadAnimation({ 
  progress, 
  videoTitle,
  thumbnail 
}: { 
  progress: number;
  videoTitle: string;
  thumbnail: string;
}) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const phase: "connecting" | "downloading" | "processing" | "finalizing" =
    progress < 15
      ? "connecting"
      : progress < 80
        ? "downloading"
        : progress < 95
          ? "processing"
          : "finalizing";
  
  // Smooth progress animation
  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayProgress(prev => {
        const diff = progress - prev;
        if (Math.abs(diff) < 0.5) return progress;
        return prev + diff * 0.15;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [progress]);
  
  const phaseMessages = {
    connecting: { title: 'Establishing Connection', subtitle: 'Connecting to YouTube servers...' },
    downloading: { title: 'Downloading', subtitle: 'Transferring video data...' },
    processing: { title: 'Processing', subtitle: 'Merging video and audio streams...' },
    finalizing: { title: 'Almost Done', subtitle: 'Preparing your file...' }
  };
  
  // Generate data stream particles
  const dataParticles = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: seededRandom(i * 1000 + 1) * 100,
      delay: seededRandom(i * 1000 + 2) * 2,
      duration: 1.5 + seededRandom(i * 1000 + 3) * 1,
      size: 2 + seededRandom(i * 1000 + 4) * 4,
      opacity: 0.3 + seededRandom(i * 1000 + 5) * 0.5,
    })), []
  );
  
  // Generate orbiting dots
  const orbitDots = useMemo(() => 
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      delay: i * 0.5,
      color: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'][i % 6]
    })), []
  );

  return (
    <div className="relative py-8 overflow-hidden">
      {/* Animated Background Overlay */}
      <div className="absolute inset-0 download-overlay-gradient animate-liquid-pulse" />
      
      {/* Data Stream Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {dataParticles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-b from-blue-400 to-purple-500"
            style={{
              left: `${particle.left}%`,
              width: particle.size,
              height: particle.size * 3,
              opacity: particle.opacity,
              animation: `dataStream ${particle.duration}s linear infinite`,
              animationDelay: `${particle.delay}s`,
              filter: 'blur(1px)'
            }}
          />
        ))}
      </div>
      
      {/* Main Download Visualization */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Epic Progress Ring System */}
        <div className="relative w-48 h-48 mb-8">
          
          {/* Outer Pulsing Rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="absolute w-48 h-48 rounded-full border-2 border-blue-500/20 animate-pulse-ring"
              style={{ animationDelay: '0s' }}
            />
            <div 
              className="absolute w-48 h-48 rounded-full border-2 border-purple-500/20 animate-pulse-ring"
              style={{ animationDelay: '0.5s' }}
            />
            <div 
              className="absolute w-48 h-48 rounded-full border-2 border-pink-500/20 animate-pulse-ring"
              style={{ animationDelay: '1s' }}
            />
          </div>
          
          {/* Rotating Outer Ring */}
          <svg className="absolute inset-0 w-48 h-48 animate-ring-rotate" viewBox="0 0 192 192">
            <defs>
              <linearGradient id="ringGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="96"
              cy="96"
              r="92"
              fill="none"
              stroke="url(#ringGradient1)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="150 430"
            />
          </svg>
          
          {/* Counter-Rotating Inner Ring */}
          <svg className="absolute inset-4 w-40 h-40 animate-ring-rotate-reverse" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="ringGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="80"
              cy="80"
              r="76"
              fill="none"
              stroke="url(#ringGradient2)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="120 358"
            />
          </svg>
          
          {/* Progress Ring */}
          <svg className="absolute inset-8 w-32 h-32 -rotate-90" viewBox="0 0 128 128">
            {/* Background track */}
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-gray-200/20 dark:text-gray-700/30"
            />
            {/* Progress arc */}
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 58}`}
              strokeDashoffset={`${2 * Math.PI * 58 * (1 - displayProgress / 100)}`}
              className="transition-all duration-150 ease-out progress-glow"
              style={{ filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))' }}
            />
          </svg>
          
          {/* Center Content - Morphing Blob with Thumbnail */}
          <div className="absolute inset-12 flex items-center justify-center">
            <div className="relative w-24 h-24 animate-morph-blob overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm">
              {/* Thumbnail preview */}
              <img 
                src={thumbnail} 
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
              />
              {/* Download icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-white drop-shadow-lg animate-wave"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Orbiting Particles */}
          <div className="absolute inset-0 flex items-center justify-center">
            {orbitDots.map((dot) => (
              <div
                key={dot.id}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: dot.color,
                  animation: `orbit ${3 + dot.id * 0.3}s linear infinite`,
                  animationDelay: `${dot.delay}s`,
                  boxShadow: `0 0 10px ${dot.color}, 0 0 20px ${dot.color}`
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Progress Percentage */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <span className="text-6xl font-black liquid-text-gradient tracking-tight">
              {Math.round(displayProgress)}
            </span>
            <span className="text-3xl font-bold text-gray-400 ml-1">%</span>
          </div>
        </div>
        
        {/* Phase Status */}
        <div className="text-center animate-phase-in" key={phase}>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 drop-shadow-sm">
            {phaseMessages[phase].title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            {phaseMessages[phase].subtitle}
          </p>
        </div>
        
        {/* Video Title */}
        <div className="mt-6 px-6 py-3 liquid-glass rounded-liquid-xl max-w-md">
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">
            {videoTitle}
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-6 w-full max-w-xs">
          <div className="h-1.5 bg-gray-200/30 dark:bg-gray-700/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${displayProgress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-sweep" />
            </div>
          </div>
        </div>
        
        {/* Speed indicator (simulated) */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {phase === 'downloading' ? 'High Speed' : 'Processing'}
          </span>
          <span>•</span>
          <span>Secure Connection</span>
        </div>
      </div>
    </div>
  );
}

// Success Celebration Component
function SuccessCelebration({ onDownloadAnother }: { onDownloadAnother: () => void }) {
  const [showConfetti, setShowConfetti] = useState(true);
  
  // Generate confetti particles
  const confettiParticles = useMemo(() => 
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: seededRandom(i * 2000 + 1) * 100,
      delay: seededRandom(i * 2000 + 2) * 0.5,
      duration: 2 + seededRandom(i * 2000 + 3) * 2,
      size: 6 + seededRandom(i * 2000 + 4) * 8,
      color: [
        "#3b82f6",
        "#8b5cf6",
        "#ec4899",
        "#10b981",
        "#f59e0b",
        "#06b6d4",
        "#ef4444",
      ][Math.floor(seededRandom(i * 2000 + 5) * 7)],
      rotation: seededRandom(i * 2000 + 6) * 360,
      rounded: seededRandom(i * 2000 + 7) > 0.5,
    })), []
  );
  
  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="liquid-glass-lens rounded-liquid-2xl p-10 sm:p-14 text-center animate-liquid-expand liquid-ambient-glow border-2 border-green-500/30 relative overflow-hidden">
      
      {/* Confetti Explosion */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confettiParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute"
              style={{
                left: `${particle.left}%`,
                top: '-20px',
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                borderRadius: particle.rounded ? "50%" : "2px",
                animation: `confettiFall ${particle.duration}s ease-out forwards`,
                animationDelay: `${particle.delay}s`,
                transform: `rotate(${particle.rotation}deg)`,
                opacity: 0.9
              }}
            />
          ))}
        </div>
      )}
      
      {/* Radiating Success Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-64 h-64 rounded-full border-2 border-green-500/20 animate-pulse-ring" style={{ animationDelay: '0s' }} />
        <div className="absolute w-64 h-64 rounded-full border-2 border-emerald-500/20 animate-pulse-ring" style={{ animationDelay: '0.3s' }} />
        <div className="absolute w-64 h-64 rounded-full border-2 border-teal-500/20 animate-pulse-ring" style={{ animationDelay: '0.6s' }} />
      </div>
      
      {/* Success Icon with Burst Animation */}
      <div className="relative z-10">
        <div className="relative inline-block mb-8">
          {/* Glowing backdrop */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-liquid-2xl blur-2xl opacity-50 animate-liquid-pulse"
            style={{ transform: 'scale(1.3)' }}
          />
          
          {/* Main icon container */}
          <div
            className="relative inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-500 rounded-liquid-2xl shadow-2xl animate-success-burst"
          >
            {/* Animated checkmark */}
            <svg
              className="w-16 h-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                className="animate-draw-check"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          
          {/* Sparkles around icon */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-liquid-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="absolute -bottom-1 -left-3 w-3 h-3 bg-blue-400 rounded-full animate-liquid-pulse" style={{ animationDelay: '0.4s' }} />
          <div className="absolute top-4 -left-4 w-2 h-2 bg-pink-400 rounded-full animate-liquid-pulse" style={{ animationDelay: '0.6s' }} />
          <div className="absolute -bottom-3 right-2 w-3 h-3 bg-purple-400 rounded-full animate-liquid-pulse" style={{ animationDelay: '0.3s' }} />
        </div>

        {/* Success Message */}
        <div className="animate-phase-in" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-4xl sm:text-5xl font-black mb-4 liquid-text-gradient drop-shadow-sm">
            Download Complete!
          </h3>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-2 font-semibold drop-shadow-sm">
            Your video has been saved successfully
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-8 font-medium">
            Check your downloads folder 📁
          </p>
        </div>

        {/* Stats badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-8 animate-phase-in" style={{ animationDelay: '0.5s' }}>
          <div className="px-4 py-2 liquid-glass rounded-liquid-lg flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">High Quality</span>
          </div>
          <div className="px-4 py-2 liquid-glass rounded-liquid-lg flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Audio Included</span>
          </div>
          <div className="px-4 py-2 liquid-glass rounded-liquid-lg flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ready to Watch</span>
          </div>
        </div>

        {/* Call-to-Action Button */}
        <div className="animate-phase-in" style={{ animationDelay: '0.7s' }}>
          <button
            onClick={onDownloadAnother}
            className="
              w-full sm:w-auto min-w-[280px]
              liquid-glass-button rounded-liquid-xl px-10 py-5
              text-lg font-bold text-gray-900 dark:text-white
              liquid-light-source group/back
              relative overflow-hidden
            "
          >
            <span className="relative flex items-center justify-center gap-3">
              <svg
                className="w-6 h-6 transform group-hover/back:rotate-180 transition-transform duration-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Download Another Video</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
