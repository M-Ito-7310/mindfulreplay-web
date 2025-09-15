'use client';

import React, { useState } from 'react';
import { VideoPreviewCard } from './VideoPreviewCard';
import { Video, VideoSaveResponse, VideoPreviewResponse } from '@/types';

interface AddVideoModalProps {
  visible: boolean;
  onClose: () => void;
  onVideoAdded: (video: Video) => void;
}

type ModalStep = 'input' | 'preview';

export const AddVideoModal: React.FC<AddVideoModalProps> = ({
  visible,
  onClose,
  onVideoAdded,
}) => {
  const [step, setStep] = useState<ModalStep>('input');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoPreview, setVideoPreview] = useState<VideoPreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateYouTubeUrl = (url: string): boolean => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];

    return patterns.some(pattern => pattern.test(url));
  };

  const handlePreviewVideo = async () => {
    const trimmedUrl = youtubeUrl.trim();

    if (!trimmedUrl) {
      setError('YouTube URLを入力してください');
      return;
    }

    if (!validateYouTubeUrl(trimmedUrl)) {
      setError('有効なYouTube URLを入力してください');
      return;
    }

    setError(null);
    setIsLoadingPreview(true);

    try {
      const response = await fetch(`/api/preview-video?url=${encodeURIComponent(trimmedUrl)}`);
      const data = await response.json();

      if (data.success) {
        setVideoPreview(data.data);
        setStep('preview');
      } else {
        throw new Error(data.error?.message || '動画情報の取得に失敗しました');
      }
    } catch (error: any) {
      console.error('Error previewing video:', error);
      setError(error.message || '動画情報の取得に失敗しました');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSaveVideo = async () => {
    if (!videoPreview) return;

    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtubeUrl: videoPreview.youtubeUrl
        })
      });

      const data = await response.json();

      if (data.success) {
        onVideoAdded(data.data.video);
        handleClose();
        alert('動画を保存しました！');
      } else {
        throw new Error(data.error?.message || '動画の保存に失敗しました');
      }
    } catch (error: any) {
      console.error('Error saving video:', error);
      setError(error.message || '動画の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToInput = () => {
    setStep('input');
    setVideoPreview(null);
    setError(null);
  };

  const handleClose = () => {
    setStep('input');
    setYoutubeUrl('');
    setVideoPreview(null);
    setError(null);
    setIsLoadingPreview(false);
    setIsSaving(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {step === 'input' ? 'YouTube動画を追加' : '動画情報確認'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 px-4 py-2 rounded hover:bg-gray-100"
          >
            キャンセル
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {step === 'input' ? (
            // Step 1: URL Input
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => {
                    setYoutubeUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    error ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoadingPreview}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePreviewVideo();
                    }
                  }}
                />
                {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  対応するURL形式:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• https://www.youtube.com/watch?v=VIDEO_ID</li>
                  <li>• https://youtu.be/VIDEO_ID</li>
                  <li>• https://www.youtube.com/embed/VIDEO_ID</li>
                </ul>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handlePreviewVideo}
                  disabled={isLoadingPreview || !youtubeUrl.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoadingPreview && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  <span>
                    {isLoadingPreview ? '動画情報取得中...' : '動画情報を取得'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            // Step 2: Video Preview and Save
            <div className="space-y-6">
              {videoPreview && (
                <VideoPreviewCard
                  videoMetadata={videoPreview.videoMetadata}
                  youtubeUrl={videoPreview.youtubeUrl}
                />
              )}

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={handleSaveVideo}
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSaving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  <span>{isSaving ? '保存中...' : '動画を保存'}</span>
                </button>
                <button
                  onClick={handleBackToInput}
                  disabled={isSaving}
                  className="flex-1 border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  戻る
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddVideoModal;