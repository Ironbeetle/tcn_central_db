import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedRequest, validateAPIKey, checkRateLimit, API_CONFIG } from './api-config';
import type { APIResponse } from './api-types';

export function createAPIResponse<T>(
  data?: T, 
  error?: string, 
  meta?: any
): APIResponse<T> {
  return {
    success: !error,
    data: error ? undefined : data,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
      environment: API_CONFIG.IS_DEVELOPMENT ? 'development' : 'production',
      ...meta,
    },
  };
}

export function withAPIMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      // CORS headers - expanded to support write operations
      const corsHeaders = {
        'Access-Control-Allow-Origin': API_CONFIG.ALLOWED_ORIGINS,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true',
      };

      // Handle preflight
      if (req.method === 'OPTIONS') {
        return new NextResponse(null, { status: 200, headers: corsHeaders });
      }

      // Network authorization check
      if (!isAuthorizedRequest(req)) {
        const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        console.log(`Unauthorized access attempt from: ${clientIP}`);
        return NextResponse.json(
          createAPIResponse(null, 'Access denied: Not authorized for this network'),
          { status: 403, headers: corsHeaders }
        );
      }

      // API key validation
      const apiKeyValid = validateAPIKey(req);
      if (!apiKeyValid) {
        return NextResponse.json(
          createAPIResponse(null, 'Invalid or missing API key'),
          { status: 401, headers: corsHeaders }
        );
      }

      // Rate limit per client IP (tighter for write operations)
      const clientId = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      if (!checkRateLimit(clientId)) {
        return NextResponse.json(
          createAPIResponse(null, 'Rate limit exceeded'),
          { status: 429, headers: corsHeaders }
        );
      }

      if (API_CONFIG.IS_DEVELOPMENT) {
        console.log(`API Access: ${req.method} ${req.url} from ${clientId}`);
      }

      const response = await handler(req);
      Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
      return response;
    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json(
        createAPIResponse(null, 'Internal server error'),
        { status: 500 }
      );
    }
  };
}