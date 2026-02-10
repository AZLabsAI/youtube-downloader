# POT Provider & Download Troubleshooting Guide

## Quick Diagnostics

Run this command to get your system status:

```bash
# Check POT provider status
curl http://127.0.0.1:4416/ping

# Check yt-dlp version and plugins
yt-dlp --version
yt-dlp -v 2>&1 | grep -i "pot"

# Test a download
yt-dlp -v "https://www.youtube.com/watch?v=jNQXAC9IVRw"
```

---

## POT Provider Issues

### POT Server Won't Start

**Symptoms:**
- `bgutil-pot: command not found`
- Server crashes immediately
- Cannot connect to localhost:4416

**Diagnosis:**

```bash
# 1. Check if binary exists
ls -la youtube-downloader/bin/bgutil-pot

# 2. Verify it's executable
file youtube-downloader/bin/bgutil-pot

# 3. Check file permissions
stat youtube-downloader/bin/bgutil-pot

# 4. Try running directly
./youtube-downloader/bin/bgutil-pot --version
```

**Solutions:**

**Binary not found:**
```bash
# Re-download for your OS
cd youtube-downloader/bin

# For macOS Intel
wget https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases/latest/download/bgutil-pot-macos-x86_64
chmod +x bgutil-pot-macos-x86_64
mv bgutil-pot-macos-x86_64 bgutil-pot

# For macOS Apple Silicon
wget https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases/latest/download/bgutil-pot-macos-aarch64
chmod +x bgutil-pot-macos-aarch64
mv bgutil-pot-macos-aarch64 bgutil-pot

# For Linux
wget https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases/latest/download/bgutil-pot-linux-x86_64
chmod +x bgutil-pot-linux-x86_64
mv bgutil-pot-linux-x86_64 bgutil-pot
```

**Wrong architecture:**
```bash
# Check your system architecture
uname -m

# Match to the correct binary:
# x86_64 = x86_64 build
# aarch64 = aarch64/ARM64 build
# arm64 = ARM64 build (Apple Silicon)
```

**Not executable:**
```bash
chmod +x youtube-downloader/bin/bgutil-pot
./youtube-downloader/bin/bgutil-pot --version
```

---

### Port 4416 Already in Use

**Symptoms:**
- `Address already in use` error
- Cannot bind to port 4416
- Multiple bgutil-pot processes running

**Diagnosis:**

```bash
# macOS/Linux: Find what's using port 4416
lsof -i :4416

# Windows (PowerShell): Find what's using port 4416
netstat -ano | findstr :4416

# Check for existing bgutil-pot processes
ps aux | grep bgutil-pot
```

**Solution:**

```bash
# macOS/Linux: Kill the process
kill -9 <PID>

# Or kill all bgutil-pot processes
pkill -9 bgutil-pot

# Windows (PowerShell):
taskkill /PID <PID> /F

# Then restart
./bin/bgutil-pot server --port 4416
```

**To use a different port:**
```bash
# Start on different port
./bin/bgutil-pot server --port 8080

# Configure yt-dlp to use new port
yt-dlp --extractor-args "youtubepot-bgutilhttp:base_url=http://127.0.0.1:8080" "VIDEO_URL"
```

---

### POT Server Crashes on Startup

**Symptoms:**
- Server starts but crashes immediately
- Exits with code 1, 101, or 139
- No error messages visible

**Diagnosis:**

```bash
# Run with verbose logging
RUST_LOG=debug ./bin/bgutil-pot server

# Check system logs
# macOS/Linux
dmesg | tail -20
journalctl -xe

# Windows Event Viewer
wevtutil qe System /c:10
```

**Common causes and solutions:**

**Missing library dependencies:**
```bash
# macOS: Install required libraries
brew install openssl
brew install pkg-config

# Linux: Install development packages
sudo apt-get install libssl-dev pkg-config build-essential

# Then try again
./bin/bgutil-pot server
```

**Insufficient memory:**
```bash
# Check available memory
# macOS/Linux
free -h

# Windows
systeminfo | findstr Memory

# bgutil-pot needs ~50MB minimum
# If low on memory, close other applications
```

