import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  serverExternalPackages: [
    "puppeteer",
    "puppeteer-core",
    "bcryptjs",
    "pdf-parse",
    "xlsx",
    "sharp",
  ],
};

export default nextConfig;