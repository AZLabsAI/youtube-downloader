# YouTube Cookie Authentication - Implementation Guide

## Quick Start

This guide provides **production-ready code** to implement YouTube cookie authentication for your downloader. This solves issues with age-restricted, region-locked, and bot-detected videos.

---

## Problem Summary

**Without cookies**: yt-dlp fails on many videos with errors like:
- ❌ "Video unavailable"
- ❌ "Sign in to confirm your age"  
- ❌ "HTTP Error 403: Forbidden"

**With cookies**: yt-dlp authenticates as you, bypassing restrictions:
- ✅ Age-restricted videos work
- ✅ Region-locked content accessible
- ✅ Bot detection bypassed
- ✅ Premium quality streams available

---

## Step 1: Extract Your YouTube Cookies

### Option A: Browser Extension (Easiest)

#### For Chrome/Edge:
1. Install **"Get cookies.txt LOCALLY"** extension from Chrome Web Store
2. Sign in to YouTube (youtube.com) with your Google account
3. Click the extension icon
4. Click "Export" → Choose "Netscape format"
5. Save as `youtube-cookies.txt`

#### For Firefox:
1. Install **"cookies.txt"** extension
2. Sign in to YouTube  
3. Click extension icon
4. Export cookies
5. Save as `youtube-cookies.txt`

### Option B: yt-dlp Built-in (Testing Only)

```bash
# This extracts cookies directly from browser
yt-dlp --cookies-from-browser chrome "https://www.youtube.com/watch?v=VIDEO_ID"

# Or for Firefox
yt-dlp --cookies-from-browser firefox "https://www.youtube.com/watch?v=VIDEO_ID"
```

**Note**: This only works locally, not on deployed servers.

---

## Step 2: Prepare Cookies for Production

### Base64 Encode the Cookie File

```bash
# On macOS/Linux
base64 -i youtube-cookies.txt -o youtube-cookies.b64

# Or with cat
cat youtube-cookies.txt | base64 > youtube-cookies.b64

# On Windows (PowerShell)
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("youtube-cookies.txt")) | Out-File youtube-cookies.b64
```

### Copy the Encoded Value

```bash
cat youtube-cookies.b64
```

Copy the entire output. This will be your `YTDLP_COOKIES` environment variable.

---

## Step 3: Code Implementation

### A. Update `ytdlp.service.ts`

Add cookie support to all yt-dlp operations:

