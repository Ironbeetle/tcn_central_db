// Types for Portal Sync API

export type SyncOperation = 'CREATE' | 'UPDATE' | 'UPSERT' | 'DELETE';
export type SyncModel = 'fnmember' | 'Profile' | 'Barcode' | 'Family';

export interface SyncItem {
  operation: SyncOperation;
  model: SyncModel;
  data?: Record<string, any>;
  id?: string;
}

export interface BatchSyncRequest {
  syncId: string;
  timestamp: string;
  source: 'master';
  items: SyncItem[];
}

export interface SyncResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  details?: string | Array<{ path: string[]; message: string }>;
}

export interface SyncStatusData {
  healthy: boolean;
  timestamp: string;
  database: {
    connected: boolean;
    schema: string;
  };
  stats: {
    members: {
      total: number;
      activated: number;
      pending: number;
      notActivated: number;
      deceased: number;
    };
    profiles: number;
    barcodes: number;
    families: number;
  };
  lastUpdated: {
    member: string;
    profile: string;
  };
}

export interface BatchSyncResult {
  syncId: string;
  processed: number;
  failed: number;
  total: number;
  excluded?: number;
  errors?: Array<{
    index: number;
    operation: SyncOperation;
    model: SyncModel;
    error: string;
  }>;
}

export interface PullPagination {
  hasMore: boolean;
  totalReturned: number;
  nextCursor?: string;
}

export interface PulledProfile {
  id: string;
  created: string;
  updated: string;
  gender: string | null;
  o_r_status: string;
  community: string;
  address: string;
  phone_number: string;
  email: string;
  image_url: string | null;
  fnmemberId: string;
  member: {
    id: string;
    t_number: string;
    name: string;
  };
}

export interface PulledFamily {
  id: string;
  created: string;
  updated: string;
  spouse_fname: string | null;
  spouse_lname: string | null;
  dependents: number;
  fnmemberId: string;
  member: {
    id: string;
    t_number: string;
    name: string;
  };
}

export interface PullResponse {
  profiles?: PulledProfile[];
  families?: PulledFamily[];
  pagination: PullPagination;
}

export interface MemberSyncData {
  id?: string;
  birthdate: string;
  first_name: string;
  last_name: string;
  t_number: string;
  deceased?: string | null;
  profile?: {
    gender?: string | null;
    o_r_status: string;
    community: string;
    address: string;
    phone_number: string;
    email: string;
    image_url?: string | null;
  };
  barcode?: {
    barcode: string;
    activated: number;
  };
  family?: {
    spouse_fname?: string | null;
    spouse_lname?: string | null;
    dependents: number;
  };
}

export interface SyncLog {
  id: string;
  timestamp: Date;
  direction: 'push' | 'pull';
  operation: string;
  model: SyncModel | 'batch';
  recordsProcessed: number;
  recordsFailed: number;
  status: 'success' | 'partial' | 'failed';
  details?: string;
  error?: string;
}