**SELinux/AppArmor restrictions (Linux):**
```bash
# Check if SELinux is blocking
getenforce

# If enforcing, create policy or disable for bgutil-pot
sudo semanage fcontext -a -t bin_t "$(pwd)/bin/bgutil-pot"
sudo restorecon $(pwd)/bin/bgutil-pot
```

---

### POT Server Running But Unresponsive

**Symptoms:**
- Server process exists but doesn't respond to /ping
- Timeout when trying to generate tokens
- High CPU or memory usage

**Diagnosis:**

```bash
# Check if process is alive
ps aux | grep bgutil-pot

# Check resource usage
top -p <PID>  # macOS/Linux
tasklist | findstr bgutil-pot  # Windows

# Try health check with timeout
curl --connect-timeout 5 http://127.0.0.1:4416/ping

# Check with netstat if port is listening
netstat -tuln | grep 4416  # Linux
netstat -an | findstr 4416  # Windows
```

**Solutions:**

**Server hanging (high CPU):**
```bash
# Kill and restart
pkill -9 bgutil-pot

# Clear caches
./bin/bgutil-pot server --port 4416
# Wait 30 seconds for startup

# If still issues, check for corrupted cache files
rm -rf ~/.cache/bgutil-pot/
./bin/bgutil-pot server
```

**Out of memory:**
```bash
# Restart with limited cache
POT_SERVER_CACHE_SIZE=10 ./bin/bgutil-pot server

# Or switch to script mode (no caching)
./bin/bgutil-pot --content-binding "VIDEO_ID"
```

**Network issues:**
```bash
# Test localhost connectivity
ping 127.0.0.1

# Test IPv6 if server bound to ::
ping ::1

# Try loopback bypass
curl http://localhost:4416/ping
```

---

### Cannot Generate POT Tokens

**Symptoms:**
- Server responds but /get_pot returns error
- "Token generation failed"
- "BotGuard attestation failed"

**Diagnosis:**

```bash
# Test token generation directly
curl -X POST http://127.0.0.1:4416/get_pot \
  -H "Content-Type: application/json" \
  -d '{}'

# Check verbose output
RUST_LOG=debug ./bin/bgutil-pot server

# In another terminal
curl -X POST http://127.0.0.1:4416/get_pot -d '{}'
```

**Solutions:**

**Check internet connectivity:**
```bash
# bgutil-pot needs internet to contact YouTube
ping 8.8.8.8
curl https://www.youtube.com

# If blocked by firewall
# Allow bgutil-pot through firewall
sudo ufw allow 443/tcp  # Ubuntu
sudo firewall-cmd --add-port=443/tcp --permanent  # Fedora
```

**BotGuard issues:**
```bash
# This can happen if YouTube changes their system
# Solution: Update bgutil-pot to latest version

# Check version
./bin/bgutil-pot --version

# Download latest from releases
cd youtube-downloader/bin
wget https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases/latest/download/bgutil-pot-[OS]
chmod +x bgutil-pot-[OS]
mv bgutil-pot-[OS] bgutil-pot

# Restart server
pkill -9 bgutil-pot
./bin/bgutil-pot server
```

**Cache corruption:**
```bash
# Clear all caches
curl -X POST http://127.0.0.1:4416/invalidate_caches

# Or manually
rm -rf ~/.cache/bgutil-pot/
rm -rf /tmp/bgutil-pot-*

# Restart server
pkill -9 bgutil-pot
./bin/bgutil-pot server
```

---

## yt-dlp Plugin Issues

### Plugin Not Detected

**Symptoms:**
- No mention of POT in `yt-dlp -v` output
- Plugin files exist but ignored
- Downloads fail with bot detection errors

**Diagnosis:**

```bash
# Check if plugin is detected
yt-dlp -v 2>&1 | grep -i "pot"

# Expected output:
# [debug] [youtube] [pot] PO Token Providers: bgutil:http-1.2.2 (external)

# Check plugin directory
ls -la ~/.yt-dlp-plugins/

# Verify plugin structure
find ~/.yt-dlp-plugins/bgutil-ytdlp-pot-provider/ -type f
```

**Solutions:**

