import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  serverExternalPackages: [
    "bcryptjs",
    "pdf-parse",
    "xlsx",
    "sharp",
  ],
};

export default nextConfig;