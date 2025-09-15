/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize image loading to reduce aborted requests
  images: {
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['localhost','deepnex-fashionex.onrender.com', '127.0.0.1'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'deepnex-fashionex.onrender.com',
        pathname: '/**',
      },
    ],
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Optimize static asset loading
   experimental: {
     optimizeCss: true,
     optimizeServerReact: true,
   },
   // Proxy configuration for API requests
   async rewrites() {
     return [
       {
         source: '/uploads/:path*',
         destination: 'http://localhost:5000/uploads/:path*',
       },
       {
         source: '/api/:path*',
         destination: 'http://localhost:5000/api/:path*',
       },
     ];
   },
};


export default nextConfig;
