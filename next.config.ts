import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
  // Turbopack is now default in Next.js 16
  // No need to specify --turbopack flag anymore
  turbopack: {
    // Advanced Turbopack configuration if needed
    // resolveAlias: {},
  },
  // Enable React Compiler for automatic memoization
  // Uncomment if you want to enable it (may increase build time)
  // reactCompiler: true,
  
  // Enable Cache Components for Partial Pre-Rendering
  // cacheComponents: true,
};

export default nextConfig;
