import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/watchlist", destination: "/", permanent: true },
      { source: "/funds", destination: "/", permanent: true },
      { source: "/research", destination: "/", permanent: true },
      { source: "/messages", destination: "/", permanent: true },
      { source: "/settings", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
