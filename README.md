# YouTube Downloader

A modern, feature-rich YouTube downloader built with Next.js 15, TypeScript, and Tailwind CSS. Download videos and audio from YouTube with high quality and a beautiful user interface.

## 🚀 Features

### 📺 **Three Quality Options**
- **🎬🎵 Best Quality**: Automatically downloads the highest quality video + audio and merges them using ffmpeg
- **📺 Combined Format**: Downloads a single file with built-in audio (up to 720p)
- **🎵 Audio Only**: Extracts the highest quality audio as MP3

### 🎯 **Smart Downloads**
- ✅ **Always includes audio** - No more silent videos!
- ✅ **Proper filenames** - Uses actual video titles
- ✅ **Accurate file sizes** - Shows estimated download sizes
- ✅ **Automatic cleanup** - Temporary files are cleaned up after download

### 🌟 **Enhanced User Experience**
- ✅ **Modern UI** with gradient hero section and intuitive design
- ✅ **Video metadata** with channel links and formatted dates
- ✅ **Real-time progress** tracking for downloads
- ✅ **Error handling** with user-friendly messages
- ✅ **Responsive design** that works on all devices

### 🔗 **URL Support**
- ✅ `https://www.youtube.com/watch?v=VIDEO_ID`
- ✅ `https://youtu.be/VIDEO_ID`
- ✅ URL validation and error handling

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives
- **Backend**: Next.js API routes
- **Video Processing**: yt-dlp + ffmpeg for merging

## 📋 Prerequisites

### System Requirements
- **Node.js** 18+ 
- **yt-dlp** installed globally
- **ffmpeg** for stream merging

### Installation Commands
```bash
# Install yt-dlp
pip install yt-dlp

# Install ffmpeg (macOS)
brew install ffmpeg

# Install ffmpeg (Ubuntu/Debian)
sudo apt install ffmpeg

# Install ffmpeg (Windows)
# Download from https://ffmpeg.org/download.html
```

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/AZLabsAI/youtube-downloader.git
cd youtube-downloader
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Open in Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
youtube-downloader/
├── app/
│   ├── api/
│   │   ├── download/route.ts    # Download endpoint
│   │   └── metadata/route.ts    # Video metadata endpoint
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main page
├── components/
│   ├── ui/                      # Reusable UI components
│   ├── quality-options.tsx      # Quality selection component
│   ├── video-metadata.tsx       # Video info display
│   └── url-input.tsx           # URL input component
├── services/
│   └── ytdlp.service.ts        # yt-dlp service wrapper
└── lib/
    └── utils.ts                # Utility functions
```

## 🔧 API Endpoints

### POST `/api/metadata`
Get video metadata and available quality options.

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**
```json
{
  "id": "VIDEO_ID",
  "title": "Video Title",
  "thumbnail": "https://...",
  "duration": 213,
  "channel": "Channel Name",
  "channelUrl": "https://...",
  "views": 1000000,
  "uploadDateFormatted": "October 25, 2009",
  "qualityOptions": [
    {
      "id": "best_merged",
      "title": "Best Quality",
      "description": "2160p + 129 kbps audio",
      "quality": "2160p",
      "format": "mp4",
      "estimatedSize": "241.7 MB",
      "icon": "🎬🎵"
    }
  ]
}
```

### POST `/api/download`
Download video with specified quality.

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "qualityId": "best_merged"
}
```

**Response:** Binary file stream with proper headers

## 🎨 UI Components

### QualityOptions Component
```tsx
<QualityOptions 
  options={video.qualityOptions} 
  onDownload={handleDownload} 
/>
```

### VideoMetadata Component
```tsx
<VideoMetadata 
  title={video.title}
  channel={video.channel}
  channelUrl={video.channelUrl}
  views={video.views}
  uploadDateFormatted={video.uploadDateFormatted}
  originalUrl={video.originalUrl}
/>
```

## 🔍 Quality Options Explained

### 1. Best Quality (Merged) 🎬🎵
- **Format**: MP4 (merged)
- **Video**: Highest available quality (up to 4K)
- **Audio**: Highest available quality (usually 128-256 kbps)
- **Process**: Downloads separate video + audio streams, merges with ffmpeg
- **Pros**: Best quality, always includes audio
- **Cons**: Larger file size, requires ffmpeg

### 2. Combined Format 📺
- **Format**: MP4 (single file)
- **Quality**: Up to 720p with built-in audio
- **Process**: Downloads single file from YouTube
- **Pros**: Faster download, smaller file size
- **Cons**: Limited to 720p, not available for all videos

### 3. Audio Only 🎵
- **Format**: MP3
- **Quality**: Highest available audio quality
- **Process**: Extracts audio from video and converts to MP3
- **Pros**: Small file size, perfect for music
- **Cons**: No video

## 🚨 Important Notes

### Legal Disclaimer
This tool is for **educational purposes only**. Users must:
- Respect YouTube's Terms of Service
- Only download videos they have permission to download
- Comply with copyright laws in their jurisdiction
- Use responsibly and ethically

### Rate Limiting
- Downloads are limited to prevent abuse
- Temporary files are automatically cleaned up
- Server resources are managed efficiently

### Browser Compatibility
- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers supported

## 🐛 Troubleshooting

### Common Issues

**1. "yt-dlp command not found"**
```bash
# Install yt-dlp
pip install yt-dlp
# Or update if already installed
pip install --upgrade yt-dlp
```

**2. "ffmpeg not found"**
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg
```

**3. "Download failed"**
- Check if video is available and public
- Verify URL format is correct
- Try updating yt-dlp: `pip install --upgrade yt-dlp`

**4. "No audio in downloaded video"**
- Use "Best Quality" option which guarantees audio
- Ensure ffmpeg is installed for merging

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables
```env
NODE_ENV=development
```

## 📦 Deployment

### Current Status
This application currently requires:
- System access to `yt-dlp` binary
- `ffmpeg` installation
- File system write access

### Deployment Options
1. **VPS/Dedicated Server** (Recommended)
   - DigitalOcean, Linode, AWS EC2
   - Install system dependencies
   - Deploy with PM2 or Docker

2. **Railway/Render**
   - Support for system binaries
   - Easy deployment with buildpacks

3. **Docker Deployment**
   - Use dockerfile with yt-dlp and ffmpeg
   - Container-based deployment

### Future Enhancements
- Pure JavaScript implementation for serverless deployment
- Web Workers for client-side processing
- Progressive Web App (PWA) features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Powerful YouTube downloader
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Unstyled UI components

---

**Made with ❤️ by AZLabsAI**