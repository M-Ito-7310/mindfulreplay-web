'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/utils';

interface Memo {
  id: string;
  content: string;
  timestampSec?: number;
  memoType: 'INSIGHT' | 'ACTION' | 'QUESTION' | 'SUMMARY';
  importance: number;
  createdAt: string;
  video: {
    id: string;
    title: string;
    youtubeId: string;
    thumbnailUrl?: string;
  };
  tasks: any[];
  tags: any[];
}

interface MemoResponse {
  success: boolean;
  data: {
    memos: Memo[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
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

export default function MemosPage() {
  const { data: session, status } = useSession();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    memoType: '',
    importance: '',
    search: ''
  });

  const fetchMemos = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      if (filters.memoType) params.append('memoType', filters.memoType);
      if (filters.importance) params.append('importance', filters.importance);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/memos?${params}`);
      const data: MemoResponse = await response.json();

      if (data.success) {
        setMemos(data.data.memos);
        setPagination(data.data.pagination);
      } else {
        setError('Failed to fetch memos');
      }
    } catch (err) {
      setError('Failed to fetch memos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[Memos Page] useEffect triggered - status:', status, 'session:', !!session);
    if (status === 'authenticated') {
      console.log('[Memos Page] Status is authenticated, calling fetchMemos');
      fetchMemos();
    } else {
      console.log('[Memos Page] Status not authenticated:', status);
    }
  }, [status, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchMemos(newPage);
  };

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
          <p className="text-gray-600">Please sign in to view your memos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Memos</h1>
          <p className="mt-2 text-gray-600">All your learning insights and notes</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search memo content..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={filters.memoType}
                onChange={(e) => handleFilterChange('memoType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="INSIGHT">Insight</option>
                <option value="ACTION">Action</option>
                <option value="QUESTION">Question</option>
                <option value="SUMMARY">Summary</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Importance
              </label>
              <select
                value={filters.importance}
                onChange={(e) => handleFilterChange('importance', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                <option value="5">Very High (5)</option>
                <option value="4">High (4)</option>
                <option value="3">Medium (3)</option>
                <option value="2">Low (2)</option>
                <option value="1">Very Low (1)</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading memos...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600">{error}</div>
          </div>
        ) : memos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-600">No memos found. Start watching videos and taking notes!</div>
          </div>
        ) : (
          <>
            {/* Memos Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {memos.map((memo) => (
                <div key={memo.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Video Info */}
                    <div className="flex items-start space-x-3 mb-4">
                      {memo.video.thumbnailUrl && (
                        <img
                          src={memo.video.thumbnailUrl}
                          alt={memo.video.title}
                          className="w-16 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/watch/${memo.video.youtubeId}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 line-clamp-2"
                        >
                          {memo.video.title}
                        </Link>
                        {memo.timestampSec !== undefined && (
                          <Link
                            href={`/watch/${memo.video.youtubeId}?t=${memo.timestampSec}`}
                            className="text-xs text-blue-500 hover:text-blue-700"
                          >
                            @ {formatTimestamp(memo.timestampSec)}
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Memo Content */}
                    <div className="mb-4">
                      <p className="text-gray-900 line-clamp-3">{memo.content}</p>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${MEMO_TYPE_COLORS[memo.memoType]}`}>
                          {memo.memoType}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${IMPORTANCE_COLORS[memo.importance as keyof typeof IMPORTANCE_COLORS]}`}>
                          {memo.importance}/5
                        </span>
                      </div>
                      <Link
                        href={`/memos/${memo.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Details →
                      </Link>
                    </div>

                    {/* Tasks/Tags Count */}
                    {(memo.tasks.length > 0 || memo.tags.length > 0) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {memo.tasks.length > 0 && (
                            <span>{memo.tasks.length} task{memo.tasks.length > 1 ? 's' : ''}</span>
                          )}
                          {memo.tags.length > 0 && (
                            <span>{memo.tags.length} tag{memo.tags.length > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    )}
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
                  Previous
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
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}