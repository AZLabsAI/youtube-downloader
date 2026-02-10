# POT Provider Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the POT (Proof of Origin) Token Provider in your YouTube downloader application. Follow these steps to eliminate the need for user-provided cookies.

---

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- macOS, Linux, or Windows (WSL)
- Git (for cloning repositories if needed)
- ~500MB free disk space
- Port 4416 available on localhost

---

## Installation Steps

### Step 1: Download bgutil-pot Binary

The bgutil-pot binary is the core POT token generator. Download the correct version for your operating system.

#### Option A: macOS (Intel/x86_64)

```bash
cd youtube-downloader
mkdir -p bin
cd bin

# Download the binary
wget https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases/latest/download/bgutil-pot-macos-x86_64

# Make it executable
chmod +x bgutil-pot-macos-x86_64

# Rename for easy access
mv bgutil-pot-macos-x86_64 bgutil-pot

# Verify installation
./bgutil-pot --version
```

#### Option B: macOS (Apple Silicon/aarch64)

```bash
cd youtube-downloader
mkdir -p bin
cd bin

# Download the binary
wget https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases/latest/download/bgutil-pot-macos-aarch64

# Make it executable
chmod +x bgutil-pot-macos-aarch64

# Rename for easy access
mv bgutil-pot-macos-aarch64 bgutil-pot

# Verify installation
./bgutil-pot --version
```

#### Option C: Linux (x86_64)

```bash
cd youtube-downloader
mkdir -p bin
cd bin

# Download the binary
wget https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases/latest/download/bgutil-pot-linux-x86_64

# Make it executable
chmod +x bgutil-pot-linux-x86_64

# Rename for easy access
mv bgutil-pot-linux-x86_64 bgutil-pot

# Verify installation
./bgutil-pot --version
```

#### Option D: Windows (PowerShell)

```powershell
cd youtube-downloader
mkdir -p bin
cd bin

# Download the binary (using curl or your browser)
Invoke-WebRequest -Uri "https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases/latest/download/bgutil-pot-windows-x86_64.exe" -OutFile "bgutil-pot.exe"

# Verify installation
.\bgutil-pot.exe --version
```

### Step 2: Update .gitignore

Ensure the binary is not committed to version control:

```bash
cd youtube-downloader

# Add to .gitignore
echo "bin/bgutil-pot" >> .gitignore
echo "bin/bgutil-pot.exe" >> .gitignore

# Verify it was added
cat .gitignore | grep bgutil-pot
```

### Step 3: Install yt-dlp Plugin

The yt-dlp plugin integrates the POT provider with yt-dlp.

#### Create Plugin Directory

```bash
# Create the plugins directory in your home folder
mkdir -p ~/.yt-dlp-plugins
```

#### Download and Extract Plugin

```bash
cd ~/.yt-dlp-plugins

# Download the plugin zip
wget https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases/latest/download/bgutil-ytdlp-pot-provider-rs.zip

# Extract it
unzip bgutil-ytdlp-pot-provider-rs.zip

# Verify the structure
ls -la bgutil-ytdlp-pot-provider/
```

Expected structure after extraction:

```
~/.yt-dlp-plugins/
└── bgutil-ytdlp-pot-provider/
    ├── pyproject.toml
    └── yt_dlp_plugins/
        └── extractor/
            ├── getpot_bgutil_cli.py
            ├── getpot_bgutil_http.py
            └── getpot_bgutil.py
```

#### Verify Plugin Installation

```bash
# Check if yt-dlp recognizes the plugin
yt-dlp -v 2>&1 | grep -i "pot"
```

You should see output similar to:

```
[debug] [youtube] [pot] PO Token Providers: bgutil:http-1.2.2 (external)
```

If you don't see this, troubleshoot:

```bash
# Check plugin directory
ls -la ~/.yt-dlp-plugins/

# Reinstall yt-dlp
pip install --upgrade yt-dlp

# Try again
yt-dlp -v 2>&1 | grep -i "pot"
```

---

## Backend Integration

### Step 4: Create POT Provider Service

Create a new service file to manage the POT provider process.

**File:** `youtube-downloader/services/pot-provider.service.ts`

