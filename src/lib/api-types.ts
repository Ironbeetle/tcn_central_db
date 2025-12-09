// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    timestamp: string;
    version: string;
    pagination?: PaginationMeta;
    total_count?: number;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total_pages: number;
  total_count: number;
  has_next: boolean;
  has_previous: boolean;
}

// Formatted Member Data for API
export interface APIMemberData {
  id: string;
  personal_info: {
    first_name: string;
    last_name: string;
    birthdate: string; // ISO date string
    age: number;
    t_number: string;
    gender?: string;
    deceased: boolean;
    activated: 'NONE' | 'PENDING' | 'ACTIVATED';
  };
  contact_info: {
    email: string;
    phone_number: string;
    address: string;
    community: string;
    reserve_status: 'on_reserve' | 'off_reserve';
    image_url?: string;
  };
  family_info: {
    spouse?: {
      first_name?: string;
      last_name?: string;
    };
    dependents: number;
  };
  barcodes: Array<{
    id: string;
    barcode: string;
    status: 'active' | 'available';
    assigned_date: string;
  }>;
  timestamps: {
    created: string;
    updated: string;
  };
}

export interface APIStatsData {
  total_members: number;
  active_members: number;
  deceased_members: number;
  on_reserve_count: number;
  off_reserve_count: number;
  communities: Array<{
    name: string;
    member_count: number;
    percentage: number;
  }>;
  age_distribution: Array<{
    age_range: string;
    count: number;
    percentage: number;
  }>;
  recent_additions: number; // Last 30 days
  total_barcodes_assigned: number;
  available_barcodes: number;
  last_updated: string;
}