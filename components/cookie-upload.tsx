"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CookieUploadProps {
  onCookiesLoaded: (cookies: any[]) => void;
  cookiesLoaded: boolean;
}

export function CookieUpload({ onCookiesLoaded, cookiesLoaded }: CookieUploadProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCookieFile = (content: string): any[] => {
    const cookies: any[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || line.trim() === '') {
        continue;
      }
      
      // Netscape format: domain	flag	path	secure	expiration	name	value
      const parts = line.split('\t');
      if (parts.length >= 7) {
        cookies.push({
          domain: parts[0].trim(),
          path: parts[2].trim(),
          secure: parts[3].trim() === 'TRUE',
          expires: parseInt(parts[4].trim(), 10),
          name: parts[5].trim(),
          value: parts[6].trim()
        });
      }
    }
    
    return cookies;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // Validate file type
    if (!file.name.endsWith('.txt')) {
      setError("Please upload a .txt file");
      return;
    }

    try {
      const content = await file.text();
      const cookies = parseCookieFile(content);

      if (cookies.length === 0) {
        setError("No valid cookies found in file. Please ensure it's in Netscape format.");
        return;
      }

      // Filter for YouTube cookies only
      const youtubeCookies = cookies.filter(c => 
        c.domain.includes('youtube.com') || c.domain.includes('google.com')
      );

      if (youtubeCookies.length === 0) {
        setError("No YouTube cookies found. Please export cookies from youtube.com");
        return;
      }

      onCookiesLoaded(youtubeCookies);
      setError("");
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError("Failed to read cookie file. Please try again.");
      console.error("Cookie parsing error:", err);
    }
  };

  const handleClearCookies = () => {
    onCookiesLoaded([]);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍪</span>
          <div className="text-left">
            <h3 className="font-semibold text-white">YouTube Cookies</h3>
            <p className="text-xs text-white/60">Optional - Helps bypass bot detection</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cookiesLoaded && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              ✓ Loaded
            </Badge>
          )}
          <svg
            className={`w-5 h-5 text-white/60 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 p-6 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <span className="text-blue-400 mt-0.5">ℹ️</span>
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">Why are cookies needed?</p>
                <p className="text-blue-300/80">
                  YouTube sometimes blocks automated downloads to prevent bots. Your cookies help verify you're a real user.
                  They are used only for this download and are deleted immediately after.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white">How to export cookies:</h4>
              <ol className="text-sm text-white/70 space-y-2 ml-4 list-decimal">
                <li>Install a cookie export extension (e.g., "Get cookies.txt LOCALLY" for Chrome/Edge)</li>
                <li>Visit <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">youtube.com</a> and make sure you're logged in</li>
                <li>Click the extension icon and export cookies as "Netscape" format</li>
                <li>Upload the downloaded .txt file below</li>
              </ol>
            </div>

            <div className="space-y-3 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileSelect}
                className="hidden"
                id="cookie-upload"
              />
              
              <div className="flex gap-2">
                <label htmlFor="cookie-upload" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-white/20 bg-white/5 hover:bg-white/10 text-white"
                    onClick={() => fileInputRef.current?.click()}
                    asChild
                  >
                    <span>
                      📁 Upload cookies.txt
                    </span>
                  </Button>
                </label>
                
                {cookiesLoaded && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400"
                    onClick={handleClearCookies}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <span className="text-red-400 mt-0.5">⚠️</span>
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {cookiesLoaded && (
                <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <p className="text-sm text-green-200">
                    Cookies loaded successfully! They will be used for downloads and deleted immediately after.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10">
            <div className="flex items-start gap-2 text-xs text-white/50">
              <span className="mt-0.5">🔒</span>
              <p>
                Your cookies are processed securely and never stored permanently. They are only used temporarily 
                for the download request and are deleted within seconds.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
