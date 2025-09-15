import { NextRequest, NextResponse } from 'next/server';
import { Video } from '@/types';
import { prisma, shouldUseMockData } from '@/lib/database';

// Mock database - Used when DATABASE_URL is not configured
let mockVideos: Video[] = [
  {
    id: 'video1',
    user_id: 'user1',
    youtube_id: 'dQw4w9WgXcQ',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Introduction to React Hooks',
    description: 'Learn the basics of React Hooks and how to use them effectively in your applications.',
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    duration: 1200,
    channel_name: 'React Tutorials',
    published_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'video2',
    user_id: 'user1',
    youtube_id: 'jNQXAC9IVRw',
    youtube_url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    title: 'Advanced TypeScript Patterns',
    description: 'Explore advanced TypeScript patterns for building scalable applications.',
    thumbnail_url: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
    duration: 1800,
    channel_name: 'TypeScript Pro',
    published_at: '2024-01-05T00:00:00Z',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z'
  }
];

function extractVideoId(url: string): string | null {
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

function generateId(): string {
  return 'video_' + Math.random().toString(36).substr(2, 9);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search');

    // Use mock data if database is not configured
    if (shouldUseMockData()) {
      console.log('[Videos API] Using mock data (no database configured)');

      let filteredVideos = [...mockVideos];

      // Apply search filter
      if (search && search.trim()) {
        const searchTerm = search.toLowerCase();
        filteredVideos = filteredVideos.filter(video =>
          video.title.toLowerCase().includes(searchTerm) ||
          video.description?.toLowerCase().includes(searchTerm) ||
          video.channel_name?.toLowerCase().includes(searchTerm)
        );
      }

      // Apply pagination
      const total = filteredVideos.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedVideos = filteredVideos.slice(startIndex, endIndex);

      return NextResponse.json({
        success: true,
        data: {
          items: paginatedVideos,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        },
        meta: {
          timestamp: new Date().toISOString(),
          dataSource: 'mock'
        }
      });
    }

    // Use real database
    console.log('[Videos API] Using database');

    // TODO: Get userId from authentication
    const userId = 'user1'; // Mock user for now

    const where = {
      userId,
      ...(search && search.trim() ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { channelName: { contains: search, mode: 'insensitive' as const } },
        ]
      } : {})
    };

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.video.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    // Convert Prisma objects to API format
    const formattedVideos: Video[] = videos.map(video => ({
      id: video.id,
      user_id: video.userId,
      youtube_id: video.youtubeId,
      youtube_url: video.youtubeUrl,
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnailUrl,
      duration: video.duration,
      channel_name: video.channelName,
      published_at: video.publishedAt?.toISOString(),
      created_at: video.createdAt.toISOString(),
      updated_at: video.updatedAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: formattedVideos,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        dataSource: 'database'
      }
    });
  } catch (error: any) {
    console.error('[Videos API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch videos'
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { youtubeUrl } = body;

    if (!youtubeUrl || youtubeUrl.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'YouTube URL is required'
          }
        },
        { status: 400 }
      );
    }

    // Extract YouTube ID from URL
    const youtubeId = extractVideoId(youtubeUrl);

    if (!youtubeId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid YouTube URL'
          }
        },
        { status: 400 }
      );
    }

    // Get video metadata
    const previewResponse = await fetch(
      `${request.nextUrl.origin}/api/preview-video?url=${encodeURIComponent(youtubeUrl)}`
    );

    if (!previewResponse.ok) {
      throw new Error('Failed to fetch video metadata');
    }

    const previewData = await previewResponse.json();

    if (!previewData.success) {
      throw new Error(previewData.error?.message || 'Failed to fetch video metadata');
    }

    const metadata = previewData.data.videoMetadata;

    // Use mock data if database is not configured
    if (shouldUseMockData()) {
      console.log('[Videos API] Using mock data for video creation');

      // Check if video already exists in mock data
      const existingVideo = mockVideos.find(v => v.youtube_id === youtubeId);
      if (existingVideo) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_ERROR',
              message: 'Video already exists in your collection'
            }
          },
          { status: 409 }
        );
      }

      // Create new video for mock database
      const newVideo: Video = {
        id: generateId(),
        user_id: 'user1',
        youtube_id: metadata.youtubeId,
        youtube_url: youtubeUrl.trim(),
        title: metadata.title,
        description: metadata.description,
        thumbnail_url: metadata.thumbnailUrl,
        duration: metadata.duration,
        channel_name: metadata.channelName,
        published_at: metadata.publishedAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockVideos.unshift(newVideo);

      return NextResponse.json({
        success: true,
        data: {
          video: newVideo
        },
        meta: {
          timestamp: new Date().toISOString(),
          dataSource: 'mock'
        }
      }, { status: 201 });
    }

    // Use real database
    console.log('[Videos API] Using database for video creation');

    // TODO: Get userId from authentication
    const userId = 'user1';

    // Check if video already exists in database
    const existingVideo = await prisma.video.findFirst({
      where: {
        userId,
        youtubeId
      }
    });

    if (existingVideo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_ERROR',
            message: 'Video already exists in your collection'
          }
        },
        { status: 409 }
      );
    }

    // Create new video in database
    const newVideo = await prisma.video.create({
      data: {
        userId,
        youtubeId: metadata.youtubeId,
        youtubeUrl: youtubeUrl.trim(),
        title: metadata.title,
        description: metadata.description,
        thumbnailUrl: metadata.thumbnailUrl,
        duration: metadata.duration,
        channelName: metadata.channelName,
        publishedAt: metadata.publishedAt ? new Date(metadata.publishedAt) : null,
      }
    });

    // Convert to API format
    const formattedVideo: Video = {
      id: newVideo.id,
      user_id: newVideo.userId,
      youtube_id: newVideo.youtubeId,
      youtube_url: newVideo.youtubeUrl,
      title: newVideo.title,
      description: newVideo.description,
      thumbnail_url: newVideo.thumbnailUrl,
      duration: newVideo.duration,
      channel_name: newVideo.channelName,
      published_at: newVideo.publishedAt?.toISOString(),
      created_at: newVideo.createdAt.toISOString(),
      updated_at: newVideo.updatedAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        video: formattedVideo
      },
      meta: {
        timestamp: new Date().toISOString(),
        dataSource: 'database'
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Videos API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to save video'
        }
      },
      { status: 500 }
    );
  }
}