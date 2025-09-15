# MindfulReplay Web App

A modern web application for learning with YouTube videos, allowing users to save videos, create memos, and manage tasks.

## Features

- 📹 **Video Management**: Save and organize YouTube learning videos
- 📝 **Smart Memos**: Create memos with timestamps and templates
- 🎯 **Task Management**: Convert memos into actionable tasks
- ⏱️ **Timestamp Navigation**: Click timestamps to jump to specific video moments
- 🎨 **Modern UI**: Responsive design built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **API**: Next.js App Router API Routes
- **Video Player**: YouTube IFrame API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and configure:
```
YOUTUBE_API_KEY=your_youtube_api_key_here
YOUTUBE_USE_MOCK=false
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Development Mode

The app includes mock data for development when `YOUTUBE_USE_MOCK=true`. This allows you to test features without a YouTube API key.

## API Endpoints

- `GET /api/videos` - List saved videos
- `POST /api/videos` - Save a new video
- `GET /api/preview-video` - Preview video metadata from YouTube URL

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - `YOUTUBE_API_KEY` (optional)
   - `YOUTUBE_USE_MOCK=true` (for demo mode)

### Manual Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── video/[videoId]/   # Video player page
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── memo/             # Memo management
│   ├── video/            # Video components
│   ├── TimestampText.tsx # Timestamp parsing
│   └── YouTubePlayer.tsx # YouTube player
└── types/                # TypeScript definitions
```

## Features in Detail

### Video Management
- Save YouTube videos by URL
- Automatic metadata extraction
- Grid view with thumbnails
- Video duration and channel info

### Memo System
- Create memos with templates (insight, action, question, summary)
- Importance ratings (1-5 stars)
- Timestamp integration
- Clickable timestamps in memo content

### YouTube Integration
- YouTube IFrame API for video playback
- Automatic video ID extraction from URLs
- Thumbnail and metadata fetching
- Mock data for development

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary.
