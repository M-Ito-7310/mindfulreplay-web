import { NextRequest, NextResponse } from 'next/server';
import { healthCheck, shouldUseMockData } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();

    // Basic service status
    const serviceStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      dataSource: shouldUseMockData() ? 'mock' : 'database'
    };

    // Database health check (only if not using mock data)
    let databaseStatus = { status: 'not_configured' };
    if (!shouldUseMockData()) {
      try {
        databaseStatus = await healthCheck();
      } catch (error) {
        databaseStatus = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Database connection failed'
        };
      }
    } else {
      databaseStatus = { status: 'mock_mode' };
    }

    // YouTube API status
    const youtubeStatus = {
      status: process.env.YOUTUBE_USE_MOCK === 'true' ? 'mock_mode' : (process.env.YOUTUBE_API_KEY ? 'configured' : 'not_configured')
    };

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        service: serviceStatus,
        database: databaseStatus,
        youtube: youtubeStatus,
        performance: {
          responseTime: `${responseTime}ms`
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[Health API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Health check failed'
        }
      },
      { status: 500 }
    );
  }
}