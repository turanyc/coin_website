import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'coin-images.coingecko.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        pathname: '/**',
      },
    ],
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  // TypeScript hatalarını build'de kontrol et
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