**Plugin not in right location:**
```bash
# Correct location should be
~/.yt-dlp-plugins/bgutil-ytdlp-pot-provider/

# If it's elsewhere, move it
mkdir -p ~/.yt-dlp-plugins
mv bgutil-ytdlp-pot-provider ~/.yt-dlp-plugins/

# Verify structure
ls -la ~/.yt-dlp-plugins/bgutil-ytdlp-pot-provider/pyproject.toml
ls -la ~/.yt-dlp-plugins/bgutil-ytdlp-pot-provider/yt_dlp_plugins/extractor/
```

**Plugin files corrupted:**
```bash
# Remove and reinstall
rm -rf ~/.yt-dlp-plugins/bgutil-ytdlp-pot-provider/

# Download fresh copy
cd ~/.yt-dlp-plugins
wget https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases/latest/download/bgutil-ytdlp-pot-provider-rs.zip
unzip -o bgutil-ytdlp-pot-provider-rs.zip

# Verify
yt-dlp -v 2>&1 | grep -i "pot"
```

**yt-dlp outdated:**
```bash
# Update yt-dlp
pip install --upgrade yt-dlp

# Verify version (should be 2025.05.22 or later)
yt-dlp --version

# Then check plugin
yt-dlp -v 2>&1 | grep -i "pot"
```

---

### Plugin Loads But Can't Reach POT Provider

**Symptoms:**
- Plugin detected in yt-dlp output
- Download fails with "Cannot connect to POT provider"
- Timeout errors

**Diagnosis:**

```bash
# Check if POT provider is running
curl http://127.0.0.1:4416/ping

# Check yt-dlp extraction args
yt-dlp --extractor-args "youtube:player_client=default"

# Try download with verbose output
yt-dlp -v "VIDEO_URL" 2>&1 | grep -i "pot\|token\|bgutil"
```

**Solutions:**

**POT provider not running:**
```bash
# Start it in a separate terminal
./bin/bgutil-pot server --port 4416

# Wait for it to be ready
sleep 2

# Test it
curl http://127.0.0.1:4416/ping

# Then try download in another terminal
yt-dlp "VIDEO_URL"
```

**Custom port not configured:**
```bash
# If using different port, tell yt-dlp
yt-dlp --extractor-args "youtubepot-bgutilhttp:base_url=http://127.0.0.1:8080" "VIDEO_URL"
```

**IPv6 vs IPv4 issue:**
```bash
# POT provider listens on IPv6 (::) by default
# Some systems may have issues

# Try forcing IPv4
./bin/bgutil-pot server --host 127.0.0.1 --port 4416

# Tell yt-dlp to use localhost instead
yt-dlp --extractor-args "youtubepot-bgutilhttp:base_url=http://localhost:4416" "VIDEO_URL"
```

---

## Download Issues

### Downloads Fail with HTTP 403 Error

**Symptoms:**
- Download fails midway with "HTTP Error 403: Forbidden"
- Works sometimes, fails other times
- Consistent failure on specific videos

**Diagnosis:**

```bash
# Check verbose output
yt-dlp -v "VIDEO_URL" 2>&1 | tail -50

# Look for:
# - POT token generation status
# - Which client is being used
# - When 403 error occurs

# Try with specific client
yt-dlp --extractor-args "youtube:player_client=ios" "VIDEO_URL"
```

**Solutions:**

**POT token expired or invalid:**
```bash
# Clear token cache
curl -X POST http://127.0.0.1:4416/invalidate_caches

# Restart POT provider
pkill -9 bgutil-pot
./bin/bgutil-pot server --port 4416

# Wait 2 seconds then retry
sleep 2
yt-dlp "VIDEO_URL"
```

**Try alternative client:**
```bash
# YouTube has multiple clients, try different ones

# iOS client (often most reliable)
yt-dlp --extractor-args "youtube:player_client=ios" "VIDEO_URL"

# Android client
yt-dlp --extractor-args "youtube:player_client=android" "VIDEO_URL"

# TV embedded
yt-dlp --extractor-args "youtube:player_client=tv_embedded" "VIDEO_URL"

# Web creator
yt-dlp --extractor-args "youtube:player_client=web_creator" "VIDEO_URL"
```