```typescript
import { spawn } from 'child_process';
import { execSync } from 'child_process';
import { unlink, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export interface VideoMetadata {
  // ... existing interfaces
}

class YTDLPService {
  private ytdlpPath: string = 'yt-dlp';
  private tempFiles: Set<string> = new Set();
  private cookiesFile: string = '/tmp/yt-cookies.txt';

  /**
   * Initialize cookies from environment variable
   */
  private async initializeCookies(): Promise<void> {
    const cookiesEnv = process.env.YTDLP_COOKIES;
    
    if (!cookiesEnv) {
      console.log('No YTDLP_COOKIES environment variable found');
      return;
    }

    try {
      // Decode base64 cookies
      const cookiesContent = Buffer.from(cookiesEnv, 'base64').toString('utf-8');
      
      // Write to temp file
      await writeFile(this.cookiesFile, cookiesContent, 'utf-8');
      
      console.log('YouTube cookies initialized successfully');
    } catch (error) {
      console.error('Failed to initialize cookies:', error);
    }
  }

  /**
   * Get common yt-dlp args with cookies if available
   */
  private async getBaseArgs(): Promise<string[]> {
    const args: string[] = [];
    
    // Initialize cookies if not already done
    if (!existsSync(this.cookiesFile)) {
      await this.initializeCookies();
    }

    // Add cookies if available
    if (existsSync(this.cookiesFile)) {
      args.push('--cookies', this.cookiesFile);
    }

    return args;
  }

  /**
   * Extract video metadata from a YouTube URL
   */
  async getVideoMetadata(url: string): Promise<VideoMetadata> {
    return new Promise(async (resolve, reject) => {
      const baseArgs = await this.getBaseArgs();
      
      const args = [
        ...baseArgs,
        '--dump-json',
        '--no-playlist',
        '--no-warnings',
        url
      ];

      const process = spawn(this.ytdlpPath, args);
      let data = '';
      let error = '';

      process.stdout.on('data', (chunk) => {
        data += chunk.toString();
      });

      process.stderr.on('data', (chunk) => {
        error += chunk.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp exited with code ${code}: ${error}`));
          return;
        }

        try {
          const metadata = JSON.parse(data);
          
          // ... rest of existing metadata parsing code
          // (keep all existing logic for formatting dates, sanitizing titles, etc.)
          
          resolve(videoMetadata);
        } catch (err) {
          reject(new Error(`Failed to parse yt-dlp output: ${err}`));
        }
      });
    });
  }

  /**
   * Download video with specific quality option
   */
  downloadVideoWithQuality(
    url: string,
    qualityId: string,
    videoTitle?: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const timestamp = Date.now();
      const sanitizedTitle = videoTitle ? this.sanitizeFilename(videoTitle) : `youtube-download-${timestamp}`;
      
      const baseArgs = await this.getBaseArgs();
      let args: string[] = [...baseArgs];
      let outputTemplate = '';

      switch (qualityId) {
        case 'best_merged':
          outputTemplate = `/tmp/${sanitizedTitle}.%(ext)s`;
          args = [
            ...args,
            '-f', 'bestvideo+bestaudio',
            '--merge-output-format', 'mp4',
            '-o', outputTemplate,
            '--newline',
            '--no-playlist',
            '--no-warnings',
            url
          ];
          break;

        case 'combined_720p':
          outputTemplate = `/tmp/${sanitizedTitle}.%(ext)s`;
          args = [
            ...args,
            '-f', 'best[height<=720][acodec!=none]/best[height<=480][acodec!=none]/best[acodec!=none]',
            '-o', outputTemplate,
            '--newline',
            '--no-playlist',
            '--no-warnings',
            url
          ];
          break;

        case 'audio_only':
          outputTemplate = `/tmp/${sanitizedTitle}.%(ext)s`;
          args = [
            ...args,
            '-f', 'bestaudio',
            '--extract-audio',
            '--audio-format', 'mp3',
            '-o', outputTemplate,
            '--newline',
            '--no-playlist',
            '--no-warnings',
            url
          ];
          break;

        default:
          reject(new Error('Invalid quality option'));
          return;
      }

      console.log('Starting download with args:', args);
      const process = spawn(this.ytdlpPath, args);
      let downloadedFilePath = '';
      let errorOutput = '';

      // ... rest of existing download logic
      // (keep all existing stdout/stderr handling, progress tracking, etc.)

      process.on('close', (code) => {
        console.log(`yt-dlp process exited with code ${code}`);
        
        if (code !== 0) {
          reject(new Error(`Download failed with code ${code}: ${errorOutput}`));
          return;
        }

        if (downloadedFilePath) {
          this.tempFiles.add(downloadedFilePath);
          resolve(downloadedFilePath);
        } else {
          // Fallback: try to find the file
          try {
            const findResult = execSync(`find /tmp -name "${sanitizedTitle}.*" -type f`, { encoding: 'utf8' });
            const foundFiles = findResult.trim().split('\n').filter((f: string) => f);
            if (foundFiles.length > 0) {
              const filePath = foundFiles[0];
              this.tempFiles.add(filePath);
              resolve(filePath);
            } else {
              reject(new Error('Downloaded file not found'));
            }
          } catch (findError) {
            reject(new Error('Failed to locate downloaded file'));
          }
        }
      });
    });
  }

  // ... keep all other existing methods (sanitizeFilename, processFormats, etc.)
}