```typescript
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

interface POTProviderHealth {
  status: 'healthy' | 'unhealthy' | 'starting';
  port: number;
  uptime?: number;
  startTime?: number;
  restartCount?: number;
}

class POTProviderService {
  private process: ChildProcess | null = null;
  private port: number = 4416;
  private startTime: number = 0;
  private restartCount: number = 0;
  private maxRestarts: number = 3;
  private restartWindow: number = 60000; // 1 minute
  private lastRestartTime: number = 0;
  private isShuttingDown: boolean = false;

  /**
   * Start the POT provider server
   */
  async start(): Promise<void> {
    if (this.process) {
      console.log('[POT] Server already running');
      return;
    }

    if (!this.canRestart()) {
      console.error('[POT] Max restart attempts reached. Manual intervention needed.');
      return;
    }

    const binPath = join(process.cwd(), 'bin', 'bgutil-pot');

    // Verify binary exists
    if (!existsSync(binPath)) {
      console.error(`[POT] Binary not found at ${binPath}`);
      console.error('[POT] Please download bgutil-pot from: https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases');
      return;
    }

    console.log('[POT] Starting POT provider server...');
    this.startTime = Date.now();

    try {
      this.process = spawn(binPath, ['server', '--port', this.port.toString()], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });

      this.process.stdout?.on('data', (data) => {
        console.log(`[POT] ${data.toString().trim()}`);
      });

      this.process.stderr?.on('data', (data) => {
        console.error(`[POT] Error: ${data.toString().trim()}`);
      });

      this.process.on('error', (err) => {
        console.error('[POT] Process error:', err);
        this.handleProcessExit();
      });

      this.process.on('exit', (code) => {
        console.log(`[POT] Server exited with code ${code}`);
        this.handleProcessExit();
      });

      // Wait a moment for the server to start
      await this.waitForHealthCheck(5000); // 5 second timeout

      console.log('[POT] Server started successfully on port', this.port);
    } catch (error) {
      console.error('[POT] Failed to start server:', error);
      this.process = null;
    }
  }

  /**
   * Stop the POT provider server
   */
  stop(): void {
    this.isShuttingDown = true;

    if (this.process) {
      console.log('[POT] Stopping POT provider server...');
      this.process.kill('SIGTERM');

      // Force kill if not stopped after 3 seconds
      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGKILL');
        }
      }, 3000);

      this.process = null;
    }
  }

  /**
   * Check server health
   */
  async getHealth(): Promise<POTProviderHealth> {
    if (!this.process || this.process.killed) {
      return {
        status: 'unhealthy',
        port: this.port,
      };
    }

    try {
      const response = await fetch(`http://127.0.0.1:${this.port}/ping`);
      const uptime = Date.now() - this.startTime;

      if (response.ok) {
        return {
          status: 'healthy',
          port: this.port,
          uptime,
          startTime: this.startTime,
          restartCount: this.restartCount,
        };
      } else {
        return {
          status: 'unhealthy',
          port: this.port,
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        port: this.port,
      };
    }
  }

  /**
   * Wait for server to be ready
   */
  private async waitForHealthCheck(timeout: number): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`http://127.0.0.1:${this.port}/ping`, {
          signal: AbortSignal.timeout(1000),
        });

        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Server not ready yet
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return false;
  }

  /**
   * Handle process exit and attempt restart
   */
  private handleProcessExit(): void {
    this.process = null;

    if (this.isShuttingDown) {
      return;
    }

    if (this.canRestart()) {
      console.log('[POT] Attempting to restart server...');
      this.restartCount++;
      this.lastRestartTime = Date.now();
      this.start();
    } else {
      console.error('[POT] Max restart attempts exceeded. Manual restart required.');
    }
  }

  /**
   * Check if we can restart the process
   */
  private canRestart(): boolean {
    const timeSinceLastRestart = Date.now() - this.lastRestartTime;

    if (timeSinceLastRestart > this.restartWindow) {
      // Outside restart window, reset counter
      this.restartCount = 0;
      return true;
    }

    return this.restartCount < this.maxRestarts;
  }

  /**
   * Test if POT provider is working correctly
   */
  async test(): Promise<boolean> {
    const health = await this.getHealth();

    if (health.status !== 'healthy') {
      console.error('[POT] Health check failed. Server may not be running.');
      return false;
    }

    try {
      const response = await fetch(`http://127.0.0.1:${this.port}/get_pot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[POT] Token generation test passed');
        return !!data.token;
      }
    } catch (error) {
      console.error('[POT] Token generation test failed:', error);
    }

    return false;
  }
}

export const potProviderService = new POTProviderService();

// Ensure proper cleanup on application exit
process.on('exit', () => {
  potProviderService.stop();
});

process.on('SIGTERM', () => {
  console.log('[POT] Received SIGTERM, shutting down...');
  potProviderService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[POT] Received SIGINT, shutting down...');
  potProviderService.stop();
  process.exit(0);
});
```

### Step 5: Create Health Check Endpoint

Create an API endpoint to monitor POT provider health.

**File:** `youtube-downloader/app/api/health/pot-provider/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { potProviderService } from '@/services/pot-provider.service';

export async function GET(request: NextRequest) {
  try {
    const health = await potProviderService.getHealth();

    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Failed to check health' },
      { status: 503 },
    );
  }
}
```

### Step 6: Initialize POT Provider on App Startup

Update your app layout or main server file to start the POT provider.

**File:** `youtube-downloader/app/layout.tsx` (add to existing file)

```typescript
// Add this import at the top
import { potProviderService } from '@/services/pot-provider.service';

// Add this in the root layout component
export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Initialize POT provider on server startup (runs once)
  if (typeof window === 'undefined') {
    // Server-side only
    if (!global.potProviderInitialized) {
      global.potProviderInitialized = true;
      potProviderService.start().catch((err) => {
        console.error('[POT] Failed to start provider:', err);
      });
    }
  }

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

// Add this to your globals
declare global {
  var potProviderInitialized: boolean;
}
```

---

## Testing the Setup

### Test 1: Verify Binary Works

```bash
cd youtube-downloader
./bin/bgutil-pot --version
```

Expected output:

```
bgutil-pot X.X.X
```

### Test 2: Start Server Manually

```bash
# Start the server
./bin/bgutil-pot server --port 4416

# In another terminal, test health check
curl http://127.0.0.1:4416/ping
```

Expected response:

```json
{ "status": "ok" }
```

### Test 3: Generate a Test Token

```bash
# Test token generation
curl -X POST http://127.0.0.1:4416/get_pot \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response:

```json
{ "token": "..." }
```

### Test 4: Test yt-dlp Plugin

```bash
# Verify plugin is detected
yt-dlp -v 2>&1 | grep -i "pot"

# Should show:
# [debug] [youtube] [pot] PO Token Providers: bgutil:http-1.2.2 (external)
```

### Test 5: Test Actual Download

```bash
# Try downloading a public video
yt-dlp -f best "https://www.youtube.com/watch?v=jNQXAC9IVRw"

# Should succeed without errors
```

---

## Troubleshooting

### Issue: "bgutil-pot: command not found"

**Solution:**

```bash
# Verify file exists and is executable
ls -la youtube-downloader/bin/bgutil-pot

# Make sure it's executable
chmod +x youtube-downloader/bin/bgutil-pot

# Try running with full path
./youtube-downloader/bin/bgutil-pot --version
```

### Issue: "Cannot connect to localhost:4416"

**Check if port is in use:**

```bash
# macOS/Linux
lsof -i :4416

# Windows (PowerShell)
netstat -ano | findstr :4416
```

**Kill process using the port:**

```bash
# macOS/Linux
kill -9 <PID>

# Windows
taskkill /PID <PID> /F
```

### Issue: yt-dlp plugin not detected

**Verify plugin location:**

```bash
ls -la ~/.yt-dlp-plugins/bgutil-ytdlp-pot-provider/

# Should show:
# pyproject.toml
# yt_dlp_plugins/
```

**Reinstall plugin:**

```bash
rm -rf ~/.yt-dlp-plugins/bgutil-ytdlp-pot-provider/

# Download and extract again
cd ~/.yt-dlp-plugins
wget https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases/latest/download/bgutil-ytdlp-pot-provider-rs.zip
unzip bgutil-ytdlp-pot-provider-rs.zip
```

### Issue: Downloads still failing with HTTP 403

**Try alternative clients:**

```bash
# Test with different client
yt-dlp --extractor-args "youtube:player_client=ios" "VIDEO_URL"

# Or try
yt-dlp --extractor-args "youtube:player_client=tv_embedded" "VIDEO_URL"
```

**Restart POT provider:**

```bash
# Kill the server process
pkill -f "bgutil-pot server"

# It will auto-restart, or manually restart:
./bin/bgutil-pot server --port 4416
```

---

## Configuration

### Environment Variables

Set these in your `.env.local` or system environment:

```bash
# Enable debug logging
RUST_LOG=debug

# Custom port (default: 4416)
POT_SERVER_PORT=4416

# Token cache TTL in hours (default: 6)
TOKEN_TTL=6
```

### Advanced Settings

For HTTP server mode:

```bash
./bin/bgutil-pot server --help

# Output shows:
# --port <PORT>       Listen port (default: 4416)
# --host <HOST>       Bind address (default: ::)
# --verbose           Enable verbose logging
```

---

## Next Steps

After completing setup:

1. **Remove cookie component** - Delete `components/cookie-upload.tsx`
2. **Update download API** - Remove cookies parameter
3. **Update yt-dlp service** - Remove cookie file creation
4. **Test full flow** - Try downloading a video
5. **Deploy to production** - Follow deployment checklist in POT_PROVIDER_SOLUTION.md

---

## Support

### Debug Logging

Enable detailed logs:

```bash
# Set environment variable
export RUST_LOG=debug

# Restart the server
./bin/bgutil-pot server
```

### Check Logs

```bash
# View recent logs
tail -f /var/log/bgutil-pot.log  # Linux/macOS

# Windows Event Viewer for system logs
```

### Get Help

- Official Docs: https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs
- yt-dlp Wiki: https://github.com/yt-dlp/yt-dlp/wiki/PO-Token-Guide
- GitHub Issues: Report problems in official repos

---

**Setup Version:** 1.0  
**Last Updated:** 2025  
**Status:** Ready for Use