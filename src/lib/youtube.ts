interface YouTubeVideoResponse {
  kind: string;
  etag: string;
  items: YouTubeVideoItem[];
}

interface YouTubeVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number; };
      medium: { url: string; width: number; height: number; };
      high: { url: string; width: number; height: number; };
      standard?: { url: string; width: number; height: number; };
      maxres?: { url: string; width: number; height: number; };
    };
    channelTitle: string;
    tags?: string[];
    categoryId: string;
    liveBroadcastContent: string;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
  };
  contentDetails: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
    regionRestriction?: {
      allowed?: string[];
      blocked?: string[];
    };
    contentRating: any;
    projection: string;
  };
  statistics: {
    viewCount: string;
    likeCount?: string;
    dislikeCount?: string;
    favoriteCount: string;
    commentCount?: string;
  };
}

export interface VideoMetadata {
  youtubeId: string;
  title: string;
  description: string;
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  publishedAt: string;
  viewCount: number;
  likeCount: number | null;
  tags: string[];
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

function parseDuration(duration: string): number {
  // Parse ISO 8601 duration format (PT1H23M45S)
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);

  if (!match) {
    return 0;
  }

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

function getMockVideoMetadata(youtubeId: string): VideoMetadata {
  // Mock data for development and testing
  const mockVideos: Record<string, VideoMetadata> = {
    'dQw4w9WgXcQ': {
      youtubeId: 'dQw4w9WgXcQ',
      title: 'Rick Astley - Never Gonna Give You Up (Official Video)',
      description: 'The official video for "Never Gonna Give You Up" by Rick Astley. Never Gonna Give You Up was a global smash on its release in July 1987, topping the charts...',
      channelId: 'UCuAXFkgsw1L7xaCfnd5JJOw',
      channelName: 'Rick Astley',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      duration: 213, // 3:33
      publishedAt: '2009-10-25T00:00:00Z',
      viewCount: 1000000000,
      likeCount: 10000000,
      tags: ['Rick Astley', 'Never Gonna Give You Up', '80s', 'pop']
    },
    'jNQXAC9IVRw': {
      youtubeId: 'jNQXAC9IVRw',
      title: 'Me at the zoo',
      description: 'The first video on YouTube. Recorded at the San Diego Zoo.',
      channelId: 'UC4QobU6STFB0P71PMvOGN5A',
      channelName: 'jawed',
      thumbnailUrl: 'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg',
      duration: 19,
      publishedAt: '2005-04-23T00:00:00Z',
      viewCount: 250000000,
      likeCount: 5000000,
      tags: ['first video', 'zoo', 'elephants']
    },
    'U7Xi5WCAjxU': {
      youtubeId: 'U7Xi5WCAjxU',
      title: 'Learn TypeScript in 50 Minutes - Tutorial for Beginners',
      description: 'TypeScript tutorial for beginners. Learn TypeScript in this crash course tutorial. We will cover all the fundamentals you need to know about TypeScript.',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      channelName: 'freeCodeCamp.org',
      thumbnailUrl: 'https://i.ytimg.com/vi/U7Xi5WCAjxU/hqdefault.jpg',
      duration: 3000, // 50 minutes
      publishedAt: '2021-09-15T00:00:00Z',
      viewCount: 850000,
      likeCount: 25000,
      tags: ['typescript', 'tutorial', 'programming', 'javascript']
    }
  };

  // Return specific mock data if available, otherwise generate generic mock data
  if (mockVideos[youtubeId]) {
    return mockVideos[youtubeId];
  }

  // Generate generic mock data for unknown video IDs
  return {
    youtubeId,
    title: `Sample Video - ${youtubeId}`,
    description: `This is a mock video for development purposes. YouTube ID: ${youtubeId}. This video demonstrates the video metadata retrieval functionality without requiring actual YouTube API calls.`,
    channelId: 'UC_MOCK_CHANNEL_ID',
    channelName: 'Mock Channel',
    thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    duration: 300, // 5 minutes
    publishedAt: new Date().toISOString(),
    viewCount: Math.floor(Math.random() * 1000000),
    likeCount: Math.floor(Math.random() * 50000),
    tags: ['mock', 'development', 'sample']
  };
}

export async function getVideoMetadata(youtubeId: string): Promise<VideoMetadata> {
  console.log(`[YouTube API] Getting metadata for video ID: ${youtubeId}`);

  const apiKey = process.env.YOUTUBE_API_KEY;
  const useMock = process.env.YOUTUBE_USE_MOCK === 'true' || !apiKey;

  console.log(`[YouTube API] API Key configured: ${!!apiKey}`);
  console.log(`[YouTube API] Using mock mode: ${useMock}`);

  // Use mock data if API key is not configured or mock mode is enabled
  if (useMock) {
    console.log(`[YouTube API] Fetching mock metadata for: ${youtubeId}`);
    const mockData = getMockVideoMetadata(youtubeId);
    console.log(`[YouTube API] Mock data returned:`, mockData);
    return mockData;
  }

  if (!apiKey) {
    throw new Error('YouTube API key is not configured');
  }

  try {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos`;
    const params = new URLSearchParams({
      key: apiKey,
      id: youtubeId,
      part: 'snippet,contentDetails,statistics'
    });

    console.log(`[YouTube API] Calling API: ${apiUrl}?${params}`);
    const response = await fetch(`${apiUrl}?${params}`);

    if (!response.ok) {
      console.error(`[YouTube API] HTTP Error: ${response.status} ${response.statusText}`);
      if (response.status === 403) {
        throw new Error('YouTube API quota exceeded or access forbidden');
      }
      if (response.status === 404) {
        throw new Error('Video not found or is private');
      }
      throw new Error(`YouTube API service unavailable: ${response.status}`);
    }

    const data: YouTubeVideoResponse = await response.json();
    console.log(`[YouTube API] Response received:`, data);

    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = data.items[0];
    const duration = parseDuration(video.contentDetails.duration);

    const metadata: VideoMetadata = {
      youtubeId: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      channelId: video.snippet.channelId,
      channelName: video.snippet.channelTitle,
      thumbnailUrl: video.snippet.thumbnails.high?.url ||
                   video.snippet.thumbnails.medium?.url ||
                   video.snippet.thumbnails.default.url,
      duration,
      publishedAt: video.snippet.publishedAt,
      viewCount: parseInt(video.statistics.viewCount, 10),
      likeCount: video.statistics.likeCount ? parseInt(video.statistics.likeCount, 10) : null,
      tags: video.snippet.tags || []
    };

    console.log(`[YouTube API] Metadata processed:`, metadata);
    return metadata;
  } catch (error: any) {
    console.error('[YouTube API] Error:', error);
    throw error;
  }
}