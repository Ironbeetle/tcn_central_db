/**
 * Sync Push API Route
 * 
 * POST /api/sync/push - Push members to portal
 */
import { NextRequest, NextResponse } from 'next/server';
import { 
  syncMemberToPortal, 
  batchPushMembersToPortal, 
  fullPushToPortal,
  incrementalPushToPortal,
  pushMemberOnlyToPortal
} from '@/lib/sync/actions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, memberIds, memberId, batchSize, since, includeRelations } = body;

    let result;

    switch (type) {
      case 'single':
        if (!memberId) {
          return NextResponse.json(
            { success: false, error: 'memberId is required for single push' },
            { status: 400 }
          );
        }
        result = await syncMemberToPortal(memberId);
        break;

      case 'batch':
        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
          return NextResponse.json(
            { success: false, error: 'memberIds array is required for batch push' },
            { status: 400 }
          );
        }
        result = await batchPushMembersToPortal(memberIds);
        break;

      case 'full':
        result = await fullPushToPortal(batchSize || 100);
        break;

      case 'incremental':
        // Incremental sync - only members updated since a given date
        if (!since) {
          return NextResponse.json(
            { success: false, error: 'since date is required for incremental push' },
            { status: 400 }
          );
        }
        result = await incrementalPushToPortal(
          new Date(since),
          includeRelations ?? false,
          batchSize || 100
        );
        break;

      case 'member-only':
        // Push only member + barcode data (no profile/family)
        result = await pushMemberOnlyToPortal(batchSize || 100);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type. Use: single, batch, full, incremental, or member-only' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Push failed',
      },
      { status: 500 }
    );
  }
}
