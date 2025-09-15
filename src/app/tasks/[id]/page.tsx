'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/utils';
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
  updatedAt: string;
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
    task: Task;
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

export default function TaskDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'PENDING' as Task['status'],
    priority: 'MEDIUM' as Task['priority'],
    dueDate: ''
  });

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks/${params.id}`);
      const data: TaskResponse = await response.json();

      if (data.success) {
        setTask(data.data.task);
        setEditForm({
          title: data.data.task.title,
          description: data.data.task.description || '',
          status: data.data.task.status,
          priority: data.data.task.priority,
          dueDate: data.data.task.dueDate ? new Date(data.data.task.dueDate).toISOString().split('T')[0] : ''
        });
      } else {
        setError('Failed to fetch task');
      }
    } catch (err) {
      setError('Failed to fetch task');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (data.success) {
        setTask(data.data.task);
        setEditing(false);
      } else {
        setError('Failed to update task');
      }
    } catch (err) {
      setError('Failed to update task');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('このタスクを削除しますか？この操作は元に戻せません。')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        router.push('/tasks');
      } else {
        setError('Failed to delete task');
      }
    } catch (err) {
      setError('Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const updateTaskStatus = async (newStatus: Task['status']) => {
    try {
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        setTask(data.data.task);
      } else {
        setError('Failed to update task status');
      }
    } catch (err) {
      setError('Failed to update task status');
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && params.id) {
      fetchTask();
    }
  }, [status, params.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <p className="text-gray-600">このタスクを表示するにはサインインしてください。</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">タスクを読み込み中...</div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">エラー</h1>
          <p className="text-red-600 mb-4">{error || 'タスクが見つかりません'}</p>
          <Link href="/tasks" className="text-blue-600 hover:text-blue-800">
            ← タスク一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/tasks" className="text-blue-600 hover:text-blue-800 text-sm">
            ← タスク一覧に戻る
          </Link>
        </div>

        {/* Task Detail */}
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${STATUS_COLORS[task.status]}`}>
                  {STATUS_LABELS[task.status]}
                </span>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                  {PRIORITY_LABELS[task.priority]}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {/* Status Actions */}
                {task.status === 'PENDING' && (
                  <button
                    onClick={() => updateTaskStatus('IN_PROGRESS')}
                    className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                  >
                    開始
                  </button>
                )}
                {task.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => updateTaskStatus('COMPLETED')}
                    className="px-3 py-1 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100"
                  >
                    完了
                  </button>
                )}
                {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                  <button
                    onClick={() => updateTaskStatus('CANCELLED')}
                    className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100"
                  >
                    キャンセル
                  </button>
                )}
                <button
                  onClick={() => setEditing(!editing)}
                  className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                >
                  {editing ? 'キャンセル' : '編集'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50"
                >
                  {deleting ? '削除中...' : '削除'}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {editing ? (
              /* Edit Form */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    タイトル
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ステータス
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as Task['status'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PENDING">未着手</option>
                      <option value="IN_PROGRESS">進行中</option>
                      <option value="COMPLETED">完了</option>
                      <option value="CANCELLED">キャンセル</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      優先度
                    </label>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="LOW">低</option>
                      <option value="MEDIUM">中</option>
                      <option value="HIGH">高</option>
                      <option value="URGENT">緊急</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      期限
                    </label>
                    <input
                      type="date"
                      value={editForm.dueDate}
                      onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updating ? '更新中...' : '更新'}
                  </button>
                </div>
              </div>
            ) : (
              /* Task Display */
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h1>
                  {task.description && (
                    <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
                  )}
                </div>

                {/* Related Memo */}
                {task.memo && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">関連メモ</h3>
                    <div className="flex items-start space-x-3">
                      {task.memo.video.thumbnailUrl && (
                        <img
                          src={task.memo.video.thumbnailUrl}
                          alt={task.memo.video.title}
                          className="w-16 h-12 object-cover rounded"
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
                          className="text-sm text-gray-600 hover:text-gray-800 line-clamp-2"
                        >
                          {task.memo.content}
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">作成日: </span>
                    {formatDate(task.createdAt)}
                  </div>
                  {task.dueDate && (
                    <div className={isOverdue(task.dueDate) && task.status !== 'COMPLETED' ? 'text-red-600 font-medium' : ''}>
                      <span className="font-medium">期限: </span>
                      {formatDate(task.dueDate)}
                      {isOverdue(task.dueDate) && task.status !== 'COMPLETED' && ' (期限切れ)'}
                    </div>
                  )}
                  {task.completedAt && (
                    <div className="text-green-600">
                      <span className="font-medium">完了日: </span>
                      {formatDate(task.completedAt)}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">最終更新: </span>
                    {formatDate(task.updatedAt)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}