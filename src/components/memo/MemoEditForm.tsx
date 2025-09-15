'use client';

import React, { useState, useEffect } from 'react';
import { MemoForm, Memo } from '@/types';

interface MemoEditFormProps {
  memo?: Memo;
  initialTimestamp?: number;
  onSubmit: (data: MemoForm) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const MemoEditForm: React.FC<MemoEditFormProps> = ({
  memo,
  initialTimestamp,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [content, setContent] = useState(memo?.content || '');
  const [memoType, setMemoType] = useState<'insight' | 'action' | 'question' | 'summary' | undefined>(memo?.memo_type || undefined);
  const [importance, setImportance] = useState<1 | 2 | 3 | 4 | 5>(memo?.importance || 3);
  const [showImportanceOptions, setShowImportanceOptions] = useState(false);
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [includeTimestamp, setIncludeTimestamp] = useState(false);

  useEffect(() => {
    if (memo) {
      setContent(memo.content || '');
      setMemoType(memo.memo_type || undefined);
      setImportance(memo.importance || 3);
    }
  }, [memo]);

  const getFinalContent = (): string => {
    if (includeTimestamp && initialTimestamp !== undefined) {
      const timeText = formatTime(initialTimestamp) + ' ';
      if (!content.startsWith(timeText)) {
        return timeText + content;
      }
    }
    return content;
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('メモの内容を入力してください');
      return;
    }

    try {
      const formData: MemoForm = {
        content: getFinalContent().trim(),
        timestamp_sec: undefined,
        memo_type: memoType || 'insight',
        importance: importance,
      };

      await onSubmit(formData);
    } catch (error) {
      alert('メモの保存に失敗しました');
    }
  };

  const getTemplateContent = (type: 'insight' | 'action' | 'question' | 'summary'): string => {
    switch (type) {
      case 'insight':
        return '【気づいたこと】\n\n【なるほどと思ったポイント】\n\n【なぜ印象に残ったか】\n\n';
      case 'action':
        return '【やってみたいこと】\n\n【いつやるか】\n\n【必要なもの】\n\n';
      case 'question':
        return '【疑問に思ったこと】\n\n【なぜ気になったか】\n\n【どう解決するか】\n\n';
      case 'summary':
        return '【要点まとめ】\n\n【参考になったポイント】\n\n【活用できそうなこと】\n\n';
      default:
        return '';
    }
  };

  const applyTemplate = (type: 'insight' | 'action' | 'question' | 'summary') => {
    const templateContent = getTemplateContent(type);
    setContent(templateContent);
    setMemoType(type);
    setShowFormatOptions(false);
  };

  const getMemoTypeLabel = (type: 'insight' | 'action' | 'question' | 'summary'): string => {
    switch (type) {
      case 'insight': return '💡 気づき・学び';
      case 'action': return '🎯 実践・行動';
      case 'question': return '❓ 疑問・質問';
      case 'summary': return '📝 要点・まとめ';
    }
  };

  const getImportanceLabel = (level: number): string => {
    const labels = ['', '⭐ 低', '⭐⭐ やや重要', '⭐⭐⭐ 重要', '⭐⭐⭐⭐ とても重要', '⭐⭐⭐⭐⭐ 最重要'];
    return labels[level] || '';
  };

  const suggestTaskFromMemo = (): string => {
    if (!content.trim()) return '';

    const contentLower = content.toLowerCase();

    if (contentLower.includes('実践') || contentLower.includes('やってみる') || contentLower.includes('試す')) {
      return content.split('\n')[0].replace(/【.*?】/, '').trim() + 'を実践する';
    }

    if (contentLower.includes('調べる') || contentLower.includes('リサーチ') || contentLower.includes('確認')) {
      return content.split('\n')[0].replace(/【.*?】/, '').trim() + 'について詳しく調べる';
    }

    if (contentLower.includes('学習') || contentLower.includes('勉強') || contentLower.includes('習得')) {
      return content.split('\n')[0].replace(/【.*?】/, '').trim() + 'を深く学習する';
    }

    if (memoType === 'action') {
      return content.split('\n')[0].replace(/【.*?】/, '').trim() || '実践タスクを作成';
    }

    if (memoType === 'question') {
      return content.split('\n')[0].replace(/【.*?】/, '').trim() + 'の答えを見つける';
    }

    return content.split('\n')[0].replace(/【.*?】/, '').substring(0, 50).trim() + 'について行動する';
  };

  const handleSuggestTask = () => {
    const suggestion = suggestTaskFromMemo();
    if (suggestion) {
      if (confirm(`「${suggestion}」\n\nこのタスクを作成しますか？`)) {
        alert('タスク作成機能は準備中です');
      }
    } else {
      alert('メモの内容からタスクを提案できませんでした。');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection - Only for new memos */}
          {!memo && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                メモのフォーマット
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowFormatOptions(!showFormatOptions);
                    if (showImportanceOptions) setShowImportanceOptions(false);
                  }}
                  disabled={isLoading}
                  className="w-full bg-white border border-gray-300 rounded-md px-4 py-3 text-left flex justify-between items-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <span className="text-sm flex-1 text-gray-900">
                    {memoType ? getMemoTypeLabel(memoType) : 'テンプレートなし'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {showFormatOptions ? '▲' : '▼'}
                  </span>
                </button>

                {showFormatOptions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    {(['insight', 'action', 'question', 'summary'] as const).map((type, index) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => applyTemplate(type)}
                        disabled={isLoading}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                          memoType === type ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                        } ${index === 3 ? '' : 'border-b border-gray-200'}`}
                      >
                        {getMemoTypeLabel(type)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Importance Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              重要度
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowImportanceOptions(!showImportanceOptions);
                  if (showFormatOptions) setShowFormatOptions(false);
                }}
                disabled={isLoading}
                className="w-full bg-white border border-gray-300 rounded-md px-4 py-3 text-left flex justify-between items-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <span className="text-sm flex-1 text-gray-900">
                  {getImportanceLabel(importance)}
                </span>
                <span className="text-sm text-gray-500">
                  {showImportanceOptions ? '▲' : '▼'}
                </span>
              </button>

              {showImportanceOptions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  {[1, 2, 3, 4, 5].map((level, index) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        setImportance(level as 1 | 2 | 3 | 4 | 5);
                        setShowImportanceOptions(false);
                      }}
                      disabled={isLoading}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                        importance === level ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                      } ${index === 4 ? '' : 'border-b border-gray-200'}`}
                    >
                      {getImportanceLabel(level)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              メモ内容 *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="視聴中の気づきやメモを記録しましょう..."
              rows={8}
              disabled={isLoading}
              className="w-full bg-white border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none"
            />

            {/* Timestamp checkbox */}
            {initialTimestamp !== undefined && (
              <div className="mt-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTimestamp}
                    onChange={(e) => setIncludeTimestamp(e.target.checked)}
                    disabled={isLoading}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                  />
                  <span className={`ml-3 text-sm font-medium ${
                    includeTimestamp ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    メモにタイムスタンプを追記する ({formatTime(initialTimestamp)})
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Task suggestion */}
          {content.trim() && memoType === 'action' && (
            <div>
              <button
                type="button"
                onClick={handleSuggestTask}
                disabled={isLoading}
                className="w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-sm font-medium"
              >
                💡 このメモからタスクを提案
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4 pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '保存中...' : memo ? '更新' : '保存'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                キャンセル
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemoEditForm;