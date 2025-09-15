'use client';

import React from 'react';
import TimestampText from '@/components/TimestampText';
import { Memo } from '@/types';

interface MemoCardProps {
  memo: Memo;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onConvertToTask?: () => void;
  onTimestampPress?: (seconds: number, videoId?: string) => void;
  showActions?: boolean;
}

export const MemoCard: React.FC<MemoCardProps> = ({
  memo,
  onPress,
  onEdit,
  onDelete,
  onConvertToTask,
  onTimestampPress,
  showActions = true,
}) => {
  const formatTimestamp = (seconds?: number): string => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const handleCardClick = () => {
    if (onPress) {
      onPress();
    }
  };

  return (
    <div
      className={`bg-white rounded-lg p-6 mb-4 shadow-md transition-shadow hover:shadow-lg ${
        onPress ? 'cursor-pointer' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center flex-1">
          <span className="text-lg mr-3">
            {getMemoTypeIcon(memo.memo_type)}
          </span>
          {memo.timestamp_sec && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onTimestampPress) {
                  onTimestampPress(memo.timestamp_sec!);
                }
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {formatTimestamp(memo.timestamp_sec)}
            </button>
          )}
        </div>
        <div className="text-right">
          {memo.importance && (
            <div className="text-sm mb-1">
              {getImportanceStars(memo.importance)}
            </div>
          )}
          <div className="text-xs text-gray-500">
            {formatDate(memo.created_at)}
          </div>
        </div>
      </div>

      {/* Video Info */}
      {memo.video && (
        <div className="flex items-center bg-gray-50 px-3 py-2 rounded mb-3">
          <span className="text-sm mr-2">📹</span>
          <span className="text-sm text-gray-700 font-medium truncate flex-1">
            {memo.video.title}
          </span>
        </div>
      )}

      {/* Content with Timestamp Links */}
      <div className="text-gray-700 mb-3 leading-relaxed">
        <TimestampText
          content={memo.content}
          videoId={memo.video_id}
          onTimestampPress={onTimestampPress}
          className="leading-relaxed"
        />
      </div>

      {/* Tags */}
      {memo.tags && memo.tags.length > 0 && (
        <div className="flex flex-wrap items-center mb-3">
          {memo.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-xs mr-2 mb-1"
            >
              {tag.name}
            </span>
          ))}
          {memo.tags.length > 3 && (
            <span className="text-xs text-gray-500 ml-2">
              +{memo.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && (onEdit || onDelete || onConvertToTask) && (
        <div className="flex justify-end pt-3 border-t border-gray-200">
          {onConvertToTask && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConvertToTask();
              }}
              className="text-green-600 hover:text-green-800 text-sm font-medium mr-4 px-2 py-1 hover:bg-green-50 rounded transition-colors"
            >
              タスク化
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-4 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
            >
              編集
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
            >
              削除
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MemoCard;