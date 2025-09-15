'use client';

import React from 'react';
import { TimestampTextProps } from '@/types';

const TimestampText: React.FC<TimestampTextProps> = ({
  content,
  videoId,
  onTimestampPress,
  className = ''
}) => {
  // Parse timestamp string to seconds
  const parseTimestamp = (timestamp: string): number => {
    const parts = timestamp.split(':').map(p => parseInt(p, 10));

    if (parts.length === 2) {
      // MM:SS format
      const [minutes, seconds] = parts;
      return minutes * 60 + seconds;
    } else if (parts.length === 3) {
      // HH:MM:SS format
      const [hours, minutes, seconds] = parts;
      return hours * 3600 + minutes * 60 + seconds;
    }

    return 0;
  };

  // Regular expression to match timestamps like 0:00, 1:23, 1:23:45
  const timestampRegex = /(\d{1,2}:\d{2}(?::\d{2})?)/g;

  // Split content into parts with timestamps
  const renderContent = () => {
    if (!onTimestampPress || !videoId) {
      // If no handler or videoId, just render plain text
      return <span className={className}>{content}</span>;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    // Find all timestamp matches
    const matches: Array<{ index: number; length: number; text: string }> = [];
    while ((match = timestampRegex.exec(content)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        text: match[0],
      });
    }

    // Process matches and create components
    matches.forEach((matchInfo) => {
      // Add text before timestamp
      if (matchInfo.index > lastIndex) {
        const textBefore = content.substring(lastIndex, matchInfo.index);
        parts.push(
          <span key={`text-${key++}`}>
            {textBefore}
          </span>
        );
      }

      // Add clickable timestamp
      const seconds = parseTimestamp(matchInfo.text);

      const handleTimestampClick = () => {
        onTimestampPress(seconds, videoId);
      };

      parts.push(
        <button
          key={`timestamp-${key++}`}
          onClick={handleTimestampClick}
          className="text-blue-600 hover:text-blue-800 underline cursor-pointer font-medium transition-colors duration-200"
          type="button"
        >
          {matchInfo.text}
        </button>
      );

      lastIndex = matchInfo.index + matchInfo.length;
    });

    // Add remaining text after last timestamp
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      parts.push(
        <span key={`text-${key++}`}>
          {remainingText}
        </span>
      );
    }

    // If no timestamps found, return plain text
    if (parts.length === 0) {
      return <span className={className}>{content}</span>;
    }

    return <span className={className}>{parts}</span>;
  };

  return <>{renderContent()}</>;
};

export default TimestampText;