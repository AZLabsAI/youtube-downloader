# YouTube Downloader Pro

A revolutionary YouTube downloader featuring a stunning **Liquid Glass** design aesthetic. Built with Next.js 15, React 19, and TypeScript, this professional-grade application delivers enterprise-level performance with an immersive, full-screen user experience.

![YouTube Downloader](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)

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

### 🌟 **Liquid Glass Design Experience**
- ✨ **Immersive Full-Screen Hero** with animated gradient orbs and floating geometric shapes
- 🎨 **Glassmorphism Effects** with backdrop blur and transparency throughout
- 🌈 **Dynamic Animations** including pulsing orbs, bouncing shapes, and smooth transitions
- 🌙 **Beautiful Dark Mode** with professional slate/blue/indigo color palette
- 📱 **Fully Responsive** design optimized for all devices and screen sizes
- ⚡ **Interactive Elements** with hover effects, scale transforms, and visual feedback
- 🎯 **Enterprise-Grade UI** with professional typography and visual hierarchy

### 🔗 **URL Support**
- ✅ `https://www.youtube.com/watch?v=VIDEO_ID`
- ✅ `https://youtu.be/VIDEO_ID`
- ✅ URL validation and error handling

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript 5.0 with strict mode
- **Styling**: Tailwind CSS 3.x with custom Liquid Glass design system
- **UI Components**: Radix UI primitives (shadcn/ui)
- **Video Processing**: yt-dlp + ffmpeg for high-quality merging
- **State Management**: React hooks (useState, useRef)
- **Animation**: CSS transforms, transitions, and keyframe animations

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
├── .cursor/
│   └── rules/                   # Cursor AI development rules
│       ├── project-structure.mdc
│       ├── design-system.mdc
│       ├── typescript-patterns.mdc
│       ├── ytdlp-service.mdc
│       ├── component-guidelines.mdc
│       ├── nextjs-api-routes.mdc
│       └── deployment-considerations.mdc
├── app/
│   ├── api/
│   │   ├── download/route.ts    # Download endpoint
│   │   └── metadata/route.ts    # Video metadata endpoint
│   ├── globals.css              # Global styles with Liquid Glass effects
│   ├── layout.tsx               # Root layout (minimal wrapper)
│   └── page.tsx                 # Main page with hero integration
├── components/
│   ├── ui/                      # Shadcn UI components
│   │   ├── button.tsx           # Premium button component
│   │   ├── card.tsx             # Glass card component
│   │   ├── badge.tsx            # Badge component
│   │   ├── input.tsx            # Input component
│   │   └── progress.tsx         # Progress indicator
│   ├── hero-section.tsx         # Full-screen Liquid Glass hero
│   ├── quality-options.tsx      # Quality selection cards
│   ├── video-metadata.tsx       # Video info display
│   └── url-input.tsx            # YouTube URL input
├── services/
│   └── ytdlp.service.ts         # yt-dlp service wrapper
├── lib/
│   ├── types.ts                 # TypeScript interfaces
│   └── utils.ts                 # Utility functions
└── public/                      # Static assets
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

## 🎨 Design System

### Liquid Glass Aesthetic

The application features a revolutionary **Liquid Glass** design system with:

#### Background Elements
- **Animated Gradient Orbs**: Large, pulsing circles with `blur-3xl` effects
- **Floating Geometric Shapes**: Small bouncing elements with staggered delays
- **Grid Pattern Overlay**: Subtle grid for depth perception
- **Multi-layer Gradients**: Slate/Blue/Indigo/Purple color combinations

#### Glassmorphism Effects
```css
backdrop-blur-sm           /* Frosted glass effect */
bg-white/60                /* 60% opacity white background */
border border-white/20     /* Subtle borders */
shadow-xl                  /* Elevated appearance */
```

#### Animation Patterns
- **Pulse**: `animate-pulse` for breathing effects
- **Bounce**: `animate-bounce` with delays (500ms, 1000ms, 1500ms)
- **Hover Transforms**: `hover:scale-105`, `hover:-translate-y-2`
- **Smooth Transitions**: `transition-all duration-300`

#### Color Palette
- **Primary**: Blue 600 → Purple 600 gradients
- **Base**: Slate 50/800/900 with opacity
- **Accents**: Indigo, Purple, Pink for visual interest
- **Dark Mode**: Full support with inverted opacity

### Key Components

#### HeroSection
```tsx
<HeroSection onGetStarted={scrollToUrlInput} />
```
- Full-screen viewport with `min-h-screen`
- Animated background with multiple layers
- Professional typography with gradient text
- Feature cards with glassmorphism
- Stats section with hover effects

#### QualityOptions
```tsx
<QualityOptions 
  options={video.qualityOptions} 
  onDownload={handleDownload} 
/>
```
- Glass card design with backdrop blur
- Icon display with format badges
- Estimated file sizes
- Loading states with spinners

#### VideoMetadata
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
- Thumbnail with hover effects
- Gradient text for titles
- Clickable channel links
- Formatted metadata display

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
- Playlist support for batch downloads
- Video format converter
- Subtitle extraction and download

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 Documentation

### Comprehensive Cursor Rules
This project includes detailed Cursor AI rules in `.cursor/rules/`:
- **project-structure.mdc**: Architecture and file organization
- **design-system.mdc**: Liquid Glass design guidelines
- **typescript-patterns.mdc**: TypeScript best practices
- **ytdlp-service.mdc**: Video processing integration guide
- **component-guidelines.mdc**: Component development standards
- **nextjs-api-routes.mdc**: API patterns and error handling
- **deployment-considerations.mdc**: Production deployment strategies

## 🙏 Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Powerful YouTube downloader
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Unstyled UI components
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components

## 📊 Project Stats

- **Lines of Code**: ~7,000+
- **Components**: 15+
- **API Endpoints**: 2
- **Quality Options**: 3
- **Supported Formats**: MP4, MP3
- **Max Quality**: Up to 8K video

## 🌟 Highlights

- ✨ **Revolutionary Liquid Glass Design**
- ⚡ **Lightning Fast Downloads**
- 🎨 **Beautiful Dark Mode**
- 📱 **Fully Responsive**
- 🔒 **Enterprise Security**
- 🎯 **Professional Grade UI**

---

<div align="center">

**Made with ❤️ by [AZLabsAI](https://github.com/AZLabsAI)**

[⭐ Star this repo](https://github.com/AZLabsAI/youtube-downloader) • [🐛 Report Bug](https://github.com/AZLabsAI/youtube-downloader/issues) • [💡 Request Feature](https://github.com/AZLabsAI/youtube-downloader/issues)

</div>