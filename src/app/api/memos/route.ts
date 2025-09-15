import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { shouldUseMockData } from '@/lib/database';
import { z } from 'zod';

const memoSchema = z.object({
  videoId: z.string(),
  content: z.string().min(1),
  timestampSec: z.number().optional(),
  memoType: z.enum(['INSIGHT', 'ACTION', 'QUESTION', 'SUMMARY']).optional(),
  importance: z.number().min(1).max(5).optional()
});

const mockMemos = [
  {
    id: 'memo1',
    userId: 'user1',
    videoId: 'video1',
    content: 'Key insight about React hooks performance',
    timestampSec: 180,
    memoType: 'INSIGHT' as const,
    importance: 4,
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
    tasks: [],
    tags: []
  },
  {
    id: 'memo2',
    userId: 'user1',
    videoId: 'video2',
    content: 'Need to implement this pattern in our codebase',
    timestampSec: 300,
    memoType: 'ACTION' as const,
    importance: 5,
    createdAt: new Date('2024-01-16T14:20:00'),
    updatedAt: new Date('2024-01-16T14:20:00'),
    tasks: [],
    tags: []
  },
  {
    id: 'memo3',
    userId: 'user1',
    videoId: 'video1',
    content: 'How does this relate to server components?',
    timestampSec: 450,
    memoType: 'QUESTION' as const,
    importance: 3,
    createdAt: new Date('2024-01-17T09:15:00'),
    updatedAt: new Date('2024-01-17T09:15:00'),
    tasks: [],
    tags: []
  }
];

export async function GET(request: NextRequest) {
  try {
    console.log('[Memos API] GET request received');
    const session = await getServerSession(authOptions);
    console.log('[Memos API] Session retrieved:', JSON.stringify({
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    }, null, 2));

    if (!session?.user?.id) {
      console.log('[Memos API] Authentication failed - no session or user ID');
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const memoType = searchParams.get('memoType');
    const importance = searchParams.get('importance');
    const search = searchParams.get('search');

    if (shouldUseMockData()) {
      let filteredMemos = mockMemos.filter(memo => memo.userId === session.user.id);

      if (videoId) {
        filteredMemos = filteredMemos.filter(memo => memo.videoId === videoId);
      }

      if (memoType) {
        filteredMemos = filteredMemos.filter(memo => memo.memoType === memoType);
      }

      if (importance) {
        filteredMemos = filteredMemos.filter(memo => memo.importance === parseInt(importance));
      }

      if (search) {
        filteredMemos = filteredMemos.filter(memo =>
          memo.content.toLowerCase().includes(search.toLowerCase())
        );
      }

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMemos = filteredMemos.slice(startIndex, endIndex);

      return NextResponse.json({
        success: true,
        data: {
          memos: paginatedMemos,
          pagination: {
            total: filteredMemos.length,
            page,
            limit,
            totalPages: Math.ceil(filteredMemos.length / limit)
          }
        }
      });
    }

    const whereClause: any = {
      userId: session.user.id
    };

    if (videoId) {
      whereClause.videoId = videoId;
    }

    if (memoType) {
      whereClause.memoType = memoType;
    }

    if (importance) {
      whereClause.importance = parseInt(importance);
    }

    if (search) {
      whereClause.content = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const [memos, total] = await Promise.all([
      prisma.memo.findMany({
        where: whereClause,
        include: {
          tasks: true,
          tags: true,
          video: {
            select: {
              id: true,
              title: true,
              youtubeId: true,
              thumbnailUrl: true
            }
          }
        },
        orderBy: [
          { importance: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.memo.count({ where: whereClause })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        memos,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    console.error('[Memos API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MEMOS_FETCH_FAILED',
          message: 'Failed to fetch memos'
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = memoSchema.parse(body);

    if (shouldUseMockData()) {
      const newMemo = {
        id: `memo_${Date.now()}`,
        userId: session.user.id,
        ...validatedData,
        memoType: validatedData.memoType || 'INSIGHT' as const,
        importance: validatedData.importance || 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: [],
        tags: []
      };

      mockMemos.unshift(newMemo);

      return NextResponse.json({
        success: true,
        data: { memo: newMemo }
      }, { status: 201 });
    }

    const video = await prisma.video.findFirst({
      where: {
        id: validatedData.videoId,
        userId: session.user.id
      }
    });

    if (!video) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VIDEO_NOT_FOUND',
            message: 'Video not found or access denied'
          }
        },
        { status: 404 }
      );
    }

    const memo = await prisma.memo.create({
      data: {
        userId: session.user.id,
        videoId: validatedData.videoId,
        content: validatedData.content,
        timestampSec: validatedData.timestampSec,
        memoType: validatedData.memoType || 'INSIGHT',
        importance: validatedData.importance || 3
      },
      include: {
        tasks: true,
        tags: true,
        video: {
          select: {
            id: true,
            title: true,
            youtubeId: true,
            thumbnailUrl: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { memo }
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Memos API] Error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid memo data',
            details: error.errors
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MEMO_CREATE_FAILED',
          message: 'Failed to create memo'
        }
      },
      { status: 500 }
    );
  }
}