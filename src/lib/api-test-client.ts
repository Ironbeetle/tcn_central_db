// Helper for testing the API from different devices
export class APITestClient {
  private baseURL: string;
  private apiKey: string;

  constructor(baseURL: string, apiKey: string = 'test-api-key-12345') {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, params?: Record<string, string>) {
    const url = new URL(`${this.baseURL}/api/v1${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Test connection
  async testConnection() {
    try {
      const result = await this.request('/docs');
      console.log('✅ API Connection successful');
      return result;
    } catch (error) {
      console.error('❌ API Connection failed:', error);
      throw error;
    }
  }

  // Get all members
  async getMembers(params?: {
    page?: string;
    limit?: string;
    search?: string;
    community?: string;
    reserve_status?: string;
    include_deceased?: string;
  }) {
    return this.request('/members', params);
  }

  // Get member by ID
  async getMember(id: string) {
    return this.request(`/members/${id}`);
  }

  // Get statistics
  async getStats() {
    return this.request('/stats');
  }

  // Get communities
  async getCommunities() {
    return this.request('/communities');
  }
}

// Usage example for testing
export function createTestClient(serverIP: string, port: number = 3000) {
  const baseURL = `http://${serverIP}:${port}`;
  return new APITestClient(baseURL);
}