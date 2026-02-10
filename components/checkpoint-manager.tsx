"use client";

import { useState, useEffect } from "react";

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

interface CheckpointManagerProps {
  onSelectCheckpoint?: (checkpoint: Checkpoint) => void;
}

export function CheckpointManager({ onSelectCheckpoint }: CheckpointManagerProps) {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCheckpoints();
  }, []);

  const fetchCheckpoints = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkpoint/list");
      if (response.ok) {
        const data = await response.json();
        setCheckpoints(data.checkpoints);
      } else {
        throw new Error("Failed to fetch checkpoints");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch checkpoints");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm("Delete this checkpoint?")) return;

    try {
      const response = await fetch(`/api/checkpoint/${videoId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCheckpoints(checkpoints.filter((cp) => cp.videoId !== videoId));
      } else {
        setError("Failed to delete checkpoint");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete checkpoint");
    }
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
    return new Date(timestamp).toLocaleString();
  };

  const getStepEmoji = (step: string | null) => {
    const emojis: { [key: string]: string } = {
      download: "📥",
      transcribe: "📝",
      "detect-moments": "⚡",
      "generate-clips": "✂️",
      "generate-metadata": "📋",
    };
    return emojis[step || ""] || "•";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading checkpoints...</div>
      </div>
    );
  }

  if (checkpoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-gray-500 text-center">
          <p className="text-lg font-semibold">No incomplete checkpoints</p>
          <p className="text-sm mt-2">Start downloading videos to create checkpoints</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Checkpoint Recovery ({checkpoints.length})
        </h3>
        <button
          onClick={fetchCheckpoints}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {checkpoints.map((checkpoint) => (
          <div
            key={checkpoint.videoId}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {checkpoint.videoUrl}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {checkpoint.lastCompletedStep
                      ? `${getStepEmoji(checkpoint.lastCompletedStep)} Last: ${checkpoint.lastCompletedStep}`
                      : "Not started"}
                  </span>
                  <span>⏱️ {formatTime(checkpoint.timeElapsed)}</span>
                  <span>📅 {formatDate(checkpoint.lastUpdatedAt)}</span>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => onSelectCheckpoint?.(checkpoint)}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  Resume
                </button>
                <button
                  onClick={() => handleDelete(checkpoint.videoId)}
                  className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
