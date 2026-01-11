/**
 * Governance Sync Proxy API Route
 * 
 * POST /api/sync/governance - Proxy governance sync to VPS
 * 
 * This route proxies the governance sync request to the VPS,
 * keeping the API key server-side and avoiding CORS issues.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const vpsApiUrl = process.env.PORTAL_API_URL?.replace('/api/sync', '') || process.env.NEXT_PUBLIC_VPS_API_URL;
    const apiKey = process.env.PORTAL_API_KEY || process.env.NEXT_PUBLIC_VPS_API_KEY;

    if (!vpsApiUrl || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'VPS sync not configured' },
        { status: 500 }
      );
    }

    // Forward the request to VPS
    const response = await fetch(`${vpsApiUrl}/api/v1/governance/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Governance sync proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sync to VPS' 
      },
      { status: 500 }
    );
  }
}
