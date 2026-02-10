# Checkpoint/Resume System Documentation

## Overview

The YouTube Clipper now includes a comprehensive checkpoint and resume system that allows users to pause and resume their workflow at any step without losing progress.

## Features

### 1. **Automatic Checkpointing**
- Each workflow step (download, transcribe, detect-moments, generate-clips, generate-metadata) automatically saves its state
- Checkpoints are stored in `./data/checkpoints/{video_id}/state.json`
- Each checkpoint includes:
  - Step name
  - Status (complete or failed)
  - Timestamp
  - Duration of the step
  - Optional data or error message

### 2. **Resume Modal UI**
- On app startup, if there are incomplete workflows, a resume modal appears
- Shows:
  - Video URL
  - Last completed step
  - Time elapsed so far
  - Steps that can be resumed from

### 3. **Flexible Resume Options**
- **Continue from last step**: Automatically resumes from the next incomplete step
- **Skip to specific step**: Allows resuming from any completed step (useful if you want to restart a specific part)
- **Start fresh**: Delete the checkpoint and start over with a new workflow

### 4. **File Organization**
```
./data/
├── checkpoints/
│   └── {video_id}/
│       └── state.json          # Workflow state and checkpoint data
├── downloads/
│   └── {video_id}/
│       └── video.mp4           # Downloaded video file
└── output/
    └── {video_id}/
        ├── clip_1.mp4
        ├── clip_2.mp4
        └── metadata.json
```

## API Endpoints

### 1. **GET /api/checkpoint/list**
Lists all incomplete checkpoints.

**Response:**
```json
{
  "checkpoints": [
    {
      "videoId": "abc123",
      "videoUrl": "https://youtube.com/watch?v=abc123",
      "lastCompletedStep": "download",
      "nextStep": "transcribe",
      "timeElapsed": 45000,
      "createdAt": 1707115200000,
      "lastUpdatedAt": 1707115245000,
      "checkpoints": { ... }
    }
  ]
}
```

### 2. **POST /api/checkpoint/resume**
Resume a workflow from where it left off.

**Request:**
```json
{
  "videoId": "abc123"
}
```

**Response:**
```json
{
  "videoId": "abc123",
  "videoUrl": "https://youtube.com/watch?v=abc123",
  "lastCompletedStep": "download",
  "nextStep": "transcribe",
  "timeElapsed": 45000,
  "shouldResume": true,
  "checkpoints": { ... }
}
```

### 3. **POST /api/checkpoint/skip-to-step**
Skip to a specific step in the workflow.

**Request:**
```json
{
  "videoId": "abc123",
  "targetStep": "detect-moments"
}
```

Valid steps: `download`, `transcribe`, `detect-moments`, `generate-clips`, `generate-metadata`

**Response:**
```json
{
  "videoId": "abc123",
  "videoUrl": "https://youtube.com/watch?v=abc123",
  "lastCompletedStep": "download",
  "nextStep": "detect-moments",
  "targetStep": "detect-moments",
  "message": "Skipped to step: detect-moments",
  "checkpoints": { ... }
}
```

### 4. **POST /api/checkpoint/init**
Initialize a new workflow for a video.

**Request:**
```json
{
  "videoId": "abc123",
  "videoUrl": "https://youtube.com/watch?v=abc123"
}
```

**Response:**
```json
{
  "message": "Workflow initialized",
  "videoId": "abc123",
  "videoUrl": "https://youtube.com/watch?v=abc123",
  "state": { ... }
}
```

### 5. **POST /api/checkpoint/save**
Save a checkpoint after completing a step (called by backend during processing).

**Request:**
```json
{
  "videoId": "abc123",
  "step": "transcribe",
  "status": "complete",
  "data": { ... },
  "duration": 120000
}
```

### 6. **DELETE /api/checkpoint/{videoId}**
Delete a checkpoint and start fresh.

**Response:**
```json
{
  "message": "Checkpoint deleted for video abc123",
  "videoId": "abc123"
}
```

## Usage in Frontend

### Using the Resume Modal

The `ResumeModal` component automatically appears on app load if there are incomplete checkpoints:

```tsx
import { ResumeModal } from "@/components/resume-modal";

<ResumeModal
  checkpoint={checkpoint}
  onResume={(videoId, skipToStep) => {
    // Handle resume logic
  }}
  onDelete={(videoId) => {
    // Handle deletion
  }}
  onStartFresh={() => {
    // Handle starting fresh
  }}
/>
```

