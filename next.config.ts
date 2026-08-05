import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 serverExternalPackages: ["bcryptjs", "pdf-parse", "xlsx", "sharp"], 
  experimental: {
  },
};

export default nextConfig;