# YouTube Downloader - Comprehensive Codebase Explanation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [File Structure & Responsibilities](#file-structure--responsibilities)
4. [Data Flow & Request Lifecycle](#data-flow--request-lifecycle)
5. [Core Components Deep Dive](#core-components-deep-dive)
6. [API Routes Explained](#api-routes-explained)
7. [Frontend Implementation](#frontend-implementation)
8. [Rate Limiting & Security](#rate-limiting--security)
9. [Deployment Architecture](#deployment-architecture)
10. [The YouTube Cookies Problem](#the-youtube-cookies-problem)

---

## Architecture Overview

This is a **Next.js 15 full-stack application** that allows users to download YouTube videos. It follows a three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 19)                       │
│  - URL Input Component                                       │
│  - Video Metadata Display                                    │
│  - Quality Selection Interface                               │
│  - Download Progress Tracking                                │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP Requests
┌──────────────────────▼──────────────────────────────────────┐
│              Next.js API Routes (Middleware)                 │
│  - Rate Limiting (5 req/min/IP)                             │
│  - Request Validation                                        │
│  - Error Handling                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │ Service Calls
┌──────────────────────▼──────────────────────────────────────┐
│            YTDLPService (Singleton Pattern)                  │
│  - Spawns yt-dlp CLI processes                              │
│  - Parses JSON metadata                                      │
│  - Manages downloads to /tmp                                 │
│  - Tracks progress via stdout                                │
└──────────────────────┬──────────────────────────────────────┘
                       │ CLI Execution
┌──────────────────────▼──────────────────────────────────────┐
│                  System Binaries                             │
│  - yt-dlp: YouTube video extraction                         │
│  - ffmpeg: Video/audio merging                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Next.js 15** (App Router with React Server Components)
- **React 19** (Latest features including hooks)
- **TypeScript 5.0** (Strict mode enabled)
- **Tailwind CSS 3.x** (Custom Liquid Glass design system)
- **shadcn/ui** (Radix UI primitives)

### Backend
- **Next.js API Routes** (Server-side API endpoints)
- **Node.js spawn** (Process management)
- **File System APIs** (Read/write streams)

### External Dependencies
- **yt-dlp** (Python-based YouTube downloader)
- **ffmpeg** (Video/audio processing)

### Development Tools
- **ESLint** (Code linting)
- **TypeScript Compiler** (Type checking)
- **Turbopack** (Fast bundler for dev)

---

## File Structure & Responsibilities

```
youtube-downloader/
├── app/                          # Next.js App Router
│   ├── api/                      # Server-side API routes
│   │   ├── metadata/route.ts     # GET video info endpoint
│   │   └── download/route.ts     # POST download endpoint
│   ├── globals.css               # Global styles + animations
│   ├── layout.tsx                # Root layout wrapper
│   └── page.tsx                  # Main application page
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── progress.tsx
│   ├── hero-section.tsx          # Landing hero
│   ├── url-input.tsx             # YouTube URL input
│   ├── video-metadata.tsx        # Video info display
│   ├── quality-options.tsx       # Quality selection
│   └── quality-selector.tsx      # Quality picker
│
├── services/                     # Business logic
│   └── ytdlp.service.ts          # yt-dlp wrapper service
│
├── lib/                          # Utilities
│   ├── types.ts                  # TypeScript interfaces
│   └── utils.ts                  # Helper functions
│
├── middleware.ts                 # Rate limiting middleware
├── next.config.ts                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS config
└── tsconfig.json                 # TypeScript config
```

---

## Data Flow & Request Lifecycle

### Flow 1: Getting Video Metadata

```
User enters YouTube URL
        ↓
URLInput component validates format
        ↓
POST /api/metadata
        ↓
Middleware (no rate limit for metadata)
        ↓
API Route validates URL with regex
        ↓
ytdlpService.getVideoMetadata(url)
        ↓
Spawns: yt-dlp --dump-json --no-playlist URL
        ↓
Parses JSON output from stdout
        ↓
Processes formats (video/audio streams)
        ↓
Generates 3 quality options:
   - Best Quality (merged video+audio)
   - Combined Format (single file ≤720p)
   - Audio Only (MP3)
        ↓
Returns metadata to client
        ↓
VideoMetadata component displays info
```

### Flow 2: Downloading Video

```
User clicks download button
        ↓
POST /api/download with {url, qualityId}
        ↓
Middleware applies rate limiting (5/min/IP)
        ↓
API Route gets metadata first
        ↓
ytdlpService.downloadVideoWithQuality()
        ↓
Spawns yt-dlp with quality-specific args:
   
   Best Quality:
   yt-dlp -f bestvideo+bestaudio --merge-output-format mp4
   
   Combined:
   yt-dlp -f best[height<=720][acodec!=none]
   
   Audio Only:
   yt-dlp -f bestaudio --extract-audio --audio-format mp3
        ↓
Downloads to /tmp with sanitized filename
        ↓
Tracks download progress from stdout
        ↓
Returns file path when complete
        ↓
Creates ReadStream from file
        ↓
Streams file to client with headers:
   - Content-Type: application/octet-stream
   - Content-Disposition: attachment; filename="..."
   - Content-Length: filesize
        ↓
Schedules cleanup after 30 seconds
        ↓
Browser saves file to downloads folder
```

---

## Core Components Deep Dive

### 1. YTDLPService (`services/ytdlp.service.ts`)

**Purpose**: Singleton service that wraps the yt-dlp CLI binary and manages video downloads.

**Key Methods**:

#### `getVideoMetadata(url: string): Promise<VideoMetadata>`
```typescript
// Spawns: yt-dlp --dump-json --no-playlist [url]
// Returns: Video info including title, thumbnail, duration, formats
```

**Implementation Details**:
- Uses Node.js `spawn()` to execute yt-dlp
- Reads JSON from stdout
- Parses upload date (YYYYMMDD → formatted date)
- Sanitizes title for safe filenames
- Filters and sorts video formats by quality
- Removes duplicate formats
- Generates 3 quality options automatically

#### `downloadVideoWithQuality(url, qualityId, title, onProgress)`
```typescript
// Downloads video with specified quality option
// Returns: File path in /tmp directory
```

**Quality Option Mappings**:
```typescript
'best_merged' → '-f bestvideo+bestaudio --merge-output-format mp4'
'combined_720p' → '-f best[height<=720][acodec!=none]'
'audio_only' → '-f bestaudio --extract-audio --audio-format mp3'
```

#### `sanitizeFilename(title: string): string`
- Removes invalid filename characters: `<>:"/\|?*`
- Replaces multiple spaces with single space
- Capitalizes words for readability
- Limits to 120 characters
- Returns "YouTube Video" if empty

#### `scheduleFileCleanup(filePath, delayMs)`
- Uses `setTimeout` to delete file after delay
- Default: 30 seconds
- Prevents /tmp directory from filling up

**File Tracking**:
```typescript
private tempFiles: Set<string> = new Set();
```
- Tracks all downloaded files
- Enables bulk cleanup via `cleanupAllTempFiles()`

---

### 2. Middleware (`middleware.ts`)

**Purpose**: In-memory rate limiter for download endpoints.

**Configuration**:
```typescript
RATE_LIMIT_WINDOW = 60 * 1000      // 1 minute
RATE_LIMIT_MAX_REQUESTS = 5        // 5 requests per window
```

**How It Works**:
```typescript
Map<IP, { count: number, resetTime: number }>
```

1. Only applies to `/api/download` routes
2. Extracts IP from headers: `x-forwarded-for` → `x-real-ip` → 'unknown'
3. Checks if user has exceeded limit in current window
4. Returns 429 with `Retry-After` header if exceeded
5. Increments counter if allowed
6. Auto-cleanup expired entries every minute

**Limitations** (Important for deployment):
- In-memory only (resets on restart)
- Not shared across multiple server instances
- For production: use Redis or similar distributed cache

---

### 3. API Routes

#### `/api/metadata/route.ts`

**Method**: POST  
**Body**: `{ url: string }`  
**Response**: `VideoMetadata`

**Validation**:
```typescript
const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+(&[\w=]*)?$/;
```

**Accepts**:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- With or without `www`
- With or without `https://`

**Process**:
1. Validate URL format
2. Call `ytdlpService.getVideoMetadata(url)`
3. Map formats for client
4. Return processed metadata

**Error Handling**:
- 400: Missing URL or invalid format
- 500: yt-dlp execution failed

---

#### `/api/download/route.ts`

**Method**: POST  
**Body**: `{ url: string, qualityId: string }`  
**Response**: Binary file stream

**Process**:
1. Validate inputs
2. Get metadata to retrieve video title
3. Download with `ytdlpService.downloadVideoWithQuality()`
4. Get file stats (`fs.statSync`)
5. Create read stream (`createReadStream`)
6. Schedule cleanup after 30 seconds
7. Return streaming response

**Headers Set**:
```typescript
'Content-Type': 'application/octet-stream'
'Content-Disposition': 'attachment; filename="..."'
'Content-Length': fileSize.toString()
```

**Error Handling**:
- 400: Missing URL or qualityId
- 500: Download failed (yt-dlp error, file not found, etc.)

---

### 4. Frontend Page (`app/page.tsx`)

**State Management**:
```typescript
const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [downloadUrl, setDownloadUrl] = useState("");
const [error, setError] = useState("");
const [isDownloading, setIsDownloading] = useState(false);
const [downloadProgress, setDownloadProgress] = useState(0);
const [downloadSuccess, setDownloadSuccess] = useState(false);
```

**UI States**:
1. **Initial**: URL input form with Liquid Glass design
2. **Loading**: Animated spinner while fetching metadata
3. **Error**: Error message with retry button
4. **Ready**: Video preview + download button
5. **Downloading**: Progress indicator (0-100%)
6. **Success**: Completion message with option to download another

**Key Functions**:

#### `handleURLSubmit(url)`
- Fetches metadata from `/api/metadata`
- Maps formats for display
- Sets `videoInfo` state

#### `handleQuickDownload()`
- Uses "best_merged" quality by default
- POSTs to `/api/download`
- Simulates progress animation (visual feedback)
- Creates blob URL and triggers download
- Uses `<a>` tag with `download` attribute
- Cleans up blob URL after download

#### `formatFilename(filename)`
- Cleans filename for better readability
- Capitalizes words
- Limits to 100 characters
- Ensures proper extension

---

## Rate Limiting & Security

### Current Implementation

**Rate Limiting**:
- 5 requests per minute per IP
- Only for `/api/download` endpoint
- In-memory storage (Map)
- Auto-cleanup every 60 seconds

**Input Validation**:
- YouTube URL regex validation
- Required fields check
- Type checking via TypeScript

**Filename Sanitization**:
- Removes path traversal characters
- Prevents command injection
- Limits filename length

**Temporary File Management**:
- Downloads to `/tmp` directory
- Auto-cleanup after 30 seconds
- Prevents disk space exhaustion

### Security Considerations

**Potential Vulnerabilities**:
1. **Command Injection**: Mitigated by not using shell execution
2. **Path Traversal**: Mitigated by sanitizing filenames
3. **DoS Attacks**: Partially mitigated by rate limiting
4. **Resource Exhaustion**: Mitigated by cleanup jobs

**Recommendations**:
- Add file size limits
- Implement request timeout
- Add CAPTCHA for bot protection
- Use Redis for distributed rate limiting
- Add Content Security Policy headers
- Enable HTTPS only in production

---

## Deployment Architecture

### Development Environment

**Requirements**:
- Node.js 18+
- yt-dlp installed globally
- ffmpeg installed
- npm/pnpm package manager

**Commands**:
```bash
npm install
npm run dev      # Starts on http://localhost:3000
```

---

### Production Deployment

**❌ NOT Compatible With**:
- **Vercel**: Serverless functions don't have access to yt-dlp/ffmpeg binaries
- **Netlify**: Same serverless limitation
- **AWS Lambda**: Would require custom layers with binaries

**✅ Compatible Platforms**:

#### 1. VPS/Dedicated Servers
- DigitalOcean Droplets
- Linode
- AWS EC2
- Hetzner Cloud

**Why**: Full control over system binaries

---

#### 2. Docker Containers
- Render
- Railway
- Fly.io
- Any Docker-compatible host

**Dockerfile** (included):
```dockerfile
FROM node:18-bullseye
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg
RUN pip3 install yt-dlp
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

---

## The YouTube Cookies Problem

### What Is The Issue?

When deployed to production, **some YouTube videos fail to download** with errors like:
- "Video unavailable"
- "Sign in to confirm your age"
- "This video requires authentication"
- "HTTP Error 403: Forbidden"

This happens even though the same videos download fine locally during development.

---

### Why Does This Happen?

YouTube has sophisticated bot detection and content protection mechanisms:

1. **Age-Restricted Content**
   - Videos marked 18+ require authentication
   - YouTube checks for signed-in user cookies
   - Without cookies, access is denied

2. **Geographic Restrictions**
   - Some videos are region-locked
   - Server IP might be from blocked region
   - Requires cookies from allowed region

3. **Bot Detection**
   - YouTube tracks request patterns
   - Server IPs making many requests get flagged
   - Requires browser-like authentication

4. **NSIG (N-Signature) Challenges**
   - YouTube encrypts video URLs with dynamic signatures
   - Requires JavaScript execution or valid session
   - Without cookies, signature extraction fails

---

### The Cookie Solution Explained

**Cookies** are authentication tokens that prove you're a legitimate, signed-in user.

When you browse YouTube in a browser:
1. You sign in with your Google account
2. YouTube sets cookies in your browser
3. Every request includes these cookies
4. YouTube trusts the requests

**yt-dlp can use these cookies** to impersonate a signed-in user:
```bash
yt-dlp --cookies cookies.txt "VIDEO_URL"
```

---

### How To Extract Cookies

#### Method 1: Browser Extension (Recommended)

1. Install a cookie export extension:
   - Chrome/Edge: **Get cookies.txt LOCALLY**
   - Firefox: **cookies.txt**

2. Sign in to YouTube with your Google account

3. Navigate to any YouTube page

4. Click the extension icon

5. Export cookies in Netscape format

6. Save as `cookies.txt`

**Why this works**: You're using your real authentication

---

#### Method 2: Manual Extraction (Advanced)

```bash
# Firefox
sqlite3 ~/.mozilla/firefox/*/cookies.sqlite \
  "SELECT host, 'TRUE', path, 'TRUE', expiry, name, value 
   FROM moz_cookies WHERE host LIKE '%youtube.com%'" \
  > cookies.txt

# Chrome
# Cookies are encrypted, requires decryption
```

---

#### Method 3: Using yt-dlp Built-in

```bash
# yt-dlp can extract from browser directly
yt-dlp --cookies-from-browser chrome "VIDEO_URL"
yt-dlp --cookies-from-browser firefox "VIDEO_URL"
```

**Limitations**: Only works locally, not on deployed servers

---

### Cookie Format (Netscape)

```
# Netscape HTTP Cookie File
.youtube.com    TRUE    /    TRUE    1735689600    CONSENT    YES+cb.20210101-01-p0
.youtube.com    TRUE    /    TRUE    1735689600    PREF      tz=America.Los_Angeles
.youtube.com    TRUE    /    FALSE   1735689600    VISITOR_INFO1_LIVE    Xyzabc123
```

**Important Fields**:
- Domain: `.youtube.com`
- Path: `/`
- Expiry: Unix timestamp
- Name: Cookie name
- Value: Cookie value

---

### Implementing Cookie Support

#### Option 1: Environment Variable (Simple)

**Step 1**: Export cookies to a file

**Step 2**: Base64 encode the file
```bash
base64 cookies.txt > cookies.txt.b64
```

**Step 3**: Set environment variable
```bash
export YTDLP_COOKIES="$(cat cookies.txt.b64)"
```

**Step 4**: Modify `ytdlp.service.ts`
```typescript
async getVideoMetadata(url: string): Promise<VideoMetadata> {
  // Write cookies to temp file
  const cookiesFile = '/tmp/cookies.txt';
  if (process.env.YTDLP_COOKIES) {
    const cookies = Buffer.from(
      process.env.YTDLP_COOKIES, 
      'base64'
    ).toString('utf-8');
    await fs.writeFile(cookiesFile, cookies);
  }

  const args = [
    '--dump-json',
    '--no-playlist',
    '--no-warnings',
  ];

  // Add cookies if file exists
  if (await fs.pathExists(cookiesFile)) {
    args.push('--cookies', cookiesFile);
  }

  args.push(url);

  const process = spawn(this.ytdlpPath, args);
  // ... rest of implementation
}
```

---

#### Option 2: File Upload (User-Provided)

**Frontend**: Add cookie file upload
```typescript
const [cookieFile, setCookieFile] = useState<File | null>(null);

const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files?.[0]) {
    setCookieFile(e.target.files[0]);
  }
};
```

**API**: Accept cookie file in request
```typescript
export async function POST(request: Request) {
  const formData = await request.formData();
  const url = formData.get('url');
  const cookies = formData.get('cookies'); // File

  if (cookies) {
    const cookieContent = await cookies.text();
    // Validate and use cookies
  }
}
```

**Cons**: Privacy concerns, complex to implement

---

#### Option 3: OAuth Flow (Advanced)

**Idea**: Use Google OAuth to get YouTube session

**Pros**:
- Most secure
- No cookie extraction needed
- Per-user authentication

**Cons**:
- Complex implementation
- Requires Google Cloud project
- OAuth setup for YouTube API

---

### Important Security Warnings

⚠️ **Never commit cookies to version control**
```gitignore
# .gitignore
cookies.txt
cookies.txt.b64
*.cookies
```

⚠️ **Cookies contain sensitive data**
- Access to your Google account
- Can be used to impersonate you
- Should be encrypted at rest

⚠️ **Cookies expire**
- Usually valid for 2 weeks to 6 months
- Need to be refreshed periodically
- Set up monitoring/alerts

⚠️ **Using cookies may violate Terms of Service**
- YouTube ToS prohibits automation
- Intended for personal use only
- Not for commercial services

---

### Testing Cookie Implementation

#### Local Testing
```bash
# 1. Export your cookies
# 2. Create .env.local
echo "YTDLP_COOKIES=$(base64 cookies.txt)" > .env.local

# 3. Test with age-restricted video
npm run dev
```

#### Verify yt-dlp Works
```bash
# Test directly with yt-dlp
yt-dlp --cookies cookies.txt "https://youtube.com/watch?v=AGE_RESTRICTED_VIDEO"
```

---

### Production Deployment with Cookies

#### Docker Deployment
```dockerfile
FROM node:18-bullseye
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg
RUN pip3 install yt-dlp

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Cookies will be provided via environment variable
ENV YTDLP_COOKIES=""

EXPOSE 3000
CMD ["pnpm", "start"]
```

#### Render/Railway Setup
1. Add `YTDLP_COOKIES` as environment variable
2. Base64 encode your cookies: `base64 cookies.txt`
3. Paste encoded value in platform settings
4. Redeploy application

---

### Alternative Solutions (Without Cookies)

#### 1. Use YouTube API (Official)
**Pros**: Legal, no cookies needed, official support  
**Cons**: No download feature, only metadata

#### 2. Proxy Rotation
**Idea**: Rotate IP addresses to avoid detection  
**Cons**: Expensive, complex, may still fail

#### 3. Browser Automation
**Idea**: Use Puppeteer/Playwright to simulate real browser  
**Cons**: Resource-intensive, slow, complex

#### 4. Third-Party Services
**Idea**: Use services like youtube-dl-server, ytdl-api  
**Cons**: Reliability issues, may be taken down

---

## Summary

### Codebase Architecture
- **Next.js 15** full-stack app with App Router
- **Three-tier** architecture: Frontend → API → Service → Binary
- **yt-dlp** for YouTube extraction
- **ffmpeg** for video/audio merging
- **Rate limiting** to prevent abuse
- **Temporary file** management

### The Cookie Problem
- **YouTube blocks** unauthenticated requests for certain videos
- **Cookies prove** you're a signed-in, legitimate user
- **yt-dlp** supports `--cookies` flag for authentication
- **Implementation** requires extracting browser cookies
- **Security** concerns around storing sensitive cookies
- **Terms of Service** considerations

### Deployment Constraints
- **Must use** VPS or Docker-based hosting
- **Cannot use** serverless platforms (Vercel, Netlify, Lambda)
- **Requires** system access to install binaries
- **Needs** persistent /tmp directory for downloads

### Recommended Solution Path
1. Extract cookies from your browser (signed in to YouTube)
2. Base64 encode the cookie file
3. Store as environment variable `YTDLP_COOKIES`
4. Modify service to write cookies to `/tmp/cookies.txt`
5. Add `--cookies /tmp/cookies.txt` to all yt-dlp commands
6. Set up cookie refresh mechanism (every 2 weeks)
7. Monitor for failed downloads and rotate cookies as needed

---

## Next Steps

If you want to implement cookie support:
1. Review the code changes required in `ytdlp.service.ts`
2. Extract your YouTube cookies using a browser extension
3. Test locally with environment variable
4. Deploy with encrypted cookies in environment
5. Set up monitoring for cookie expiration

If you want alternatives:
1. Consider official YouTube API (no downloads)
2. Evaluate browser automation approach
3. Research proxy rotation services
4. Look into third-party API providers

---

**Remember**: This tool is for educational purposes. Always respect copyright, YouTube's Terms of Service, and applicable laws in your jurisdiction.
