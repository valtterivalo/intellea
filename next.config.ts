/**
 * @fileoverview Next.js configuration.
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@intellea/graph-renderer', '@intellea/graph-schema'],
};

export default nextConfig;
