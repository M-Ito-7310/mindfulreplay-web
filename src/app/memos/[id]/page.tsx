'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/utils';
import { AppHeader } from '@/components/ui/AppHeader';

interface Memo {
  id: string;
  content: string;
  timestampSec?: number;
  memoType: 'INSIGHT' | 'ACTION' | 'QUESTION' | 'SUMMARY';
  importance: number;
  createdAt: string;
  updatedAt: string;
  video: {
    id: string;
    title: string;
    youtubeId: string;
    thumbnailUrl?: string;
    duration?: number;
  };
  tasks: any[];
  tags: any[];
}

interface MemoResponse {
  success: boolean;
  data: {
    memo: Memo;
  };
}

const MEMO_TYPE_COLORS = {
  INSIGHT: 'bg-blue-100 text-blue-800',
  ACTION: 'bg-green-100 text-green-800',
  QUESTION: 'bg-yellow-100 text-yellow-800',
  SUMMARY: 'bg-purple-100 text-purple-800'
};

const IMPORTANCE_COLORS = {
  1: 'bg-gray-100 text-gray-600',
  2: 'bg-gray-200 text-gray-700',
  3: 'bg-blue-100 text-blue-700',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-red-100 text-red-700'
};

export default function MemoDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [memo, setMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    content: '',
    memoType: 'INSIGHT' as const,
    importance: 3,
    timestampSec: undefined as number | undefined
  });
  const [deleting, setDeleting] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as const,
    dueDate: ''
  });

  const fetchMemo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/memos/${params.id}`);
      const data: MemoResponse = await response.json();

      if (data.success) {
        setMemo(data.data.memo);
        setEditForm({
          content: data.data.memo.content,
          memoType: data.data.memo.memoType,
          importance: data.data.memo.importance,
          timestampSec: data.data.memo.timestampSec
        });
      } else {
        setError('Memo not found');
      }
    } catch (err) {
      setError('Failed to fetch memo');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/memos/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (data.success) {
        setMemo(data.data.memo);
        setEditing(false);
      } else {
        setError('Failed to update memo');
      }
    } catch (err) {
      setError('Failed to update memo');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this memo? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/memos/${params.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        router.push('/memos');
      } else {
        setError('Failed to delete memo');
      }
    } catch (err) {
      setError('Failed to delete memo');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      const response = await fetch(`/api/memos/${params.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: taskForm.title,
          description: taskForm.description,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowTaskForm(false);
        setTaskForm({
          title: '',
          description: '',
          priority: 'MEDIUM',
          dueDate: ''
        });
        router.push(`/tasks/${data.data.task.id}`);
      } else {
        setError('Failed to create task');
      }
    } catch (err) {
      setError('Failed to create task');
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && params.id) {
      fetchMemo();
    }
  }, [status, params.id]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to view this memo.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading memo...</div>
      </div>
    );
  }

  if (error || !memo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-red-600 mb-4">{error || 'Memo not found'}</p>
          <Link href="/memos" className="text-blue-600 hover:text-blue-800">
            ← Back to Memos
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
          <Link href="/memos" className="text-blue-600 hover:text-blue-800 text-sm">
            ← メモ一覧に戻る
          </Link>
        </div>

        {/* Memo Detail */}
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${MEMO_TYPE_COLORS[memo.memoType]}`}>
                  {memo.memoType}
                </span>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${IMPORTANCE_COLORS[memo.importance as keyof typeof IMPORTANCE_COLORS]}`}>
                  Priority: {memo.importance}/5
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100"
                >
                  Create Task
                </button>
                <button
                  onClick={() => setEditing(!editing)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                >
                  {editing ? 'Cancel' : 'Edit'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>

          {/* Video Information */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-start space-x-4">
              {memo.video.thumbnailUrl && (
                <img
                  src={memo.video.thumbnailUrl}
                  alt={memo.video.title}
                  className="w-32 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <Link
                  href={`/watch/${memo.video.youtubeId}`}
                  className="text-lg font-semibold text-blue-600 hover:text-blue-800 block mb-2"
                >
                  {memo.video.title}
                </Link>
                {memo.timestampSec !== undefined && (
                  <Link
                    href={`/watch/${memo.video.youtubeId}?t=${memo.timestampSec}`}
                    className="inline-flex items-center text-blue-500 hover:text-blue-700 text-sm"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1" />
                    </svg>
                    Jump to {formatTimestamp(memo.timestampSec)}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Task Creation Form */}
          {showTaskForm && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Task from Memo</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter task title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter task description..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowTaskForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTask}
                    disabled={!taskForm.title.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Memo Content */}
          <div className="px-6 py-6">
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your memo content..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={editForm.memoType}
                      onChange={(e) => setEditForm(prev => ({ ...prev, memoType: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="INSIGHT">Insight</option>
                      <option value="ACTION">Action</option>
                      <option value="QUESTION">Question</option>
                      <option value="SUMMARY">Summary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Importance (1-5)
                    </label>
                    <select
                      value={editForm.importance}
                      onChange={(e) => setEditForm(prev => ({ ...prev, importance: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1 - Very Low</option>
                      <option value={2}>2 - Low</option>
                      <option value={3}>3 - Medium</option>
                      <option value={4}>4 - High</option>
                      <option value={5}>5 - Very High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timestamp (seconds)
                    </label>
                    <input
                      type="number"
                      value={editForm.timestampSec || ''}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        timestampSec: e.target.value ? parseInt(e.target.value) : undefined
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Memo Content</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-900 whitespace-pre-wrap">{memo.content}</p>
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Created:</span> {new Date(memo.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span> {new Date(memo.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Tasks and Tags */}
          {(memo.tasks.length > 0 || memo.tags.length > 0) && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {memo.tasks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Related Tasks</h3>
                    <div className="space-y-2">
                      {memo.tasks.map((task: any) => (
                        <div key={task.id} className="text-sm text-gray-600 bg-gray-50 rounded px-2 py-1">
                          {task.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {memo.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {memo.tags.map((tag: any) => (
                        <span
                          key={tag.id}
                          className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}