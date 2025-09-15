'use client';

import React from 'react';
import Image from 'next/image';

interface VideoMetadata {
  youtubeId: string;
  title: string;
  description: string;
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  duration: number;
  publishedAt: string;
  viewCount: number;
  likeCount: number | null;
  tags: string[];
}

interface VideoPreviewCardProps {
  videoMetadata: VideoMetadata;
  youtubeUrl: string;
}

export const VideoPreviewCard: React.FC<VideoPreviewCardProps> = ({
  videoMetadata,
  youtubeUrl,
}) => {
  if (!videoMetadata) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="text-center text-red-600">
          動画情報の読み込みに失敗しました
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count: number): string => {
    if (!count || isNaN(count)) return '0回再生';

    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M回再生`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K回再生`;
    }
    return `${count}回再生`;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '日付不明';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return '日付不明';
    }
  };

  const thumbnailUrl = videoMetadata.thumbnailUrl || `https://img.youtube.com/vi/${videoMetadata.youtubeId}/maxresdefault.jpg`;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        動画情報プレビュー
      </h3>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Thumbnail */}
        <div className="relative">
          <div className="relative w-full h-48 bg-gray-200">
            <Image
              src={thumbnailUrl}
              alt={videoMetadata.title || 'Video thumbnail'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={(e) => {
                console.warn('Thumbnail loading error');
              }}
            />
          </div>
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs font-semibold">
            {formatDuration(videoMetadata.duration)}
          </div>
        </div>

        {/* Video Info */}
        <div className="p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {videoMetadata.title || 'タイトル不明'}
          </h4>

          <p className="text-gray-600 mb-3">
            {videoMetadata.channelName || 'チャンネル不明'}
          </p>

          <div className="flex flex-wrap items-center text-sm text-gray-500 mb-4">
            <span>{formatViewCount(videoMetadata.viewCount || 0)}</span>
            <span className="mx-2">•</span>
            <span>{formatDate(videoMetadata.publishedAt)}</span>
            {videoMetadata.likeCount && (
              <>
                <span className="mx-2">•</span>
                <span>👍 {videoMetadata.likeCount.toLocaleString()}</span>
              </>
            )}
          </div>

          {videoMetadata.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {videoMetadata.description}
            </p>
          )}

          {videoMetadata.tags && Array.isArray(videoMetadata.tags) && videoMetadata.tags.length > 0 && (
            <div className="flex flex-wrap">
              {videoMetadata.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs mr-2 mb-1"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* URL Info */}
      <div className="bg-gray-50 p-4 rounded-md mt-4">
        <p className="text-sm font-medium text-gray-600 mb-1">
          保存される動画URL:
        </p>
        <p className="text-sm text-gray-500 font-mono truncate">
          {youtubeUrl}
        </p>
      </div>
    </div>
  );
};

export default VideoPreviewCard;