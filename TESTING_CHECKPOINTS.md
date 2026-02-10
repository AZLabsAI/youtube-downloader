# Checkpoint/Resume System - Testing Guide

## Server Status

The YouTube Clipper is now running with checkpoint/resume functionality on **localhost:3002**.

## Quick Start Testing

### 1. Verify Checkpoint Endpoints

Test that all checkpoint endpoints are accessible:

```bash
# List incomplete checkpoints
curl http://localhost:3002/api/checkpoint/list

# Expected response:
# {"checkpoints":[]}  (empty initially)
```

### 2. Test Checkpoint Initialization

When a user fetches video metadata, a checkpoint is automatically created.

```bash
curl -X POST http://localhost:3002/api/metadata \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

Expected response will include `"checkpointInitialized": true`

### 3. Test Checkpoint Listing

After initializing a checkpoint:

```bash
curl http://localhost:3002/api/checkpoint/list
```

You should see:
```json
{
  "checkpoints": [
    {
      "videoId": "dQw4w9WgXcQ",
      "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "lastCompletedStep": null,
      "nextStep": "download",
      "timeElapsed": 0,
      "createdAt": 1707115200000,
      "lastUpdatedAt": 1707115200000,
      "checkpoints": {}
    }
  ]
}
```

### 4. Test Manual Checkpoint Saving

Simulate step completion (download, transcribe, etc.):

```bash
curl -X POST http://localhost:3002/api/checkpoint/save \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "dQw4w9WgXcQ",
    "step": "download",
    "status": "complete",
    "data": {
      "filePath": "/data/downloads/dQw4w9WgXcQ/video.mp4",
      "fileSize": 52428800
    },
    "duration": 45000
  }'
```

Then list checkpoints again - you should see `lastCompletedStep: "download"` and `timeElapsed: 45000`.

### 5. Test Skip-to-Step

Resume from a specific step:

```bash
curl -X POST http://localhost:3002/api/checkpoint/skip-to-step \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "dQw4w9WgXcQ",
    "targetStep": "detect-moments"
  }'
```

The nextStep should now be "detect-moments".

### 6. Test Checkpoint Deletion

Delete a checkpoint:

```bash
curl -X DELETE http://localhost:3002/api/checkpoint/dQw4w9WgXcQ
```

Verify it's gone by listing checkpoints again.

## UI Testing

### Test 1: Resume Modal on Page Load

1. Open http://localhost:3002
2. Submit a video URL (any YouTube URL)
3. **Manually interrupt** the workflow (e.g., refresh page, close tab)
4. **Refresh the page**
5. ✅ **Resume Modal should appear** showing:
   - Video URL
   - Last completed step
   - Time elapsed
   - Resume/Delete/Start Fresh options

### Test 2: Resume Workflow

1. From the Resume Modal, click "Resume Workflow"
2. The workflow should:
   - Skip already-completed steps
   - Continue from the next incomplete step
   - Show progress for the current step

### Test 3: Skip to Specific Step

1. Resume Modal is open
2. Select a different completed step
3. Click "Resume Workflow"
4. The workflow should start from the selected step

### Test 4: Start Fresh

1. Resume Modal is open
2. Click "Start Fresh"
3. Modal closes
4. New video submission starts without resume

### Test 5: Delete Checkpoint

1. Resume Modal is open
2. Click "Delete"
3. Confirm deletion
4. Modal closes
5. Checkpoint should be removed (no resume on refresh)

## Manual Checkpoint Creation for Testing

If you want to test without downloading actual videos, manually create checkpoint state:

```bash
mkdir -p data/checkpoints/test-video-id

