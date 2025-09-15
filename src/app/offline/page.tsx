'use client';

import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/ui/AppHeader';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (isOnline) {
      window.location.href = '/';
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className={`w-8 h-8 ${isOnline ? 'text-green-500' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOnline ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
                />
              )}
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isOnline ? '接続が復旧しました' : 'オフラインです'}
          </h1>

          <p className="text-gray-600">
            {isOnline
              ? 'インターネット接続が復旧しました。MindfulReplayを引き続きご利用いただけます。'
              : 'インターネットに接続されていないようです。一部の機能は再接続するまで利用できません。'
            }
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleRetry}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isOnline
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isOnline ? 'アプリに戻る' : '再試行'}
          </button>

          <div className="text-sm text-gray-500">
            <p className="mb-2">オフライン中でも以下のことができます：</p>
            <ul className="text-left space-y-1">
              <li>• 以前に読み込まれたコンテンツの表示</li>
              <li>• キャッシュされた動画とメモの閲覧</li>
              <li>• オフライン機能の使用</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            MindfulReplayはインターネット接続時に最適に動作します
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}