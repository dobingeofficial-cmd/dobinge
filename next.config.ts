import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Core compiler optimization variables */
  reactStrictMode: true,
  
  // Modern rewrites structure replacing the legacy system proxy keys
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "https://api.themoviedb.org/3/:path*", 
      },
    ];
  },

  // Premium cross-origin resource isolation rules for safe image caching
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // 🎯 HARD FIX: Whitelisting our Cloudflare Edge Network for Next/Image optimization
      {
        protocol: "https",
        hostname: "flat-flower-ffa1dobinge-engine.danishkhan4126.workers.dev",
      },
    ],
  },
};

export default nextConfig;