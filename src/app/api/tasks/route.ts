import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { shouldUseMockData } from '@/lib/database';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  memoId: z.string().optional(),
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

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const memoId = searchParams.get('memoId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    if (shouldUseMockData()) {
      let filteredTasks = mockTasks.filter(task => task.userId === userId);

      if (status) {
        filteredTasks = filteredTasks.filter(task => task.status === status);
      }

      if (priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === priority);
      }

      if (memoId) {
        filteredTasks = filteredTasks.filter(task => task.memoId === memoId);
      }

      if (search) {
        filteredTasks = filteredTasks.filter(task =>
          task.title.toLowerCase().includes(search.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(search.toLowerCase()))
        );
      }

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

      return NextResponse.json({
        success: true,
        data: {
          tasks: paginatedTasks,
          pagination: {
            total: filteredTasks.length,
            page,
            limit,
            totalPages: Math.ceil(filteredTasks.length / limit)
          }
        }
      });
    }

    const whereClause: any = {
      userId: userId
    };

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (memoId) {
      whereClause.memoId = memoId;
    }

    if (search) {
      whereClause.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
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
        },
        orderBy: [
          { status: 'asc' },
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.task.count({ where: whereClause })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    console.error('[Tasks API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TASKS_FETCH_FAILED',
          message: 'Failed to fetch tasks'
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = taskSchema.parse(body);

    if (shouldUseMockData()) {
      const newTask = {
        id: `task_${Date.now()}`,
        userId: userId,
        title: validatedData.title,
        description: validatedData.description || null,
        memoId: validatedData.memoId || null,
        status: validatedData.status || 'PENDING' as const,
        priority: validatedData.priority || 'MEDIUM' as const,
        dueDate: validatedData.dueDate || null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        memo: validatedData.memoId ? mockTasks.find(t => t.memo?.id === validatedData.memoId)?.memo || null : null
      };

      mockTasks.unshift(newTask);

      return NextResponse.json({
        success: true,
        data: { task: newTask }
      }, { status: 201 });
    }

    // Verify memo exists if memoId is provided
    if (validatedData.memoId) {
      const memo = await prisma.memo.findFirst({
        where: {
          id: validatedData.memoId,
          userId: userId
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
    }

    const task = await prisma.task.create({
      data: {
        userId: userId,
        title: validatedData.title,
        description: validatedData.description,
        memoId: validatedData.memoId,
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
    console.error('[Tasks API] Error:', error);

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
          message: 'Failed to create task'
        }
      },
      { status: 500 }
    );
  }
}