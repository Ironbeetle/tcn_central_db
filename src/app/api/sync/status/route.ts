/**
 * Sync Status API Route
 * 
 * GET /api/sync/status - Check sync status and connection to portal
 */
import { NextResponse } from 'next/server';
import { checkSyncStatus, getLocalSyncStats } from '@/lib/sync/actions';

export async function GET() {
  try {
    const [syncStatus, localStats] = await Promise.all([
      checkSyncStatus(),
      getLocalSyncStats(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        sync: syncStatus,
        local: localStats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get sync status',
      },
      { status: 500 }
    );
  }
}
