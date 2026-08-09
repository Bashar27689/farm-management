import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  serverExternalPackages: [
    "puppeteer",
    "bcrypt",
    "bcryptjs",
    "@prisma/client",
    "@react-pdf/renderer",
    "pdf-parse",
    "xlsx",
    "sharp",
  ],
};

export default nextConfig;