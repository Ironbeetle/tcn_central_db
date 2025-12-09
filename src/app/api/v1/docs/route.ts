import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware, createAPIResponse } from '@/lib/api-middleware';

async function handleDocs(req: NextRequest) {
  if (req.method !== 'GET') {
    return NextResponse.json(
      createAPIResponse(null, 'Method not allowed'),
      { status: 405 }
    );
  }

  const apiDocs = {
    title: "TCN Central Database API",
    version: "1.0.0",
    description: "API for managing TCN First Nation member database and profiles",
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4001",
    authentication: {
      type: "API Key",
      header: "x-api-key",
      description: "Include your API key in the x-api-key header"
    },
    endpoints: {
      "GET /api/v1/stats": {
        description: "Get database statistics and member counts",
        parameters: "None",
        response: "Statistics object with member counts, age distribution, community breakdown"
      },
      "GET /api/v1/communities": {
        description: "Get list of communities with member counts",
        parameters: "None",
        response: "Array of communities with name and member_count"
      },
      "GET /api/v1/members": {
        description: "Get paginated list of members with filtering",
        parameters: {
          page: "Page number (default: 1)",
          limit: "Items per page (default: 50, max: 1000)",
          search: "Search by name or T-number",
          community: "Filter by community name",
          reserve_status: "Filter by 'on_reserve' or 'off_reserve'",
          include_deceased: "Include deceased members (default: false)"
        },
        response: "Paginated array of member objects with metadata"
      },
      "GET /api/v1/members/{id}": {
        description: "Get single member by ID",
        parameters: {
          id: "Member ID (required)"
        },
        response: "Single member object with full details"
      },
      "PATCH /api/v1/members/{id}": {
        description: "Update member profile information (remote updates allowed for profile fields only)",
        parameters: {
          id: "Member ID (required)"
        },
        body: {
          gender: "Member gender (optional)",
          email: "Email address (optional)",
          phone_number: "Phone number (optional)",
          address: "Physical address (optional)",
          community: "Community name (optional)",
          reserve_status: "'on_reserve' or 'off_reserve' (optional)",
          image_url: "Profile image URL (optional)"
        },
        response: "Updated member object"
      },
      "PUT /api/v1/members/{id}": {
        description: "Update member profile information (same as PATCH)",
        parameters: "Same as PATCH",
        response: "Updated member object"
      }
    },
    response_format: {
      success: "boolean - indicates if request was successful",
      data: "object|array - the requested data",
      error: "string - error message if success is false",
      meta: {
        timestamp: "ISO timestamp of response",
        version: "API version",
        environment: "development|production",
        pagination: "pagination metadata for list endpoints"
      }
    },
    error_codes: {
      400: "Bad Request - Invalid parameters or validation error",
      401: "Unauthorized - Missing or invalid API key", 
      403: "Forbidden - Network access denied",
      404: "Not Found - Resource not found",
      405: "Method Not Allowed - HTTP method not supported",
      409: "Conflict - Resource already exists (e.g., duplicate T-number)",
      429: "Too Many Requests - Rate limit exceeded",
      500: "Internal Server Error - Server error"
    },
    examples: {
      "List members": "GET /api/v1/members?page=1&limit=10&search=bear",
      "Get member": "GET /api/v1/members/cm123456789",
      "Update profile": "PATCH /api/v1/members/cm123456789 with JSON body: {\"community\": \"Thompson\", \"phone_number\": \"306-555-1234\"}"
    }
  };

  return NextResponse.json(createAPIResponse(apiDocs));
}

export const GET = withAPIMiddleware(handleDocs);