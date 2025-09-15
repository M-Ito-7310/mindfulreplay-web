import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { shouldUseMockData } from '@/lib/database';
import { z } from 'zod';

const updateMemoSchema = z.object({
  content: z.string().min(1).optional(),
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
    tags: [],
    video: {
      id: 'video1',
      title: 'React Hooks Best Practices',
      youtubeId: 'dQw4w9WgXcQ',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: 600
    }
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
    tags: [],
    video: {
      id: 'video2',
      title: 'Advanced React Performance Patterns',
      youtubeId: 'jNQXAC9IVRw',
      thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
      duration: 720
    }
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
    tags: [],
    video: {
      id: 'video1',
      title: 'React Hooks Best Practices',
      youtubeId: 'dQw4w9WgXcQ',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: 600
    }
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    // For demo mode: Always allow access with default user
    let userId = session?.user?.id || 'user1';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = params;

    if (shouldUseMockData()) {
      const memo = mockMemos.find(m => m.id === id && m.userId === userId);

      if (!memo) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MEMO_NOT_FOUND',
              message: 'Memo not found'
            }
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { memo }
      });
    }

    const memo = await prisma.memo.findFirst({
      where: {
        id,
        userId: userId
      },
      include: {
        tasks: true,
        tags: true,
        video: {
          select: {
            id: true,
            title: true,
            youtubeId: true,
            thumbnailUrl: true,
            duration: true
          }
        }
      }
    });

    if (!memo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MEMO_NOT_FOUND',
            message: 'Memo not found'
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { memo }
    });

  } catch (error: any) {
    console.error('[Memo API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MEMO_FETCH_FAILED',
          message: 'Failed to fetch memo'
        }
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    // For demo mode: Always allow access with default user
    let userId = session?.user?.id || 'user1';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = updateMemoSchema.parse(body);

    if (shouldUseMockData()) {
      const memoIndex = mockMemos.findIndex(m => m.id === id && m.userId === userId);

      if (memoIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MEMO_NOT_FOUND',
              message: 'Memo not found'
            }
          },
          { status: 404 }
        );
      }

      mockMemos[memoIndex] = {
        ...mockMemos[memoIndex],
        ...validatedData,
        updatedAt: new Date()
      };

      return NextResponse.json({
        success: true,
        data: { memo: mockMemos[memoIndex] }
      });
    }

    const existingMemo = await prisma.memo.findFirst({
      where: {
        id,
        userId: userId
      }
    });

    if (!existingMemo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MEMO_NOT_FOUND',
            message: 'Memo not found'
          }
        },
        { status: 404 }
      );
    }

    const memo = await prisma.memo.update({
      where: { id },
      data: validatedData,
      include: {
        tasks: true,
        tags: true,
        video: {
          select: {
            id: true,
            title: true,
            youtubeId: true,
            thumbnailUrl: true,
            duration: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { memo }
    });

  } catch (error: any) {
    console.error('[Memo API] Error:', error);

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
          code: 'MEMO_UPDATE_FAILED',
          message: 'Failed to update memo'
        }
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    // For demo mode: Always allow access with default user
    let userId = session?.user?.id || 'user1';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = params;

    if (shouldUseMockData()) {
      const memoIndex = mockMemos.findIndex(m => m.id === id && m.userId === userId);

      if (memoIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MEMO_NOT_FOUND',
              message: 'Memo not found'
            }
          },
          { status: 404 }
        );
      }

      mockMemos.splice(memoIndex, 1);

      return NextResponse.json({
        success: true,
        data: { message: 'Memo deleted successfully' }
      });
    }

    const existingMemo = await prisma.memo.findFirst({
      where: {
        id,
        userId: userId
      }
    });

    if (!existingMemo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MEMO_NOT_FOUND',
            message: 'Memo not found'
          }
        },
        { status: 404 }
      );
    }

    await prisma.memo.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Memo deleted successfully' }
    });

  } catch (error: any) {
    console.error('[Memo API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MEMO_DELETE_FAILED',
          message: 'Failed to delete memo'
        }
      },
      { status: 500 }
    );
  }
}