### Using the useCheckpoint Hook

For programmatic checkpoint management:

```tsx
import { useCheckpoint } from "@/lib/useCheckpoint";

const MyComponent = () => {
  const { 
    checkpointState, 
    isCheckpointLoading, 
    saveCheckpoint, 
    skipToStep 
  } = useCheckpoint(videoId);

  const handleStepComplete = async () => {
    await saveCheckpoint('download', 'complete', data, duration);
  };

  return ...
};
```

## Backend Integration

### Saving Checkpoints During Processing

```typescript
import { checkpointService } from '@/services/checkpoint.service';

// Initialize workflow
const state = checkpointService.initializeWorkflow(videoId, url);

// Save checkpoint after step completes
const startTime = Date.now();
// ... do work ...
const duration = Date.now() - startTime;

checkpointService.saveCheckpoint(
  videoId,
  'transcribe',
  'complete',
  { transcriptData: ... },
  null,  // error
  duration
);
```

### Checking for Resume Points

```typescript
// Get last completed step
const lastStep = checkpointService.getLastCompletedStep(videoId);

// Get next step to resume from
const nextStep = checkpointService.getNextStep(lastStep);

// Skip to a specific step
checkpointService.skipToStep(videoId, 'generate-clips');
```

## Workflow States

Each step in the workflow has a checkpoint state:

```typescript
interface Checkpoint {
  step: 'download' | 'transcribe' | 'detect-moments' | 'generate-clips' | 'generate-metadata';
  timestamp: number;           // When checkpoint was created
  status: 'complete' | 'failed';
  data?: any;                 // Step-specific data (e.g., file paths, results)
  error?: string;             // Error message if status is 'failed'
  duration: number;           // How long the step took (milliseconds)
}
```

## Testing the Resume System

### Test 1: Download and Resume
1. Start downloading a video
2. **Stop the workflow** (press browser back, close tab, etc.)
3. Refresh the page
4. **Resume modal appears** showing:
   - Video URL
   - Last completed step (download)
   - Time elapsed
5. Click "Resume Workflow" → continues from transcription
6. Verify file integrity

### Test 2: Skip to Step
1. Have a completed checkpoint
2. Click "Resume Workflow"
3. Select a different step (e.g., "Generate Clips")
4. Workflow skips earlier steps and starts from the selected step
5. Verify only selected step and beyond are reprocessed

### Test 3: Delete Checkpoint
1. Have an incomplete checkpoint
2. Click "Delete" button
3. Verify checkpoint is removed from list
4. New video submission starts fresh (no resume modal)

### Test 4: Multiple Checkpoints
1. Start 3 different video workflows
2. Leave them all incomplete
3. Refresh page
4. Resume modal shows all 3 with individual options
5. Test resuming one while deleting others

## Performance Considerations

- **Checkpoint Storage**: Minimal disk space (state.json is small, actual files are in downloads/output)
- **Recovery Time**: Resume is almost instant (just loads state.json)
- **API Overhead**: Extra headers/calls are minimal
- **File Cleanup**: Downloaded videos are scheduled for cleanup after download streaming

## Future Enhancements

- [ ] Automatic checkpoint cleanup after 30 days
- [ ] Cloud-based checkpoint storage for cross-device resume
- [ ] Checkpoint version history (rollback to previous states)
- [ ] Batch resume (continue multiple workflows at once)
- [ ] Checkpoint notifications (resume reminders)
- [ ] Advanced filtering and search in checkpoint manager

## Troubleshooting

### Checkpoint Not Appearing
- Check `./data/checkpoints/` directory exists
- Verify file permissions
- Check browser console for errors
- Restart the app

### Resume Fails
- Verify downloaded video file still exists in `./data/downloads/{videoId}/`
- Check checkpoint state.json integrity
- Try deleting and starting fresh

### Stale Checkpoints
- Use DELETE endpoint to manually remove old checkpoints
- Implement automatic cleanup with cron job

## Environment Variables

```bash
# Optional: Custom data directory (default: ./data)
DATA_DIR=/custom/path/to/data
```

## See Also

- [Checkpoint Service](./services/checkpoint.service.ts)
- [useCheckpoint Hook](./lib/useCheckpoint.ts)
- [Resume Modal Component](./components/resume-modal.tsx)
- [API Endpoints](./app/api/checkpoint/)
