# Quick Start - Checkpoint/Resume System

## 🚀 What's New

The YouTube Clipper now automatically saves your progress at each workflow step. If you get interrupted, just refresh and your workflow will resume right where you left off.

## ⚡ In 30 Seconds

1. **Open the app** → http://localhost:3002
2. **Submit a video** → Enter YouTube URL
3. **Start workflow** → Download, transcribe, detect moments, etc.
4. **Get interrupted** → Refresh page, close browser, whatever
5. **Resume automatically** → Modal appears with your progress
6. **Click "Resume Workflow"** → Continues from where it stopped

That's it!

---

## 🎯 Features

### 📥 What Gets Saved
- Last completed step (download, transcribe, detect moments, generate clips, metadata)
- Time elapsed so far
- All step data and results
- Progress timestamps

### ⏸️ How to Resume
**Three options when you come back:**
1. **Resume** - Continue from next step automatically
2. **Skip to Step** - Jump to any completed step if you want to redo something
3. **Start Fresh** - Begin a completely new workflow

### 🗑️ Cleanup
- Click **Delete** to remove old checkpoints
- Or just **Start Fresh** without deleting
- Checkpoints auto-clear when workflow completes

---

## 📍 Where Are My Files

```
./data/
├── checkpoints/          ← Workflow progress saved here
│   └── {video-id}/state.json
├── downloads/            ← Your downloaded videos
│   └── {video-id}/
└── output/               ← Generated clips
    └── {video-id}/
```

## 🔧 Environment

Everything runs locally:
- ✅ App: http://localhost:3002
- ✅ Data: ./data/ directory
- ✅ No cloud uploads
- ✅ All checkpoints stay on your machine

---

## 🎓 Common Questions

### Q: Do I have to use this?
**A:** No! Click "Start Fresh" anytime to ignore checkpoints and start over.

### Q: Will it slow down my downloads?
**A:** No. Checkpoint saving is <100ms, runs async.

### Q: How long are checkpoints kept?
**A:** Until you delete them or the workflow completes. You can manually delete via the UI.

### Q: What if my downloads get interrupted?
**A:** That's exactly what checkpoints handle. Just refresh and resume!

### Q: Can I resume on a different computer?
**A:** Not currently - checkpoints are stored locally. Cloud sync is a future feature.

### Q: What if I want to restart a specific step?
**A:** Use "Skip to Step" to jump back to any completed step and redo it.

---

## 🧪 Try It Now

### Test with a Sample Checkpoint
```bash
# Create a test checkpoint
mkdir -p data/checkpoints/test-video
cat > data/checkpoints/test-video/state.json << 'EOF'
{
  "videoId": "test-video",
  "videoUrl": "https://www.youtube.com/watch?v=test",
  "checkpoints": {
    "download": {
      "step": "download",
      "status": "complete",
      "timestamp": 1707115200000,
      "duration": 45000,
      "data": { "filePath": "/data/downloads/test-video/video.mp4" }
    }
  },
  "currentStep": "download",
  "totalDuration": 45000,
  "createdAt": 1707115200000,
  "lastUpdatedAt": 1707115200000
}
EOF

# Open the app
open http://localhost:3002
```

The resume modal should appear automatically!

---

## 📖 Full Documentation

For complete details, see:
- **[CHECKPOINT_SYSTEM.md](./CHECKPOINT_SYSTEM.md)** - All features explained
- **[TESTING_CHECKPOINTS.md](./TESTING_CHECKPOINTS.md)** - How to test everything

---

## 🔑 API Quick Reference

**For developers integrating checkpoint saving:**

```typescript
import { useCheckpoint } from '@/lib/useCheckpoint';

const { 
  checkpointState, 
  saveCheckpoint, 
  skipToStep 
} = useCheckpoint(videoId);

// Save when a step completes
await saveCheckpoint('download', 'complete', data, duration);

// Skip to specific step
await skipToStep('detect-moments');
```

---

## ✨ That's All

The checkpoint system works silently in the background. You'll only see it if a workflow gets interrupted.

**Happy clipping!** 🎬

---

## Still Have Questions?

Check out:
1. **[CHECKPOINT_SYSTEM.md](./CHECKPOINT_SYSTEM.md)** - Detailed documentation
2. **[TESTING_CHECKPOINTS.md](./TESTING_CHECKPOINTS.md)** - Test cases and troubleshooting
3. **GitHub Issues** - Post any bugs or feature requests

---

**Last Updated:** February 3, 2026
**Status:** ✅ Ready to Use