**IP being rate limited:**
```bash
# YouTube may block your IP temporarily
# Solutions:

# 1. Wait 1-2 hours before trying again

# 2. Use a proxy
yt-dlp --proxy "socks5://proxy.example.com:1080" "VIDEO_URL"

# 3. Use VPN
# Enable VPN, then try again

# 4. Use different network
# Try with different internet connection
```

---

### Downloads Timeout or Stall

**Symptoms:**
- Download starts but hangs
- "Connection timeout" error
- Very slow speeds

**Diagnosis:**

```bash
# Check network connectivity
ping -c 5 8.8.8.8

# Check speeds to YouTube
curl -w "@curl-format.txt" -o /dev/null -s "https://www.youtube.com"

# Monitor download with verbose
yt-dlp -v "VIDEO_URL" 2>&1 | tee download.log
```

**Solutions:**

**Network issues:**
```bash
# Check internet speed
# Use speedtest: https://speedtest.net

# If slow, try:
# - Move closer to WiFi router
# - Restart router
# - Use wired connection instead
# - Switch WiFi channel to less congested one
```

**YouTube rate limiting:**
```bash
# Add delays between requests
yt-dlp --socket-timeout 30 "VIDEO_URL"

# Or reduce concurrent connections
yt-dlp --ratelimit 2M "VIDEO_URL"

# Try with reduced format
yt-dlp -f "worst" "VIDEO_URL"
```

**Firewall/ISP throttling:**
```bash
# Use proxy to bypass throttling
yt-dlp --proxy "socks5://127.0.0.1:9050" "VIDEO_URL"

# Or VPN
# Enable VPN and retry

# Change DNS
# Set to 8.8.8.8 or 1.1.1.1
```

---

### "Sign in to confirm you're not a bot" Error

**Symptoms:**
- Download fails with "Sign in to confirm" message
- Even though POT provider is running
- Happens on public videos

**Diagnosis:**

```bash
# Check if POT provider is working
curl -X POST http://127.0.0.1:4416/get_pot -d '{}'

# Check if plugin is being used
yt-dlp -v "VIDEO_URL" 2>&1 | grep -i "token\|pot\|bgutil"

# Try different client to isolate
yt-dlp --extractor-args "youtube:player_client=ios" "VIDEO_URL"
```

**Solutions:**

**POT provider not active:**
```bash
# Make sure it's running
ps aux | grep bgutil-pot

# If not, start it
./bin/bgutil-pot server --port 4416

# Verify it's responding
curl http://127.0.0.1:4416/ping
```

**POT tokens not being used:**
```bash
# Verify plugin is loaded
yt-dlp -v 2>&1 | head -20 | grep -i "pot"

# If not visible, reinstall plugin
rm -rf ~/.yt-dlp-plugins/bgutil-ytdlp-pot-provider/
cd ~/.yt-dlp-plugins
wget https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases/latest/download/bgutil-ytdlp-pot-provider-rs.zip
unzip bgutil-ytdlp-pot-provider-rs.zip

# Try again
yt-dlp "VIDEO_URL"
```

**YouTube API changed:**
```bash
# Update bgutil-pot to latest version
cd youtube-downloader/bin
rm bgutil-pot

# Download latest
wget https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases/latest/download/bgutil-pot-[YOUR_OS]
chmod +x bgutil-pot-[YOUR_OS]
mv bgutil-pot-[YOUR_OS] bgutil-pot

# Restart
pkill -9 bgutil-pot
./bin/bgutil-pot server
```

**Try legacy mode:**
```bash
# Some configurations need this
yt-dlp --extractor-args "youtubepot-bgutilhttp:disable_innertube=1" "VIDEO_URL"
```

---

### "No playable formats found" Error

**Symptoms:**
- Video info extracts correctly
- But no download formats available
- Works on other videos

**Diagnosis:**

```bash
# Check available formats
yt-dlp -F "VIDEO_URL"

# If empty, try with different client
yt-dlp -F --extractor-args "youtube:player_client=ios" "VIDEO_URL"

# Check video info extraction
yt-dlp --dump-json "VIDEO_URL" 2>&1 | head -100
```

