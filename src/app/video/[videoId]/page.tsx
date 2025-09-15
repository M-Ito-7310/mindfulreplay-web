'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import YouTubePlayer, { YouTubePlayerRef } from '@/components/YouTubePlayer';
import TimestampText from '@/components/TimestampText';
import { Video, Memo } from '@/types';

export default function VideoPlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const videoId = params.videoId as string;
  const initialTime = searchParams.get('t') ? parseInt(searchParams.get('t')!) : undefined;

  const [video, setVideo] = useState<Video | null>(null);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackState, setPlaybackState] = useState<'playing' | 'paused' | 'ended'>('paused');

  const playerRef = useRef<YouTubePlayerRef>(null);

  // Mock data for development - Replace with actual API calls
  useEffect(() => {
    // Mock video data
    const mockVideo: Video = {
      id: videoId,
      user_id: 'user1',
      youtube_id: videoId,
      youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
      title: 'Sample Learning Video',
      description: 'This is a sample video for demonstration',
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      duration: 600,
      channel_name: 'Learning Channel',
      published_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    // Mock memo data with timestamps
    const mockMemos: Memo[] = [
      {
        id: 'memo1',
        user_id: 'user1',
        video_id: videoId,
        content: 'Important point at 1:30 about the main concept. Also check 2:45 for details.',
        timestamp_sec: 90,
        memo_type: 'insight',
        importance: 4,
        created_at: '2024-01-01T01:00:00Z',
        updated_at: '2024-01-01T01:00:00Z'
      },
      {
        id: 'memo2',
        user_id: 'user1',
        video_id: videoId,
        content: 'Action item: Review this section at 3:15 and practice the example.',
        timestamp_sec: 165,
        memo_type: 'action',
        importance: 5,
        created_at: '2024-01-01T01:30:00Z',
        updated_at: '2024-01-01T01:30:00Z'
      }
    ];

    setVideo(mockVideo);
    setMemos(mockMemos);
    setIsLoading(false);
  }, [videoId]);

  // Apply initial time when video is loaded
  useEffect(() => {
    if (video && initialTime !== undefined && playerRef.current) {
      setTimeout(() => {
        playerRef.current?.seekTo(initialTime);
      }, 1000);
    }
  }, [video, initialTime]);

  const handleTimestampPress = (seconds: number, videoId?: string) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getMemoTypeIcon = (type?: 'insight' | 'action' | 'question' | 'summary'): string => {
    switch (type) {
      case 'insight': return '💡';
      case 'action': return '🎯';
      case 'question': return '❓';
      case 'summary': return '📝';
      default: return '📝';
    }
  };

  const getImportanceStars = (importance?: 1 | 2 | 3 | 4 | 5): string => {
    if (!importance) return '';
    return '⭐'.repeat(importance);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading video...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">Video not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">MindfulReplay</h1>
            <nav className="flex space-x-4">
              <a href="/" className="text-blue-600 hover:text-blue-800">Videos</a>
              <a href="/memos" className="text-gray-600 hover:text-gray-800">Memos</a>
              <a href="/tasks" className="text-gray-600 hover:text-gray-800">Tasks</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Video Player */}
              <div className="aspect-video">
                <YouTubePlayer
                  ref={playerRef}
                  videoId={video.youtube_id}
                  initialTime={initialTime}
                  onReady={() => console.log('Player ready')}
                  onTimeUpdate={setCurrentTime}
                  onPlaybackStateChange={setPlaybackState}
                  onError={(error) => console.error('Player error:', error)}
                  className="w-full h-full"
                />
              </div>

              {/* Video Info */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h2>
                {video.channel_name && (
                  <p className="text-gray-600 mb-2">by {video.channel_name}</p>
                )}
                {video.description && (
                  <p className="text-gray-700 mb-4">{video.description}</p>
                )}

                {/* Current Time Display */}
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-600">Current Time: </span>
                    <span className="font-mono text-lg">{formatTime(currentTime)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status: </span>
                    <span className={`font-medium ${
                      playbackState === 'playing' ? 'text-green-600' :
                      playbackState === 'paused' ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {playbackState === 'playing' ? 'Playing' :
                       playbackState === 'paused' ? 'Paused' : 'Ended'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Memos Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Memos ({memos.length})
              </h3>

              <div className="space-y-4">
                {memos.map((memo) => (
                  <div key={memo.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    {/* Memo Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getMemoTypeIcon(memo.memo_type)}</span>
                        {memo.timestamp_sec && (
                          <button
                            onClick={() => handleTimestampPress(memo.timestamp_sec!)}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                          >
                            {formatTime(memo.timestamp_sec)}
                          </button>
                        )}
                      </div>
                      {memo.importance && (
                        <span className="text-sm">{getImportanceStars(memo.importance)}</span>
                      )}
                    </div>

                    {/* Memo Content with Timestamp Links */}
                    <div className="text-gray-700 mb-2">
                      <TimestampText
                        content={memo.content}
                        videoId={video.id}
                        onTimestampPress={handleTimestampPress}
                        className="leading-relaxed"
                      />
                    </div>

                    {/* Memo Footer */}
                    <div className="text-xs text-gray-500">
                      {new Date(memo.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}

                {memos.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No memos for this video yet.</p>
                    <button className="mt-2 text-blue-600 hover:text-blue-800 underline">
                      Add your first memo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}