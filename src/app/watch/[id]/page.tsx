'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { YouTubePlayer } from '@/components/video/YouTubePlayer';
import { formatTimestamp } from '@/lib/utils';
import { AppHeader } from '@/components/ui/AppHeader';

interface Video {
  id: string;
  youtubeId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: number;
  channelName?: string;
  publishedAt?: string;
}

interface Memo {
  id: string;
  content: string;
  timestampSec?: number;
  memoType: 'INSIGHT' | 'ACTION' | 'QUESTION' | 'SUMMARY';
  importance: number;
  createdAt: string;
  tasks: any[];
  tags: any[];
}

const MEMO_TYPE_COLORS = {
  INSIGHT: 'bg-blue-100 text-blue-800 border-blue-200',
  ACTION: 'bg-green-100 text-green-800 border-green-200',
  QUESTION: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SUMMARY: 'bg-purple-100 text-purple-800 border-purple-200'
};

export default function WatchPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const searchParams = useSearchParams();
  const playerRef = useRef<any>(null);

  const [video, setVideo] = useState<Video | null>(null);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showMemoForm, setShowMemoForm] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [memoForm, setMemoForm] = useState({
    content: '',
    timestampSec: undefined as number | undefined,
    memoType: 'INSIGHT' as const,
    importance: 3
  });

  const youtubeId = params.id as string;
  const timestampParam = searchParams.get('t');

  // Fetch video and memos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch video
        const videoResponse = await fetch(`/api/videos?youtubeId=${youtubeId}`);
        const videoData = await videoResponse.json();

        if (videoData.success && videoData.data.items.length > 0) {
          setVideo(videoData.data.items[0]);

          // Fetch memos for this video
          if (status === 'authenticated') {
            const memosResponse = await fetch(`/api/memos?videoId=${videoData.data.items[0].id}`);
            const memosData = await memosResponse.json();

            if (memosData.success) {
              setMemos(memosData.data.memos);
            }
          }
        } else {
          setError('Video not found');
        }
      } catch (err) {
        setError('Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    if (youtubeId) {
      fetchData();
    }
  }, [youtubeId, status]);

  // Handle timestamp parameter
  useEffect(() => {
    if (timestampParam && playerRef.current) {
      const timestamp = parseInt(timestampParam);
      playerRef.current.seekTo(timestamp);
    }
  }, [timestampParam, video]);

  const handleCreateMemo = async () => {
    if (!video || !session) return;

    try {
      const response = await fetch('/api/memos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoId: video.id,
          content: memoForm.content,
          timestampSec: memoForm.timestampSec,
          memoType: memoForm.memoType,
          importance: memoForm.importance
        })
      });

      const data = await response.json();

      if (data.success) {
        setMemos(prev => [data.data.memo, ...prev]);
        setMemoForm({
          content: '',
          timestampSec: undefined,
          memoType: 'INSIGHT',
          importance: 3
        });
        setShowMemoForm(false);
      } else {
        setError('Failed to create memo');
      }
    } catch (err) {
      setError('Failed to create memo');
    }
  };

  const handleTimestampClick = (timestamp: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(timestamp);
    }
  };

  const handleAddMemoAtCurrentTime = () => {
    // 動画を一時停止
    if (playerRef.current) {
      playerRef.current.pause();
    }

    setMemoForm(prev => ({
      ...prev,
      timestampSec: Math.floor(currentTime)
    }));
    setShowMemoForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading video...</div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-red-600 mb-4">{error || 'Video not found'}</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Videos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← 動画一覧に戻る
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player Column */}
          <div className="lg:col-span-2">
            {/* Player */}
            <div className="bg-white rounded-lg shadow mb-6">
              <YouTubePlayer
                ref={playerRef}
                videoId={youtubeId}
                onTimeUpdate={setCurrentTime}
                className="w-full aspect-video rounded-t-lg"
                initialTime={timestampParam ? parseInt(timestampParam) : undefined}
              />

              {/* Video Info */}
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{video.title}</h1>

                {video.description && (
                  <div className="mb-4">
                    <p className={`text-gray-700 whitespace-pre-wrap ${showFullDescription ? '' : 'line-clamp-5'}`}>
                      {video.description}
                    </p>
                    {video.description.split('\n').length > 5 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {showFullDescription ? '折りたたむ ↑' : 'もっと見る ↓'}
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {video.channelName && (
                      <span>{video.channelName}</span>
                    )}
                    {video.duration && (
                      <span>Duration: {formatTimestamp(video.duration)}</span>
                    )}
                    {video.publishedAt && (
                      <span>Published: {new Date(video.publishedAt).toLocaleDateString()}</span>
                    )}
                  </div>

                  {status === 'authenticated' && (
                    <button
                      onClick={handleAddMemoAtCurrentTime}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Add Memo at {formatTimestamp(Math.floor(currentTime))}
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Memos Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Memos</h2>
                  {status === 'authenticated' && (
                    <button
                      onClick={() => setShowMemoForm(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {status === 'unauthenticated' ? (
                  <div className="p-6 text-center text-gray-600">
                    <p>Sign in to view and create memos</p>
                  </div>
                ) : memos.length === 0 ? (
                  <div className="p-6 text-center text-gray-600">
                    <p>No memos yet. Create your first memo while watching!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {memos.map((memo) => (
                      <div key={memo.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${MEMO_TYPE_COLORS[memo.memoType]}`}>
                            {memo.memoType}
                          </span>
                          {memo.timestampSec !== undefined && (
                            <button
                              onClick={() => handleTimestampClick(memo.timestampSec!)}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              {formatTimestamp(memo.timestampSec)}
                            </button>
                          )}
                        </div>

                        <p className="text-sm text-gray-900 mb-2">{memo.content}</p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Priority: {memo.importance}/5</span>
                          <Link
                            href={`/memos/${memo.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Details →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Memo Creation Modal */}
      {showMemoForm && status === 'authenticated' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">新しいメモを作成</h3>
                <button
                  onClick={() => setShowMemoForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    内容
                  </label>
                  <textarea
                    value={memoForm.content}
                    onChange={(e) => setMemoForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="メモの内容を入力してください..."
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      タイプ
                    </label>
                    <select
                      value={memoForm.memoType}
                      onChange={(e) => setMemoForm(prev => ({ ...prev, memoType: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="INSIGHT">洞察</option>
                      <option value="ACTION">アクション</option>
                      <option value="QUESTION">質問</option>
                      <option value="SUMMARY">要約</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      重要度
                    </label>
                    <select
                      value={memoForm.importance}
                      onChange={(e) => setMemoForm(prev => ({ ...prev, importance: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1 - 非常に低い</option>
                      <option value={2}>2 - 低い</option>
                      <option value={3}>3 - 中</option>
                      <option value={4}>4 - 高い</option>
                      <option value={5}>5 - 非常に高い</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      タイムスタンプ（秒）
                    </label>
                    <input
                      type="number"
                      value={memoForm.timestampSec || ''}
                      onChange={(e) => setMemoForm(prev => ({
                        ...prev,
                        timestampSec: e.target.value ? parseInt(e.target.value) : undefined
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="秒数"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowMemoForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleCreateMemo}
                    disabled={!memoForm.content.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    メモを作成
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}