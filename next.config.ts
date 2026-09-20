import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images:{
    remotePatterns:[
      {
      protocol:"https",
      hostname:"images.clerk.com",
      }
    ],
  }
};

export default nextConfig;
