// Next.js configuration file
// Optimized for dashboard stability and performance
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  // Environment variables accessible in browser
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1',
  },
  // Headers for API compatibility
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  // Proxy API calls to the API server
  // Inside Docker: use service name (api-server)
  // Outside Docker: use localhost
  async rewrites() {
    const apiHost = process.env.NODE_ENV === 'production' 
      ? 'http://api-server:8080'  // Docker service name
      : 'http://localhost:8080';   // Local development
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiHost}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;