**Solutions:**

**Video is restricted:**
```bash
# Some videos have playback restrictions
# Try:

# Different country (use VPN)
VPN_ENABLED=true yt-dlp "VIDEO_URL"

# Different client
yt-dlp --extractor-args "youtube:player_client=tv_embedded" "VIDEO_URL"

# Login with account
yt-dlp --cookies-from-browser firefox "VIDEO_URL"
```

**Age restricted video:**
```bash
# Age restricted videos need authentication
# Add account cookies
yt-dlp --cookies-from-browser firefox "VIDEO_URL"

# Or specify birth date
yt-dlp --extractor-args "youtube:player_client=ios" "VIDEO_URL"
```

---

## Performance Issues

### Slow Token Generation

**Symptoms:**
- POT provider takes 5+ seconds to generate token
- Download process is very slow
- High CPU usage

**Diagnosis:**

```bash
# Measure token generation time
time curl -X POST http://127.0.0.1:4416/get_pot -d '{}'

# Check system resources
top -p $(pgrep bgutil-pot)

# Check network latency to YouTube
ping www.youtube.com
```

**Solutions:**

**Internet connectivity issue:**
```bash
# Test speed to YouTube servers
curl -w "Time total: %{time_total}\n" -o /dev/null -s "https://www.youtube.com"

# If slow:
# - Check WiFi signal
# - Switch to wired connection
# - Restart router
# - Use different DNS (8.8.8.8)
```

**System resource constrained:**
```bash
# Check available resources
free -h
df -h

# Close other applications
# Increase available memory
# Use lighter weight client

yt-dlp --extractor-args "youtube:player_client=ios" "VIDEO_URL"
```

**POT provider cache issues:**
```bash
# Clear old cache entries
curl -X POST http://127.0.0.1:4416/invalidate_caches

# Restart with fresh cache
pkill -9 bgutil-pot
./bin/bgutil-pot server --port 4416
```

---

### High Disk Usage During Download

**Symptoms:**
- Download uses too much disk space
- Video file larger than expected
- Disk fills up during download

**Diagnosis:**

```bash
# Check available disk space
df -h

# Check downloaded file size
ls -lh ~/Downloads/*.mp4

# Check video info for size estimate
yt-dlp --dump-json "VIDEO_URL" | grep "filesize"
```

**Solutions:**

**Download best quality unnecessarily:**
```bash
# Check available formats
yt-dlp -F "VIDEO_URL"

# Download lower quality
yt-dlp -f 22 "VIDEO_URL"  # 720p
yt-dlp -f 18 "VIDEO_URL"  # 360p

# Or format code
yt-dlp -f "best[ext=mp4]" "VIDEO_URL"
```

**Insufficient disk space:**
```bash
# Check free space
df -h /home

# Free up space
# Delete old files
# Move videos to external drive

# Or specify different output directory
yt-dlp -o "/mnt/external/%(title)s.%(ext)s" "VIDEO_URL"
```

---

## API & Integration Issues

### Download API Returns 500 Error

**Symptoms:**
- `/api/download` endpoint returns 500
- No helpful error message
- Works sometimes, fails other times

**Diagnosis:**

```bash
# Check server logs
tail -f /var/log/app.log

# Test endpoint directly
curl -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url":"VIDEO_URL","qualityId":"best"}'

# Check POT provider status
curl http://127.0.0.1:4416/ping
```

**Solutions:**

**POT provider not running:**
```bash
# Start POT provider
./bin/bgutil-pot server --port 4416

# Verify it's running
curl http://127.0.0.1:4416/ping

# Retry API call
curl -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url":"VIDEO_URL","qualityId":"best"}'
```

**Invalid URL format:**
```bash
# Make sure URL is valid YouTube URL
# Valid formats:
# - https://www.youtube.com/watch?v=VIDEO_ID
# - https://youtu.be/VIDEO_ID
# - https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID

# Test with known good URL
curl -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=jNQXAC9IVRw","qualityId":"best"}'
```

