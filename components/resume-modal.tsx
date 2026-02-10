"use client";

import { useState } from "react";

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

interface ResumeModalProps {
  checkpoint: Checkpoint;
  onResume: (videoId: string, skipToStep?: string) => void;
  onDelete: (videoId: string) => void;
  onStartFresh: () => void;
}

export function ResumeModal({
  checkpoint,
  onResume,
  onDelete,
  onStartFresh,
}: ResumeModalProps) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const steps = [
    "download",
    "transcribe",
    "detect-moments",
    "generate-clips",
    "generate-metadata",
  ];

  const getStepLabel = (step: string) => {
    const labels: { [key: string]: string } = {
      download: "📥 Download Video",
      transcribe: "📝 Transcribe Audio",
      "detect-moments": "⚡ Detect Moments",
      "generate-clips": "✂️ Generate Clips",
      "generate-metadata": "📋 Generate Metadata",
    };
    return labels[step] || step;
  };

  const getStepEmoji = (step: string) => {
    const emojis: { [key: string]: string } = {
      download: "📥",
      transcribe: "📝",
      "detect-moments": "⚡",
      "generate-clips": "✂️",
      "generate-metadata": "📋",
    };
    return emojis[step] || "•";
  };

  const getStepStatus = (step: string) => {
    const stepCheckpoint = checkpoint.checkpoints[step];
    if (!stepCheckpoint) return "pending";
    return stepCheckpoint.status === "complete" ? "complete" : "failed";
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete checkpoint for video ${checkpoint.videoId}?`)) {
      setIsDeleting(true);
      try {
        await fetch(`/api/checkpoint/${checkpoint.videoId}`, {
          method: "DELETE",
        });
        onDelete(checkpoint.videoId);
      } catch (error) {
        console.error("Error deleting checkpoint:", error);
        alert("Failed to delete checkpoint");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSkipToStep = async (step: string) => {
    try {
      const response = await fetch("/api/checkpoint/skip-to-step", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId: checkpoint.videoId,
          targetStep: step,
        }),
      });

      if (response.ok) {
        onResume(checkpoint.videoId, step);
      } else {
        alert("Failed to skip to step");
      }
    } catch (error) {
      console.error("Error skipping to step:", error);
      alert("Failed to skip to step");
    }
  };

  const handleResume = () => {
    onResume(
      checkpoint.videoId,
      selectedStep || checkpoint.nextStep
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="liquid-glass-strong rounded-liquid-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 dark:border-white/10">
        <div className="p-6 sm:p-8 border-b border-white/20 dark:border-white/10 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Resume Workflow
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
            An incomplete workflow was found. Resume from where you left off or start fresh.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Video Info */}
          <div className="liquid-glass rounded-liquid-lg p-4 sm:p-5 border border-white/20 dark:border-white/10">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">
              📹 Video URL
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 break-all font-mono bg-white/50 dark:bg-black/20 p-2 rounded-liquid">
              {checkpoint.videoUrl}
            </p>
            <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>✓ Started {formatDate(checkpoint.createdAt)}</p>
              <p>✓ Last updated {formatDate(checkpoint.lastUpdatedAt)}</p>
            </div>
          </div>

          {/* Progress Info */}
          <div className="liquid-glass-lens rounded-liquid-lg p-4 sm:p-5 border border-blue-500/30 dark:border-blue-500/20 bg-gradient-to-br from-blue-50/50 dark:from-blue-950/20 to-transparent">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                  Last Step
                </p>
                <p className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-300 mt-2 break-words">
                  {checkpoint.lastCompletedStep
                    ? getStepLabel(checkpoint.lastCompletedStep)
                    : "Not started"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                  Elapsed Time
                </p>
                <p className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-300 mt-2">
                  {formatTime(checkpoint.timeElapsed)}
                </p>
              </div>
            </div>
          </div>

          {/* Step Selection */}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm uppercase tracking-wide">
                ⚡ Resume or Skip To Step
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Select where you want to continue:
              </p>
            </div>

            <div className="space-y-3">
              {steps.map((step) => {
                const status = getStepStatus(step);
                const isCompleted = status === "complete";
                const isNextStep = step === checkpoint.nextStep;
                const isSelected = selectedStep === step;

                return (
                  <button
                    key={step}
                    onClick={() => setSelectedStep(step)}
                    className={`w-full text-left p-3 sm:p-4 rounded-liquid-lg border-2 transition-all duration-300 ${
                      isSelected
                        ? "border-blue-500/60 bg-blue-50/50 dark:bg-blue-950/30 liquid-glass-strong"
                        : "border-white/30 dark:border-white/15 liquid-glass hover:border-blue-400/40 dark:hover:border-blue-400/30"
                    } ${!isCompleted && !isNextStep ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    disabled={!isCompleted && step !== checkpoint.nextStep}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-lg sm:text-xl flex-shrink-0">{getStepEmoji(step)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                            {getStepLabel(step)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {isCompleted ? (
                              <>
                                ✓ Done in{" "}
                                {formatTime(
                                  checkpoint.checkpoints[step]?.duration || 0
                                )}
                              </>
                            ) : isNextStep ? (
                              "Next to resume"
                            ) : (
                              "Locked"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        ) : isCompleted ? (
                          <span className="text-green-500 text-lg font-bold">✓</span>
                        ) : isNextStep ? (
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/20 dark:border-white/10">
            <button
              onClick={() => handleResume()}
              className="
                flex-1 liquid-glass-button rounded-liquid-lg
                bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
                text-white font-bold py-3 px-4 transition-all duration-300
                text-sm sm:text-base
              "
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Resume Workflow
              </span>
            </button>
            <button
              onClick={onStartFresh}
              className="
                flex-1 liquid-glass rounded-liquid-lg
                text-gray-900 dark:text-white font-bold py-3 px-4
                hover:liquid-glass-strong transition-all duration-300
                text-sm sm:text-base
              "
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Start Fresh
              </span>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="
                flex-1 liquid-glass rounded-liquid-lg
                text-red-600 dark:text-red-400 font-bold py-3 px-4
                hover:bg-red-50/50 dark:hover:bg-red-950/20
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-300
                text-sm sm:text-base
              "
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {isDeleting ? "Deleting..." : "Delete"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