export const ytdlpService = new YTDLPService();
```

---

### B. Update `.env.local` (Development)

Create or update `.env.local`:

```bash
# YouTube Cookies (Base64 encoded)
YTDLP_COOKIES=your_base64_encoded_cookies_here
```

---

### C. Update `.gitignore`

**CRITICAL**: Never commit cookies to version control!

```gitignore
# Cookies and sensitive files
*.cookies
*cookies.txt
youtube-cookies.*
cookies.b64
.env.local
.env.production
```

---

## Step 4: Local Testing

### Test 1: Verify Cookie File Format

```bash
# Check first few lines of cookie file
head -5 youtube-cookies.txt
```

Should look like:
```
# Netscape HTTP Cookie File
.youtube.com    TRUE    /    TRUE    1735689600    CONSENT    YES+...
.youtube.com    TRUE    /    TRUE    1735689600    VISITOR_INFO1_LIVE    ...
```

### Test 2: Test with yt-dlp CLI

```bash
# Test age-restricted video
yt-dlp --cookies youtube-cookies.txt "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Should download successfully
```

### Test 3: Test in Application

```bash
# Set environment variable
export YTDLP_COOKIES=$(cat youtube-cookies.b64)

# Start dev server
npm run dev

# Test with age-restricted video URL in the app
```

---

## Step 5: Production Deployment

### For Docker (Render, Railway, etc.)

#### Update Dockerfile

```dockerfile
FROM node:18-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip3 install yt-dlp

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Build Next.js application
RUN pnpm build

EXPOSE 3000

# Environment variable for cookies (provided at runtime)
ENV NODE_ENV=production
ENV YTDLP_COOKIES=""

CMD ["pnpm", "start"]
```

#### Set Environment Variable in Platform

**Render**:
1. Go to Dashboard → Your Service → Environment
2. Add variable: `YTDLP_COOKIES`
3. Paste your base64 encoded cookies
4. Click "Save Changes"

**Railway**:
1. Go to Project → Variables
2. Add `YTDLP_COOKIES`
3. Paste base64 value
4. Redeploy

**Fly.io**:
```bash
flyctl secrets set YTDLP_COOKIES="your_base64_cookies"
```

---

### For VPS Deployment

#### Create systemd service

```bash
# Create service file
sudo nano /etc/systemd/system/youtube-downloader.service
```

```ini
[Unit]
Description=YouTube Downloader
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/youtube-downloader
Environment="NODE_ENV=production"
Environment="YTDLP_COOKIES=your_base64_cookies_here"
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable youtube-downloader
sudo systemctl start youtube-downloader
sudo systemctl status youtube-downloader
```

---

## Step 6: Cookie Refresh Strategy

Cookies expire! Typically after 2 weeks to 6 months.

### Manual Refresh (Simple)

1. Every 2 weeks, export new cookies from browser
2. Base64 encode
3. Update environment variable in platform
4. Redeploy

### Automated Refresh (Advanced)

Create a monitoring script:

```typescript
// scripts/check-cookies.ts
import { spawn } from 'child_process';

async function checkCookies() {
  return new Promise((resolve, reject) => {
    // Test with a known video
    const process = spawn('yt-dlp', [
      '--cookies', '/tmp/yt-cookies.txt',
      '--dump-json',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    ]);

    let error = '';
    process.stderr.on('data', (chunk) => {
      error += chunk.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('Cookies expired or invalid'));
      } else {
        resolve(true);
      }
    });
  });
}

