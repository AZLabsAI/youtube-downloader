"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface URLInputProps {
  onSubmit: (url: string) => void;
}

const YOUTUBE_URL_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+(&[\w=]*)?$/;

const SAMPLE_URL = "https://www.youtube.com/watch?v=jNQXAC9IVRw";

export function URLInput({ onSubmit }: URLInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (url.trim()) {
      const valid = YOUTUBE_URL_REGEX.test(url);
      setIsValid(valid);
      setShowValidation(true);
    } else {
      setIsValid(false);
      setShowValidation(false);
      setHasAutoSubmitted(false);
    }
    setError("");
  }, [url]);

  // Auto-submit when valid URL is detected
  useEffect(() => {
    if (isValid && !isLoading && !hasAutoSubmitted) {
      // Small delay to ensure user finished typing/pasting
      const timer = setTimeout(() => {
        if (isValid && !hasAutoSubmitted) {
          setHasAutoSubmitted(true);
          handleAutoSubmit();
        }
      }, 500); // 500ms delay after valid URL is detected

      return () => clearTimeout(timer);
    }
  }, [isValid, isLoading, hasAutoSubmitted]);

  const handleAutoSubmit = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      await onSubmit(url);
    } catch (err: any) {
      setError(err.message || "Failed to fetch video information. Please try again.");
      setHasAutoSubmitted(false); // Allow retry
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      inputRef.current?.focus();
      return;
    }

    if (!YOUTUBE_URL_REGEX.test(url)) {
      setError("Please enter a valid YouTube URL");
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(url);
    } catch (err: any) {
      setError(err.message || "Failed to fetch video information. Please try again.");
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      inputRef.current?.focus();
    } catch (err) {
      // Clipboard access denied - user will paste manually
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Enhanced Input Field */}
        <div className="relative group">
          <div className="relative">
            <Input
              ref={inputRef}
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={url}
              onChange={handleInputChange}
              disabled={isLoading}
              autoFocus
              className={`
                h-16 px-6 pr-14 text-base
                liquid-glass-clear rounded-liquid-xl
                border-2 transition-all duration-300
                placeholder:text-gray-400 dark:placeholder:text-gray-500
                focus:outline-none focus:ring-4
                text-gray-900 dark:text-white
                ${
                  showValidation && isValid
                    ? "border-green-500/50 focus:border-green-500 focus:ring-green-500/20"
                    : showValidation && !isValid
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                    : "border-blue-500/20 focus:border-blue-500/50 focus:ring-blue-500/20"
                }
                ${isLoading ? "opacity-60 cursor-not-allowed" : ""}
              `}
            />

            {/* Status Icon */}
            {showValidation && url.trim() && !isLoading && (
              <div className="absolute right-5 top-1/2 -translate-y-1/2">
                {isValid ? (
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-liquid-pulse">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>
            )}

            {isLoading && (
              <div className="absolute right-5 top-1/2 -translate-y-1/2">
                <div className="w-8 h-8 border-[3px] border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="liquid-glass rounded-liquid-lg p-4 border-2 border-red-500/20 animate-liquid-expand">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01" />
                </svg>
              </div>
              <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed flex-1 font-medium drop-shadow-sm">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Success Indicator */}
        {showValidation && isValid && !error && !isLoading && !hasAutoSubmitted && (
          <div className="liquid-glass rounded-liquid-lg p-4 border-2 border-green-500/20 animate-liquid-expand">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center animate-liquid-pulse">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-green-700 dark:text-green-400 font-semibold drop-shadow-sm">
                Valid URL detected! Fetching video info...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Button - Optional manual trigger */}
      {!hasAutoSubmitted && (
        <button
          type="submit"
          disabled={isLoading || !isValid}
          className="
            w-full h-16 px-8
            liquid-glass-button rounded-liquid-xl
            text-gray-900 dark:text-white font-bold text-lg
            disabled:opacity-30 disabled:cursor-not-allowed
            group/submit relative overflow-hidden
            liquid-light-source
            active:scale-[0.97]
          "
        >
          <span className="relative flex items-center justify-center gap-3">
            {isLoading ? (
              <>
                <div className="w-6 h-6 border-[3px] border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Fetching video info...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-6 h-6 transform group-hover/submit:scale-110 group-active/submit:scale-90 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Fetch Video Info</span>
              </>
          )}
        </span>
      </button>
    )}

    {/* Gradient for SVG */}
      <svg className="absolute w-0 h-0">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
    </form>
  );
}