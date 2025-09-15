import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { shouldUseMockData } from '@/lib/database';
import { z } from 'zod';

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional().transform((val) => val ? new Date(val) : undefined)
});

const mockTasks = [
  {
    id: 'task1',
    userId: 'user1',
    memoId: 'memo2',
    title: 'Implement React hooks optimization pattern',
    description: 'Apply the useMemo and useCallback patterns from the video to our component library',
    status: 'PENDING' as const,
    priority: 'HIGH' as const,
    dueDate: new Date('2024-02-01'),
    completedAt: null,
    createdAt: new Date('2024-01-16T14:30:00'),
    updatedAt: new Date('2024-01-16T14:30:00'),
    memo: {
      id: 'memo2',
      content: 'Need to implement this pattern in our codebase',
      video: {
        id: 'video2',
        title: 'Advanced React Performance Patterns',
        youtubeId: 'dQw4w9WgXcQ'
      }
    }
  },
  {
    id: 'task2',
    userId: 'user1',
    memoId: null,
    title: 'Research server components architecture',
    description: 'Study the Next.js 13+ app router and server components approach',
    status: 'IN_PROGRESS' as const,
    priority: 'MEDIUM' as const,
    dueDate: new Date('2024-02-15'),
    completedAt: null,
    createdAt: new Date('2024-01-17T10:00:00'),
    updatedAt: new Date('2024-01-18T16:20:00'),
    memo: null
  },
  {
    id: 'task3',
    userId: 'user1',
    memoId: 'memo1',
    title: 'Optimize component re-renders',
    description: 'Apply performance insights from the React hooks video',
    status: 'COMPLETED' as const,
    priority: 'HIGH' as const,
    dueDate: new Date('2024-01-20'),
    completedAt: new Date('2024-01-19T09:30:00'),
    createdAt: new Date('2024-01-15T11:00:00'),
    updatedAt: new Date('2024-01-19T09:30:00'),
    memo: {
      id: 'memo1',
      content: 'Key insight about React hooks performance',
      video: {
        id: 'video1',
        title: 'React Hooks Best Practices',
        youtubeId: 'dQw4w9WgXcQ'
      }
    }
  }
];

export async function GET(
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

    const { id } = params;

    if (shouldUseMockData()) {
      const task = mockTasks.find(t => t.id === id && t.userId === session.user.id);

      if (!task) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TASK_NOT_FOUND',
              message: 'Task not found'
            }
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { task }
      });
    }

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        memo: {
          include: {
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
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TASK_NOT_FOUND',
            message: 'Task not found'
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { task }
    });

  } catch (error: any) {
    console.error('[Task API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TASK_FETCH_FAILED',
          message: 'Failed to fetch task'
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
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    if (shouldUseMockData()) {
      const taskIndex = mockTasks.findIndex(t => t.id === id && t.userId === session.user.id);

      if (taskIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TASK_NOT_FOUND',
              message: 'Task not found'
            }
          },
          { status: 404 }
        );
      }

      const updateData: any = {
        ...validatedData,
        updatedAt: new Date()
      };

      // Set completedAt when status changes to COMPLETED
      if (validatedData.status === 'COMPLETED' && mockTasks[taskIndex].status !== 'COMPLETED') {
        updateData.completedAt = new Date();
      } else if (validatedData.status && validatedData.status !== 'COMPLETED') {
        updateData.completedAt = null;
      }

      mockTasks[taskIndex] = {
        ...mockTasks[taskIndex],
        ...updateData
      };

      return NextResponse.json({
        success: true,
        data: { task: mockTasks[taskIndex] }
      });
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TASK_NOT_FOUND',
            message: 'Task not found'
          }
        },
        { status: 404 }
      );
    }

    const updateData: any = { ...validatedData };

    // Set completedAt when status changes to COMPLETED
    if (validatedData.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    } else if (validatedData.status && validatedData.status !== 'COMPLETED') {
      updateData.completedAt = null;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        memo: {
          include: {
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
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { task }
    });

  } catch (error: any) {
    console.error('[Task API] Error:', error);

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
          code: 'TASK_UPDATE_FAILED',
          message: 'Failed to update task'
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
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = params;

    if (shouldUseMockData()) {
      const taskIndex = mockTasks.findIndex(t => t.id === id && t.userId === session.user.id);

      if (taskIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TASK_NOT_FOUND',
              message: 'Task not found'
            }
          },
          { status: 404 }
        );
      }

      mockTasks.splice(taskIndex, 1);

      return NextResponse.json({
        success: true,
        data: { message: 'Task deleted successfully' }
      });
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TASK_NOT_FOUND',
            message: 'Task not found'
          }
        },
        { status: 404 }
      );
    }

    await prisma.task.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Task deleted successfully' }
    });

  } catch (error: any) {
    console.error('[Task API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TASK_DELETE_FAILED',
          message: 'Failed to delete task'
        }
      },
      { status: 500 }
    );
  }
}