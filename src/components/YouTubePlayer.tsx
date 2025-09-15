'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { YouTubePlayerProps } from '@/types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayerRef {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
}

const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(({
  videoId,
  initialTime = 0,
  onReady,
  onTimeUpdate,
  onPlaybackStateChange,
  onError,
  className = ''
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiLoaded(true);
      return;
    }

    // Check if script is already loaded
    if (!document.getElementById('youtube-api-script')) {
      const script = document.createElement('script');
      script.id = 'youtube-api-script';
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }

    window.onYouTubeIframeAPIReady = () => {
      setIsApiLoaded(true);
    };
  }, []);

  // Initialize player when API is loaded
  useEffect(() => {
    if (!isApiLoaded || !videoId || !containerRef.current || playerRef.current) return;

    const playerId = `youtube-player-${Date.now()}`;
    containerRef.current.id = playerId;

    playerRef.current = new window.YT.Player(playerId, {
      width: '100%',
      height: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1,
        start: initialTime,
        origin: window.location.origin
      },
      events: {
        onReady: (event: any) => {
          setIsPlayerReady(true);
          onReady?.();

          // Apply initial time if specified
          if (initialTime > 0) {
            setTimeout(() => {
              event.target.seekTo(initialTime, true);
            }, 500);
          }

          // Start time update tracking
          startTimeUpdateTracking();
        },
        onStateChange: (event: any) => {
          let state: 'playing' | 'paused' | 'ended' | 'unknown' = 'unknown';

          switch (event.data) {
            case window.YT.PlayerState.PLAYING:
              state = 'playing';
              break;
            case window.YT.PlayerState.PAUSED:
              state = 'paused';
              break;
            case window.YT.PlayerState.ENDED:
              state = 'ended';
              break;
          }

          if (state !== 'unknown') {
            onPlaybackStateChange?.(state);
          }
        },
        onError: (event: any) => {
          const errorMessages: Record<number, string> = {
            2: 'Invalid video ID or parameter',
            5: 'Video not available in HTML5 player',
            100: 'Video not found or removed',
            101: 'Video owner does not allow embedding',
            150: 'Video restricted from playback in embedded players'
          };

          const errorMessage = errorMessages[event.data] || `Unknown error (${event.data})`;
          onError?.(errorMessage);
        }
      }
    });

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.warn('Error destroying YouTube player:', error);
        }
      }
      playerRef.current = null;
      setIsPlayerReady(false);
    };
  }, [isApiLoaded, videoId, initialTime]);

  const startTimeUpdateTracking = () => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
    }

    timeUpdateInterval.current = setInterval(() => {
      if (playerRef.current && isPlayerReady && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          onTimeUpdate?.(currentTime);
        } catch (error) {
          // Player might not be ready, ignore error
        }
      }
    }, 1000); // Update every second
  };

  // Expose player methods via ref
  useImperativeHandle(ref, () => ({
    play: () => {
      if (playerRef.current && isPlayerReady) {
        playerRef.current.playVideo();
      }
    },
    pause: () => {
      if (playerRef.current && isPlayerReady) {
        playerRef.current.pauseVideo();
      }
    },
    seekTo: (seconds: number) => {
      if (playerRef.current && isPlayerReady) {
        playerRef.current.seekTo(seconds, true);
      }
    },
    getCurrentTime: () => {
      if (playerRef.current && isPlayerReady && typeof playerRef.current.getCurrentTime === 'function') {
        return playerRef.current.getCurrentTime();
      }
      return 0;
    }
  }), [isPlayerReady]);

  return (
    <div
      ref={containerRef}
      className={`youtube-player-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '315px',
        backgroundColor: '#000'
      }}
    />
  );
});

YouTubePlayer.displayName = 'YouTubePlayer';

export default YouTubePlayer;