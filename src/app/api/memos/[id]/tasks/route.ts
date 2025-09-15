import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { shouldUseMockData } from '@/lib/database';
import { z } from 'zod';

const createTaskFromMemoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional().transform((val) => val ? new Date(val) : undefined)
});

// Mock tasks for development
const mockTasks: any[] = [];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const memoId = params.id;
    const body = await request.json();
    const validatedData = createTaskFromMemoSchema.parse(body);

    if (shouldUseMockData()) {
      // Verify memo exists in mock data
      const mockMemos = [
        {
          id: 'memo1',
          userId: 'user1',
          videoId: 'video1',
          content: 'Key insight about React hooks performance',
          video: {
            id: 'video1',
            title: 'React Hooks Best Practices',
            youtubeId: 'dQw4w9WgXcQ'
          }
        },
        {
          id: 'memo2',
          userId: 'user1',
          videoId: 'video2',
          content: 'Need to implement this pattern in our codebase',
          video: {
            id: 'video2',
            title: 'Advanced React Performance Patterns',
            youtubeId: 'dQw4w9WgXcQ'
          }
        }
      ];

      const memo = mockMemos.find(m => m.id === memoId && m.userId === session.user.id);

      if (!memo) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MEMO_NOT_FOUND',
              message: 'Memo not found or access denied'
            }
          },
          { status: 404 }
        );
      }

      const newTask = {
        id: `task_${Date.now()}`,
        userId: session.user.id,
        memoId: memoId,
        title: validatedData.title,
        description: validatedData.description || `Task created from memo: "${memo.content.substring(0, 100)}${memo.content.length > 100 ? '...' : ''}"`,
        status: validatedData.status || 'PENDING' as const,
        priority: validatedData.priority || 'MEDIUM' as const,
        dueDate: validatedData.dueDate || null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        memo: memo
      };

      mockTasks.push(newTask);

      return NextResponse.json({
        success: true,
        data: { task: newTask }
      }, { status: 201 });
    }

    // Verify memo exists and belongs to the user
    const memo = await prisma.memo.findFirst({
      where: {
        id: memoId,
        userId: session.user.id
      },
      include: {
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

    if (!memo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MEMO_NOT_FOUND',
            message: 'Memo not found or access denied'
          }
        },
        { status: 404 }
      );
    }

    // Create task with automatic description if not provided
    const description = validatedData.description ||
      `Task created from memo: "${memo.content.substring(0, 100)}${memo.content.length > 100 ? '...' : ''}"`;

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        memoId: memoId,
        title: validatedData.title,
        description: description,
        status: validatedData.status || 'PENDING',
        priority: validatedData.priority || 'MEDIUM',
        dueDate: validatedData.dueDate
      },
      include: {
        memo: {
          include: {
            video: {
              select: {
                id: true,
                title: true,
                youtubeId: true,
                thumbnailUrl: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { task }
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Create Task from Memo API] Error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid task data',
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
          code: 'TASK_CREATE_FAILED',
          message: 'Failed to create task from memo'
        }
      },
      { status: 500 }
    );
  }
}