// Run daily
setInterval(async () => {
  try {
    await checkCookies();
    console.log('Cookies are valid');
  } catch (error) {
    console.error('ALERT: Cookies expired!', error);
    // Send email/Slack notification
  }
}, 24 * 60 * 60 * 1000); // 24 hours
```

---

## Troubleshooting

### Issue: "Cookies are invalid"

**Solution**:
```bash
# Re-export cookies from browser
# Make sure you're signed in to YouTube
# Export again and update environment variable
```

### Issue: "Still getting 403 errors"

**Possible causes**:
1. Cookie file format is wrong
2. Base64 encoding/decoding failed
3. Cookies expired
4. Wrong Google account (use one with YouTube Premium if needed)

**Debug**:
```bash
# Check if cookies are being loaded
console.log('Cookies file exists:', existsSync(this.cookiesFile));

# Check yt-dlp args
console.log('yt-dlp args:', args);
```

### Issue: "Works locally but not in production"

**Checklist**:
- ✅ Environment variable is set in production
- ✅ Base64 encoding is correct (no line breaks)
- ✅ File path `/tmp/yt-cookies.txt` is writable
- ✅ yt-dlp is installed in production
- ✅ Cookies haven't expired

---

## Security Best Practices

### 1. Never Commit Cookies

```gitignore
*.cookies
*cookies.txt
*.b64
.env*
!.env.example
```

### 2. Encrypt at Rest

Use platform's secret management:
- **Railway**: Built-in encrypted variables
- **Render**: Encrypted environment variables
- **AWS**: Systems Manager Parameter Store
- **GCP**: Secret Manager

### 3. Rotate Regularly

- Export new cookies every 2 weeks
- Update environment variable
- Monitor for failures

### 4. Use Dedicated Account

- Create separate Google account for downloader
- Don't use personal account
- Subscribe to YouTube Premium (optional, helps with quality)

### 5. Monitor Access

- Check Google account activity regularly
- Enable 2FA
- Review session logs

---

## Legal & Terms of Service

⚠️ **Important Disclaimers**:

1. **YouTube Terms of Service**: Using automation tools may violate YouTube's ToS
2. **Copyright**: Only download content you have rights to
3. **Personal Use**: This is for educational/personal use only
4. **No Commercial Use**: Don't use for commercial services
5. **Respect Creators**: Consider supporting creators through official channels

**This tool is provided for educational purposes. Use responsibly and at your own risk.**

---

## Testing Checklist

Before deploying to production:

- [ ] Cookies extracted from browser
- [ ] Base64 encoding successful
- [ ] Tested with age-restricted video locally
- [ ] Environment variable set in production
- [ ] Deployment successful
- [ ] Test with various video types:
  - [ ] Age-restricted video
  - [ ] Normal public video
  - [ ] 4K video
  - [ ] Music video
  - [ ] Region-locked content (if applicable)
- [ ] Cookie refresh reminder set (calendar/cron)

---

## Alternative Approaches

If cookies don't work for you:

### 1. OAuth2 Flow
Implement Google OAuth to get user's YouTube session programmatically.

### 2. Browser Automation
Use Puppeteer/Playwright to simulate real browser sessions.

### 3. Proxy Rotation
Use residential proxies to avoid bot detection.

### 4. Official YouTube API
Use YouTube Data API v3 (no download feature, metadata only).

---

## Support & Resources

- **yt-dlp Documentation**: https://github.com/yt-dlp/yt-dlp#readme
- **Cookies Format**: Netscape cookie file format
- **Browser Extensions**:
  - Chrome: "Get cookies.txt LOCALLY"
  - Firefox: "cookies.txt"

---

## Summary

**What you did**:
1. ✅ Extracted cookies from browser
2. ✅ Base64 encoded for environment variable
3. ✅ Modified service to use cookies
4. ✅ Set up cookie refresh strategy
5. ✅ Deployed with cookies in environment

**What this solves**:
- ✅ Age-restricted videos now work
- ✅ Bot detection bypassed
- ✅ Better success rate overall
- ✅ Access to premium quality streams

**Maintenance required**:
- 🔄 Refresh cookies every 2 weeks
- 🔄 Monitor for failed downloads
- 🔄 Update environment variable when needed

---

**You're all set! Your YouTube downloader now has cookie authentication support.**
