# Cookie Feature Testing Guide

## 🧪 Local Testing Steps

### 1. Export Your YouTube Cookies

#### Chrome/Edge Method
1. Install extension: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
2. Visit https://youtube.com
3. Make sure you're logged in
4. Click the extension icon
5. Click "Export" → Save as `youtube-cookies.txt`

#### Firefox Method
1. Install extension: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)
2. Visit https://youtube.com
3. Make sure you're logged in
4. Click the extension icon
5. Export cookies → Save as `youtube-cookies.txt`

### 2. Test Without Cookies (Expected Bot Detection)

1. Start the dev server: `pnpm dev`
2. Open http://localhost:3000
3. Try a video URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
4. **If bot detection occurs**: You'll see an error about cookies
5. **If it works**: Local environment may not trigger bot detection (try on live server)

### 3. Test With Cookies

1. Click "YouTube Cookies" section to expand
2. Read the instructions
3. Click "Upload cookies.txt"
4. Select your exported cookie file
5. You should see: "✓ Cookies loaded successfully!"
6. Now paste a YouTube URL
7. Video should load and download without bot detection

### 4. Test Cookie Cleanup

Open terminal and run:
```bash
# Watch /tmp for cookie files (in a separate terminal)
watch -n 1 'ls -la /tmp/yt-cookies-* 2>/dev/null || echo "No cookie files found"'
```

Then:
1. Upload cookies in the app
2. Download a video
3. Watch the cookie file appear and disappear within seconds

### 5. Test Error Scenarios

#### Invalid File Type
- Try uploading a `.pdf` or `.json` file
- Expected: "Please upload a .txt file"

#### Invalid Cookie Format
- Create a text file with random content
- Try uploading it
- Expected: "No valid cookies found in file"

#### Non-YouTube Cookies
- Create a cookie file with non-YouTube domains
- Expected: "No YouTube cookies found"

## 🌐 Live Server Testing

### Deploy to Render/Production

1. Commit and push changes:
```bash
git add .
git commit -m "Add cookie authentication for YouTube bot detection bypass"
git push origin main
```

2. Wait for deployment (Render auto-deploys)

3. Test on live site with a video that typically triggers bot detection

### Videos Likely to Trigger Bot Detection
- Popular music videos
- Age-restricted content
- Region-locked videos
- High-view-count videos

### Expected Behavior

**Without Cookies:**
```
Error: YouTube detected automated access. 
Please upload your YouTube cookies to continue.
```

**With Cookies:**
- Video metadata loads successfully
- Download proceeds normally
- No bot detection errors

## 🔍 Debugging Checklist

### Frontend Issues
- [ ] Cookie upload component appears
- [ ] File upload accepts .txt files
- [ ] Success message shows after upload
- [ ] Badge shows "✓ Loaded" when cookies present
- [ ] Clear button works

### Backend Issues
- [ ] Check server logs for cookie file creation
- [ ] Verify cookie file format (Netscape)
- [ ] Confirm yt-dlp receives --cookies flag
- [ ] Check cookie cleanup happens
- [ ] Verify no cookie values in logs

### Common Issues

**Issue**: "No valid cookies found"
- **Solution**: Ensure cookies are in Netscape format
- **Check**: File should start with `# Netscape HTTP Cookie File`

**Issue**: Bot detection still occurs
- **Solution**: Cookies may be expired
- **Check**: Re-export fresh cookies from YouTube

**Issue**: Download fails even with cookies
- **Solution**: Video may be restricted for other reasons
- **Check**: Try a different video URL

## 📊 Success Criteria

- [x] Cookie upload UI is visible and functional
- [x] File upload accepts and parses .txt files
- [x] Cookies are validated and filtered
- [x] API endpoints accept cookie parameter
- [x] yt-dlp receives cookies via --cookies flag
- [x] Cookie files are created with UUID names
- [x] Cookie files are deleted after use
- [x] Error messages guide users to upload cookies
- [ ] Live server bypasses bot detection with cookies
- [ ] Multiple concurrent downloads work
- [ ] No cookie data leaks in logs

## 🎯 Test Cases

### Test Case 1: Normal Flow
1. Open app
2. Upload cookies
3. Enter URL
4. Download video
5. **Expected**: Success

### Test Case 2: Bot Detection Without Cookies
1. Open app (no cookies)
2. Enter URL that triggers bot detection
3. **Expected**: Clear error message with cookie instructions

### Test Case 3: Bot Detection With Cookies
1. Open app
2. Upload valid cookies
3. Enter URL that triggered bot detection before
4. **Expected**: Success

### Test Case 4: Invalid Cookies
1. Upload malformed cookie file
2. **Expected**: Validation error

### Test Case 5: Cookie Cleanup
1. Upload cookies
2. Download video
3. Check /tmp directory
4. **Expected**: Cookie file deleted within 2 minutes

### Test Case 6: Multiple Downloads
1. Upload cookies once
2. Download multiple videos
3. **Expected**: All use same cookies, all succeed

### Test Case 7: Cookie Clear
1. Upload cookies
2. Click "Clear" button
3. **Expected**: Badge removed, cookies cleared from state

## 🚀 Ready for Production

Once all tests pass:
1. ✅ Local testing complete
2. ✅ Live deployment successful
3. ✅ Bot detection bypassed
4. ✅ Cookie cleanup verified
5. ✅ No security issues
6. ✅ Documentation updated

## 📝 Notes

- Cookies expire - users may need to re-upload periodically
- Bot detection is not guaranteed on every video
- Cookie security is maintained - no permanent storage
- Privacy is respected - cookies used only for user's request
