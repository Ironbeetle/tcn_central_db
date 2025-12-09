// Simplified API Configuration for local network testing
export const API_CONFIG = {
  // Environment settings
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  ENABLE_LOCAL_NETWORK: process.env.ENABLE_LOCAL_NETWORK === 'true',
  REQUIRE_VPN: process.env.REQUIRE_VPN !== 'false', // Default to true, set to false for local testing
  
  // Local Network Configuration
  LOCAL_NETWORK_SUBNETS: process.env.LOCAL_NETWORK_SUBNETS?.split(',') || [
    '192.168.0.0/16',  // Most common home networks
    '10.0.0.0/8',      // Private networks
    '172.16.0.0/12',   // Docker networks
    '127.0.0.0/8'      // Localhost
  ],
  
  // VPN Server Configuration (for production)
  ALLOWED_VPN_IPS: process.env.ALLOWED_VPN_IPS?.split(',') || [],
  VPN_SUBNET: process.env.VPN_SUBNET || '10.0.0.0/8',
  
  // API Security
  API_KEY: process.env.API_SECRET_KEY || 'test-api-key-12345',
  API_VERSION: 'v1',
  MAX_REQUESTS_PER_MINUTE: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for testing
  
  // Data Limits
  MAX_MEMBERS_PER_REQUEST: 1000,
  DEFAULT_PAGE_SIZE: 50,
  
  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || '*',
};

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Simplified IP checking for local network testing
function isLocalNetwork(ip: string): boolean {
  // Always allow localhost
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip === 'unknown') {
    return true;
  }
  
  // Check against local network subnets
  return API_CONFIG.LOCAL_NETWORK_SUBNETS.some(subnet => {
    return isIPInSubnet(ip, subnet);
  });
}

export function isAuthorizedRequest(req: Request): boolean {
  // In development with local network enabled, be more permissive
  if (API_CONFIG.IS_DEVELOPMENT && API_CONFIG.ENABLE_LOCAL_NETWORK) {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const remoteAddr = forwardedFor?.split(',')[0] || realIP || 'unknown';
    
    console.log(`API Access from: ${remoteAddr} (Development Mode)`);
    
    // Allow local network access
    if (isLocalNetwork(remoteAddr)) {
      return true;
    }
  }
  
  // Production VPN check (only if VPN is required)
  if (API_CONFIG.REQUIRE_VPN) {
    return isVPNRequest(req);
  }
  
  // If VPN not required, allow all (useful for cloud deployment without VPN)
  return true;
}

export function isVPNRequest(req: Request): boolean {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const remoteAddr = forwardedFor?.split(',')[0] || realIP || 'unknown';
  
  // Check if IP is in allowed VPN range
  return API_CONFIG.ALLOWED_VPN_IPS.includes(remoteAddr) || 
         isIPInSubnet(remoteAddr, API_CONFIG.VPN_SUBNET);
}

export function isIPInSubnet(ip: string, subnet: string): boolean {
  try {
    const [subnetIP, subnetMask] = subnet.split('/');
    const mask = parseInt(subnetMask);
    
    // Simple subnet check for common cases
    if (mask === 16 && ip.startsWith(subnetIP.split('.').slice(0, 2).join('.'))) {
      return true;
    }
    if (mask === 8 && ip.startsWith(subnetIP.split('.')[0])) {
      return true;
    }
    if (mask === 24 && ip.startsWith(subnetIP.split('.').slice(0, 3).join('.'))) {
      return true;
    }
    
    // For localhost
    if (subnet === '127.0.0.0/8' && ip.startsWith('127.')) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking subnet:', error);
    return false;
  }
}

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const key = identifier;
  const limit = rateLimitStore.get(key);
  
  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute
    return true;
  }
  
  if (limit.count >= API_CONFIG.MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  limit.count++;
  return true;
}

export function validateAPIKey(req: Request): boolean {
  const apiKey = req.headers.get('x-api-key') || 
                 req.headers.get('authorization')?.replace('Bearer ', '') ||
                 req.headers.get('authorization')?.replace('bearer ', '');
  
  // In development, be more flexible with API key
  if (API_CONFIG.IS_DEVELOPMENT) {
    // Allow if no key provided OR if key matches expected values
    return !apiKey || apiKey === API_CONFIG.API_KEY || apiKey === 'test' || apiKey === 'dev';
  }
  
  return apiKey === API_CONFIG.API_KEY;
}