**Rate limiting triggered:**
```bash
# Check if rate limited
curl -X POST http://localhost:3000/api/download \
  -H "X-Forwarded-For: 127.0.0.1"

# Wait a few minutes, then retry

# Or configure different rate limit
# Edit proxy.ts
```

---

### Metadata Extraction Fails

**Symptoms:**
- `/api/metadata` returns error
- Cannot get video information
- Quality options don't load

**Diagnosis:**

```bash
# Test metadata endpoint
curl -X POST http://localhost:3000/api/metadata \
  -H "Content-Type: application/json" \
  -d '{"url":"VIDEO_URL"}'

# Check yt-dlp works
yt-dlp --dump-json "VIDEO_URL" 2>&1 | head -20
```

**Solutions:**

**Video not accessible:**
```bash
# Try manually
yt-dlp "VIDEO_URL"

# If fails, video may be:
# - Private
# - Deleted
# - Region restricted
# - Age restricted

# For age restricted, try:
yt-dlp --extractor-args "youtube:player_client=ios" "VIDEO_URL"
```

**POT provider issue:**
```bash
# Check POT provider
curl http://127.0.0.1:4416/ping

# If down, restart
pkill -9 bgutil-pot
./bin/bgutil-pot server --port 4416

# Retry metadata call
curl -X POST http://localhost:3000/api/metadata \
  -H "Content-Type: application/json" \
  -d '{"url":"VIDEO_URL"}'
```

---

## Health Checks & Monitoring

### Run Full Health Check

```bash
#!/bin/bash

echo "=== POT Provider Health Check ==="

# Check POT provider
if curl -s http://127.0.0.1:4416/ping > /dev/null; then
    echo "✓ POT provider is running"
else
    echo "✗ POT provider is NOT running"
    exit 1
fi

# Check token generation
TOKEN=$(curl -s -X POST http://127.0.0.1:4416/get_pot \
  -H "Content-Type: application/json" \
  -d '{}' | grep -o '"token":"[^"]*"')

if [ -n "$TOKEN" ]; then
    echo "✓ POT token generation works"
else
    echo "✗ POT token generation failed"
    exit 1
fi

# Check yt-dlp
if yt-dlp --version > /dev/null; then
    echo "✓ yt-dlp is installed"
else
    echo "✗ yt-dlp is NOT installed"
    exit 1
fi

# Check plugin
if yt-dlp -v 2>&1 | grep -q "pot"; then
    echo "✓ POT plugin is loaded"
else
    echo "✗ POT plugin is NOT loaded"
    exit 1
fi

echo ""
echo "✓ All checks passed!"
```

---

## Getting Help

### Collect Debug Information

When reporting issues, include:

```bash
# System info
uname -a

# yt-dlp info
yt-dlp --version
yt-dlp -v 2>&1 | head -30

# POT provider info
./bin/bgutil-pot --version
RUST_LOG=debug ./bin/bgutil-pot server 2>&1 | head -50

# Download verbose output
yt-dlp -v "VIDEO_URL" 2>&1 | tail -100

# Network info
curl -I https://www.youtube.com
```

### Report on GitHub

Include when opening issue:
1. Full error message
2. System info (OS, architecture)
3. Version of bgutil-pot
4. Version of yt-dlp
5. Verbose output logs
6. Steps to reproduce

---

## Emergency Recovery

### Reset Everything

```bash
# Stop all services
pkill -9 bgutil-pot
pkill -9 yt-dlp

# Clear caches
rm -rf ~/.cache/bgutil-pot/
rm -rf /tmp/bgutil-pot-*

# Reinstall plugin
rm -rf ~/.yt-dlp-plugins/bgutil-ytdlp-pot-provider/
cd ~/.yt-dlp-plugins
wget https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases/latest/download/bgutil-ytdlp-pot-provider-rs.zip
unzip -o bgutil-ytdlp-pot-provider-rs.zip

# Update yt-dlp
pip install --upgrade yt-dlp

# Restart POT provider
cd youtube-downloader
./bin/bgutil-pot server --port 4416

# In another terminal, test
yt-dlp -v "https://www.youtube.com/watch?v=jNQXAC9IVRw"
```

---

**Troubleshooting Version:** 1.0  
**Last Updated:** 2025  
**Status:** Complete Reference