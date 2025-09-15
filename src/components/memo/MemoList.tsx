'use client';

import React from 'react';
import { MemoCard } from './MemoCard';
import { Memo } from '@/types';

interface MemoListProps {
  memos: Memo[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onMemoPress?: (memo: Memo) => void;
  onMemoEdit?: (memo: Memo) => void;
  onMemoDelete?: (memo: Memo) => void;
  onMemoConvertToTask?: (memo: Memo) => void;
  onTimestampPress?: (seconds: number, videoId?: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  onAddMemo?: () => void;
  showActions?: boolean;
  scrollEnabled?: boolean;
}

export const MemoList: React.FC<MemoListProps> = ({
  memos,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onMemoPress,
  onMemoEdit,
  onMemoDelete,
  onMemoConvertToTask,
  onTimestampPress,
  onLoadMore,
  hasMore = false,
  emptyTitle = 'メモがありません',
  emptySubtitle = 'メモを追加して学習内容を記録しましょう',
  onAddMemo,
  showActions = true,
  scrollEnabled = true,
}) => {
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
        {emptyTitle}
      </h3>
      <p className="text-gray-600 text-center mb-6">
        {emptySubtitle}
      </p>
      {onAddMemo && (
        <button
          onClick={onAddMemo}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors min-w-[150px]"
        >
          メモを追加
        </button>
      )}
    </div>
  );

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-16">
      <div className="text-gray-600">読み込み中...</div>
    </div>
  );

  const renderLoadMoreButton = () => {
    if (!hasMore) return null;

    return (
      <div className="flex justify-center py-6">
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '読み込み中...' : 'さらに読み込む'}
        </button>
      </div>
    );
  };

  if (isLoading && memos.length === 0) {
    return renderLoadingState();
  }

  return (
    <div className="p-4">
      {/* Refresh button for web */}
      {onRefresh && (
        <div className="mb-4">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
          >
            {isRefreshing ? '更新中...' : '更新'}
          </button>
        </div>
      )}

      {/* Memo List */}
      {memos.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-0">
          {memos.map((memo) => (
            <MemoCard
              key={memo.id}
              memo={memo}
              onPress={onMemoPress ? () => onMemoPress(memo) : undefined}
              onEdit={onMemoEdit ? () => onMemoEdit(memo) : undefined}
              onDelete={onMemoDelete ? () => onMemoDelete(memo) : undefined}
              onConvertToTask={onMemoConvertToTask ? () => onMemoConvertToTask(memo) : undefined}
              onTimestampPress={onTimestampPress}
              showActions={showActions}
            />
          ))}
          {renderLoadMoreButton()}
        </div>
      )}
    </div>
  );
};

export default MemoList;