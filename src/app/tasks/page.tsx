'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AppHeader } from '@/components/ui/AppHeader';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  memo?: {
    id: string;
    content: string;
    video: {
      id: string;
      title: string;
      youtubeId: string;
      thumbnailUrl?: string;
    };
  };
}

interface TaskResponse {
  success: boolean;
  data: {
    tasks: Task[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200'
};

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700'
};

const STATUS_LABELS = {
  PENDING: '未着手',
  IN_PROGRESS: '進行中',
  COMPLETED: '完了',
  CANCELLED: 'キャンセル'
};

const PRIORITY_LABELS = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '緊急'
};

export default function TasksPage() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });

  const fetchTasks = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/tasks?${params}`);
      const data: TaskResponse = await response.json();

      if (data.success) {
        setTasks(data.data.tasks);
        setPagination(data.data.pagination);
      } else {
        setError('Failed to fetch tasks');
      }
    } catch (err) {
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (status === 'authenticated') {
      fetchTasks();
    }
  }, [status, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchTasks(newPage);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">認証が必要です</h1>
          <p className="text-gray-600">タスクを表示するにはサインインしてください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">マイタスク</h1>
          <p className="mt-2 text-gray-600">学習目標とアクションアイテムを管理しましょう</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                検索
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="タスクを検索..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">すべてのステータス</option>
                <option value="PENDING">未着手</option>
                <option value="IN_PROGRESS">進行中</option>
                <option value="COMPLETED">完了</option>
                <option value="CANCELLED">キャンセル</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                優先度
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">すべての優先度</option>
                <option value="URGENT">緊急</option>
                <option value="HIGH">高</option>
                <option value="MEDIUM">中</option>
                <option value="LOW">低</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">タスクを読み込み中...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600">{error}</div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-600">タスクが見つかりません。メモからタスクを作成するか、新しいものを追加してください！</div>
          </div>
        ) : (
          <>
            {/* Tasks List */}
            <div className="space-y-4 mb-8">
              {tasks.map((task) => (
                <div key={task.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${STATUS_COLORS[task.status]}`}>
                            {STATUS_LABELS[task.status]}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                            {PRIORITY_LABELS[task.priority]}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-gray-600 mb-3">{task.description}</p>
                        )}

                        {/* Related Memo */}
                        {task.memo && (
                          <div className="mb-3 p-3 bg-gray-50 rounded-md">
                            <div className="flex items-start space-x-3">
                              {task.memo.video.thumbnailUrl && (
                                <img
                                  src={task.memo.video.thumbnailUrl}
                                  alt={task.memo.video.title}
                                  className="w-12 h-9 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/watch/${task.memo.video.youtubeId}`}
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800 line-clamp-1"
                                >
                                  {task.memo.video.title}
                                </Link>
                                <Link
                                  href={`/memos/${task.memo.id}`}
                                  className="text-xs text-gray-500 hover:text-gray-700 line-clamp-2"
                                >
                                  {task.memo.content}
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Dates */}
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span>作成日: {formatDate(task.createdAt)}</span>
                          {task.dueDate && (
                            <span className={isOverdue(task.dueDate) && task.status !== 'COMPLETED' ? 'text-red-600 font-medium' : ''}>
                              期限: {formatDate(task.dueDate)}
                              {isOverdue(task.dueDate) && task.status !== 'COMPLETED' && ' (期限切れ)'}
                            </span>
                          )}
                          {task.completedAt && (
                            <span className="text-green-600">
                              完了日: {formatDate(task.completedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/tasks/${task.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        詳細を表示 →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        pagination.page === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}