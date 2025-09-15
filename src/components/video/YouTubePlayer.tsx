'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate?: (currentTime: number) => void;
  className?: string;
  initialTime?: number;
}

export interface YouTubePlayerRef {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  play: () => void;
  pause: () => void;
}

export const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
  ({ videoId, onTimeUpdate, className, initialTime }, ref) => {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        if (playerRef.current && playerRef.current.seekTo) {
          playerRef.current.seekTo(seconds, true);
        }
      },
      getCurrentTime: () => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          return playerRef.current.getCurrentTime();
        }
        return 0;
      },
      play: () => {
        if (playerRef.current && playerRef.current.playVideo) {
          playerRef.current.playVideo();
        }
      },
      pause: () => {
        if (playerRef.current && playerRef.current.pauseVideo) {
          playerRef.current.pauseVideo();
        }
      }
    }));

    useEffect(() => {
      // Load YouTube IFrame API
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = initializePlayer;
      } else {
        initializePlayer();
      }

      function initializePlayer() {
        if (containerRef.current && window.YT && window.YT.Player) {
          playerRef.current = new window.YT.Player(containerRef.current, {
            videoId: videoId,
            playerVars: {
              autoplay: 0,
              controls: 1,
              rel: 0,
              showinfo: 0,
              modestbranding: 1
            },
            events: {
              onReady: onPlayerReady,
              onStateChange: onPlayerStateChange
            }
          });
        }
      }

      function onPlayerReady() {
        // Seek to initial time if provided
        if (initialTime && initialTime > 0 && playerRef.current && playerRef.current.seekTo) {
          playerRef.current.seekTo(initialTime, true);
        }

        // Start time update interval when player is ready
        if (onTimeUpdate) {
          timeUpdateIntervalRef.current = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
              const currentTime = playerRef.current.getCurrentTime();
              onTimeUpdate(currentTime);
            }
          }, 1000);
        }
      }

      function onPlayerStateChange(event: any) {
        // Handle player state changes if needed
      }

      return () => {
        if (timeUpdateIntervalRef.current) {
          clearInterval(timeUpdateIntervalRef.current);
        }
        if (playerRef.current && playerRef.current.destroy) {
          playerRef.current.destroy();
        }
      };
    }, [videoId, onTimeUpdate, initialTime]);

    return (
      <div className={className}>
        <div ref={containerRef} className="w-full h-full" />
      </div>
    );
  }
);

YouTubePlayer.displayName = 'YouTubePlayer';