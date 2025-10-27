// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Don’t block production builds because of ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don’t block production builds because of TS type errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