cat > data/checkpoints/test-video-id/state.json << 'EOF'
{
  "videoId": "test-video-id",
  "videoUrl": "https://www.youtube.com/watch?v=test",
  "checkpoints": {
    "download": {
      "step": "download",
      "timestamp": 1707115200000,
      "status": "complete",
      "duration": 45000,
      "data": {
        "filePath": "/data/downloads/test-video-id/video.mp4",
        "fileSize": 52428800
      }
    },
    "transcribe": {
      "step": "transcribe",
      "timestamp": 1707115245000,
      "status": "complete",
      "duration": 120000,
      "data": {
        "transcriptPath": "/data/checkpoints/test-video-id/transcript.json"
      }
    }
  },
  "currentStep": "transcribe",
  "totalDuration": 165000,
  "createdAt": 1707115200000,
  "lastUpdatedAt": 1707115245000
}
EOF
```

Then:
```bash
curl http://localhost:3002/api/checkpoint/list
```

You should see the test checkpoint with last completed step as "transcribe".

## Edge Cases to Test

### 1. Multiple Concurrent Checkpoints
- Create 3 different video checkpoints
- Refresh page - resume modal should show all 3
- Resume one, delete another
- Verify correct ones persist

### 2. Interrupted Download
- Start downloading
- Stop mid-download (kill process, refresh, etc.)
- Checkpoint should still have download marked as in progress
- Resume should skip to next step

### 3. Failed Steps
- Manually create checkpoint with status: "failed"
- Resume from that point
- Verify workflow handles failures gracefully

### 4. File Cleanup
- After successful download, file should be in data/downloads/{videoId}/
- Checkpoint should reference it without duplication
- Delete checkpoint - should not delete actual video file

### 5. Concurrent Requests
- Start multiple downloads at same time
- All should create separate checkpoints
- No conflicts or data loss

## Performance Testing

### Check Storage Usage
```bash
du -sh data/
du -sh data/checkpoints/
du -sh data/downloads/
du -sh data/output/
```

Checkpoint files should be minimal (<10KB each).

### Check API Response Times
```bash
time curl http://localhost:3002/api/checkpoint/list
```

Should be <100ms even with many checkpoints.

### Monitor Memory Usage
Watch terminal output for memory leaks during long operations.

## Logging & Debugging

### Enable Verbose Logging
Check `/tmp/youtube-clipper.log`:
```bash
tail -f /tmp/youtube-clipper.log
```

### Check Checkpoint Files
```bash
ls -la data/checkpoints/*/
cat data/checkpoints/[video-id]/state.json | jq .
```

### Verify File Structure
```bash
tree data/
```

## Common Issues & Solutions

### Checkpoint Not Appearing After Metadata Fetch
- ✅ Check that /tmp/youtube-clipper.log shows initialization
- ✅ Verify data/checkpoints/ directory was created
- ✅ Check browser console for errors

### Resume Modal Not Showing
- ✅ Verify checkpoint list returns data: `curl localhost:3002/api/checkpoint/list`
- ✅ Check React component is imported in page.tsx
- ✅ Verify useEffect runs on mount

### Delete Not Working
- ✅ Check file permissions on data/checkpoints/
- ✅ Verify videoId is being passed correctly
- ✅ Check browser console for errors

### Files Not Being Stored
- ✅ Verify data/ directory exists and is writable
- ✅ Check DATA_DIR environment variable
- ✅ Ensure no permission issues: `ls -la data/`

## Next Steps

1. ✅ **Verify checkpoint endpoints** - All responding correctly
2. ✅ **Test UI modal** - Resume modal shows on incomplete workflows
3. ✅ **Test workflows** - Full workflow with resume points
4. ✅ **Test edge cases** - Multiple checkpoints, failures, etc.
5. ⏳ **Load testing** - Test with large files and many concurrent operations
6. ⏳ **Integration testing** - Full end-to-end with real videos

## Success Criteria

- ✅ Checkpoint system fully functional
- ✅ UI updated with checkpoint recovery modal
- ✅ All endpoints wired up and responding
- ✅ App running on localhost:3002
- ✅ Ready to test with real video workflows

## Support

For issues or questions about the checkpoint system, refer to:
- CHECKPOINT_SYSTEM.md - Complete documentation
- components/resume-modal.tsx - UI implementation
- services/checkpoint.service.ts - Core service logic
- app/api/checkpoint/ - API endpoints
