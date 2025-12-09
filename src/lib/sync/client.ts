/**
 * Portal Sync Client
 * 
 * Client library for syncing data between Master Database and TCN Member Portal
 */

import type {
  SyncResponse,
  SyncStatusData,
  BatchSyncRequest,
  BatchSyncResult,
  PullResponse,
  MemberSyncData,
  SyncItem,
} from './types';

const getConfig = () => {
  const apiKey = process.env.PORTAL_API_KEY;
  const apiUrl = process.env.PORTAL_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error('Portal sync not configured. Set PORTAL_API_KEY and PORTAL_API_URL environment variables.');
  }

  return { apiKey, apiUrl };
};

/**
 * Make authenticated request to Portal API
 */
async function portalFetch<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: any
): Promise<SyncResponse<T>> {
  const { apiKey, apiUrl } = getConfig();

  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        details: data.details,
      };
    }

    return data as SyncResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ==================== STATUS ====================

/**
 * Check Portal API health and get statistics
 */
export async function getPortalStatus(): Promise<SyncResponse<SyncStatusData>> {
  return portalFetch<SyncStatusData>('/status', 'GET');
}

// ==================== PUSH TO PORTAL (Master → Portal) ====================

/**
 * Create a new member on the portal
 */
export async function pushMember(member: MemberSyncData): Promise<SyncResponse<any>> {
  return portalFetch('/members', 'POST', member);
}

/**
 * Update an existing member on the portal
 */
export async function updatePortalMember(
  id: string,
  updates: Partial<MemberSyncData>
): Promise<SyncResponse<any>> {
  return portalFetch('/members', 'POST', { id, ...updates });
}

/**
 * Mark a member as deceased on the portal
 */
export async function markMemberDeceased(
  identifier: { memberId?: string; t_number?: string },
  deceasedDate: string
): Promise<SyncResponse<any>> {
  return portalFetch('/members', 'DELETE', {
    ...identifier,
    deceasedDate,
  });
}

/**
 * Batch sync multiple operations to portal
 */
export async function batchSyncToPortal(
  items: SyncItem[]
): Promise<SyncResponse<BatchSyncResult>> {
  const request: BatchSyncRequest = {
    syncId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    source: 'master',
    items,
  };

  return portalFetch<BatchSyncResult>('/batch', 'POST', request);
}

// ==================== PULL FROM PORTAL (Portal → Master) ====================

export interface PullOptions {
  models?: ('Profile' | 'Family')[];
  since?: Date;
  limit?: number;
  cursor?: string;
}

/**
 * Pull updated data from portal
 */
export async function pullFromPortal(
  options: PullOptions = {}
): Promise<SyncResponse<PullResponse>> {
  const params = new URLSearchParams();

  if (options.models && options.models.length > 0) {
    params.append('models', options.models.join(','));
  }
  if (options.since) {
    params.append('since', options.since.toISOString());
  }
  if (options.limit) {
    params.append('limit', options.limit.toString());
  }
  if (options.cursor) {
    params.append('cursor', options.cursor);
  }

  const queryString = params.toString();
  const endpoint = queryString ? `/pull?${queryString}` : '/pull';

  return portalFetch<PullResponse>(endpoint, 'GET');
}

/**
 * Pull all profile updates since a specific date
 */
export async function pullProfileUpdates(since?: Date): Promise<SyncResponse<PullResponse>> {
  return pullFromPortal({ models: ['Profile'], since, limit: 500 });
}

/**
 * Pull all family updates since a specific date
 */
export async function pullFamilyUpdates(since?: Date): Promise<SyncResponse<PullResponse>> {
  return pullFromPortal({ models: ['Family'], since, limit: 500 });
}

/**
 * Pull all member-editable data (profiles and families) since a specific date
 */
export async function pullAllMemberData(since?: Date): Promise<SyncResponse<PullResponse>> {
  return pullFromPortal({ models: ['Profile', 'Family'], since, limit: 500 });
}

// ==================== DELTA SYNC ====================

/**
 * Get members updated since a specific timestamp
 */
export async function getDeltaMembers(
  since: Date,
  limit: number = 100,
  cursor?: string
): Promise<SyncResponse<any>> {
  const params = new URLSearchParams({
    since: since.toISOString(),
    limit: limit.toString(),
  });
  if (cursor) {
    params.append('cursor', cursor);
  }

  return portalFetch(`/members?${params}`, 'GET');
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if sync is configured
 */
export function isSyncConfigured(): boolean {
  return !!(process.env.PORTAL_API_KEY && process.env.PORTAL_API_URL);
}

/**
 * Test connection to portal
 */
export async function testConnection(): Promise<{
  connected: boolean;
  message: string;
  portalStats?: SyncStatusData;
}> {
  if (!isSyncConfigured()) {
    return {
      connected: false,
      message: 'Sync not configured. Set PORTAL_API_KEY and PORTAL_API_URL.',
    };
  }

  const result = await getPortalStatus();

  if (result.success && result.data) {
    return {
      connected: true,
      message: 'Connected to portal successfully',
      portalStats: result.data,
    };
  }

  return {
    connected: false,
    message: result.error || 'Failed to connect to portal',
  };
}
