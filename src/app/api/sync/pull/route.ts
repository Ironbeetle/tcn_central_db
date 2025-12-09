/**
 * Sync Pull API Route
 * 
 * POST /api/sync/pull - Pull and apply updates from portal
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  pullAndApplyProfileUpdates,
  pullAndApplyFamilyUpdates,
  pullAndApplyAllUpdates,
} from '@/lib/sync/actions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, since } = body;

    const sinceDate = since ? new Date(since) : undefined;
    let result;

    switch (type) {
      case 'profiles':
        result = await pullAndApplyProfileUpdates(sinceDate);
        break;

      case 'families':
        result = await pullAndApplyFamilyUpdates(sinceDate);
        break;

      case 'all':
      default:
        result = await pullAndApplyAllUpdates(sinceDate);
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Pull failed',
      },
      { status: 500 }
    );
  }
}
