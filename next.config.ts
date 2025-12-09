/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow access from any host in development
  experimental: {
    serverActions: {
      allowedOrigins: process.env.NODE_ENV === 'development' ? ['*'] : undefined,
    },
  },
  
  // Custom server configuration for local network
  async rewrites() {
    return [];
  },
  
  // Security headers (relaxed for development)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' ? '*' : 'https://your-domain.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-API-Key',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;