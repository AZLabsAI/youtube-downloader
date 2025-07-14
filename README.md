# YouTube Video Downloader

A comprehensive YouTube video downloader web application built with Next.js 15, shadcn/ui components, and Tailwind CSS.

## Features

- 🎥 **Video & Audio Downloads** - Support for multiple formats (MP4, WebM, AVI) and audio-only downloads (MP3, AAC, OGG)
- 📊 **Quality Selection** - Dynamic quality selector showing all available formats with file sizes
- 🎨 **Modern UI** - Clean, responsive interface built with shadcn/ui and Tailwind CSS
- 📱 **Responsive Design** - Optimized for desktop and mobile devices
- 🔒 **Rate Limiting** - 5 downloads per minute per IP address to prevent abuse
- ⚡ **Real-time Metadata** - Automatic video information extraction including title, thumbnail, duration, and channel

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS 3.x, shadcn/ui components
- **Backend**: Next.js API Routes, yt-dlp integration
- **Rate Limiting**: Built-in middleware

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- yt-dlp installed on your system (`pip install yt-dlp` or `brew install yt-dlp`)

## Installation

1. Clone the repository:
```bash
cd youtube-downloader
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
youtube-downloader/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
├── services/              # Backend services
├── lib/                   # Utilities
└── middleware.ts          # Rate limiting middleware
```

## Usage

1. Enter a YouTube URL in the input field
2. Click "Get Video Info" to fetch video metadata
3. Select your preferred quality and format
4. Click "Download" to start the download

## API Endpoints

- `POST /api/metadata` - Get video metadata
- `POST /api/download` - Start video download

## Rate Limiting

The application implements rate limiting to prevent abuse:
- 5 downloads per minute per IP address
- Rate limit information is returned in response headers

## Disclaimer

This tool is for educational purposes only. Please respect YouTube's Terms of Service and copyright laws. Only download videos you have permission to download.

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Future Enhancements

- [ ] Download progress tracking with Server-Sent Events
- [ ] Dark/light theme toggle
- [ ] Batch download functionality
- [ ] Download history
- [ ] Resume interrupted downloads
- [ ] Audio format conversion options