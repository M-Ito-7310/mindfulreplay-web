import { NextRequest, NextResponse } from 'next/server';
import { extractVideoId, getVideoMetadata } from '@/lib/youtube';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const youtubeUrl = searchParams.get('url');

    if (!youtubeUrl || youtubeUrl.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'YouTube URL is required'
          }
        },
        { status: 400 }
      );
    }

    // Extract YouTube ID from URL
    const youtubeId = extractVideoId(youtubeUrl);

    if (!youtubeId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid YouTube URL'
          }
        },
        { status: 400 }
      );
    }

    // Get video metadata from YouTube API using shared function
    const metadata = await getVideoMetadata(youtubeId);

    return NextResponse.json({
      success: true,
      data: {
        videoMetadata: metadata,
        youtubeUrl: youtubeUrl.trim()
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[Preview Video API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'YOUTUBE_API_ERROR',
          message: error.message || 'Failed to fetch video metadata'
        }
      },
      { status: 502 }
    );
  }
}