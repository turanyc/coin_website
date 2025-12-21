import type { NextConfig } from "next";

// GitHub Pages için base path
// Repo adınızı buraya yazın (örn: /coin_website)
const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const basePath = isGitHubPages ? (process.env.BASE_PATH || '/coin_website') : '';

const nextConfig: NextConfig = {
  reactCompiler: true,
  // GitHub Pages için base path
  basePath: basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  // Static export için (sadece GitHub Pages'te)
  output: isGitHubPages ? 'export' : undefined,
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
    // Static export için unoptimized
    unoptimized: isGitHubPages,
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  // TypeScript hatalarını build'de kontrol et
  typescript: {
    ignoreBuildErrors: false,
  },
  // Trailing slash GitHub Pages için önemli
  trailingSlash: isGitHubPages,
};

export default nextConfig;
