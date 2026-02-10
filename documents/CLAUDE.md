# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

```bash
npm run dev       # Start development server with Turbopack (default: http://localhost:3000)
npm run build     # Build production bundle
npm run start     # Start production server
npm run lint      # Run Next.js linting
```

## Prerequisites

- **yt-dlp** must be installed on the system (`pip install yt-dlp` or `brew install yt-dlp`)
- Node.js 20.x or higher

## Architecture Overview

This is a Next.js 15 YouTube downloader application using the App Router with TypeScript. The application has three main layers:

### 1. Rate Limiting Middleware
- In-memory rate limiting in `middleware.ts` (5 requests/minute/IP)
- Only applies to `/api/download` endpoints
- Uses Map for tracking with automatic cleanup

### 2. Core Service Layer
- `services/ytdlp.service.ts` - Singleton service interfacing with yt-dlp CLI
- Spawns yt-dlp processes for metadata extraction and downloads
- Downloads go to `/tmp` directory with timestamp-based naming
- Progress tracking via stdout parsing

### 3. API Routes
- `/api/metadata` - Validates YouTube URLs and returns video info with formats
- `/api/download` - Handles file downloads with streaming response

## Key Data Flow

1. Frontend submits YouTube URL → `/api/metadata`
2. API validates URL → calls `ytdlpService.getVideoMetadata()`
3. Service spawns yt-dlp with `--dump-json` → parses and processes formats
4. User selects format → `/api/download` (rate limited)
5. Service downloads with progress tracking → streams file to client

## Important Implementation Details

### yt-dlp Integration
- Service uses Node.js `spawn` to execute yt-dlp commands
- JSON output parsing for metadata extraction
- Real-time progress tracking via stdout parsing
- Format processing removes duplicates and sorts by quality

### Type Safety
- Shared types in `lib/types.ts`: `VideoInfo`, `VideoFormat`, `DownloadProgress`
- Consistent interfaces between frontend and backend

### Component Architecture
- Components use client-side rendering (`'use client'`)
- shadcn/ui components with Tailwind CSS styling
- Quality selector separates video/audio formats with tabbed interface

### Error Handling
- YouTube URL validation with regex
- yt-dlp process error handling with proper error messages
- Rate limit returns 429 with Retry-After header

## Development Notes

- The app uses Tailwind CSS v3 (not v4) due to shadcn/ui compatibility
- Downloaded files are temporarily stored and should be streamed, not permanently saved
- Rate limiting uses in-memory storage (consider Redis for production)
- All yt-dlp operations must happen server-side for security