import { NextResponse } from "next/server";
import fs from "fs";

export const runtime = "nodejs";

export async function GET() {
  const paths = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium-browser-stable",
  ];

  const results = paths.map((path) => ({
    path,
    exists: fs.existsSync(path),
  }));

  return NextResponse.json({
    success: true,
    node: process.version,
    browsers: results,
  });
}