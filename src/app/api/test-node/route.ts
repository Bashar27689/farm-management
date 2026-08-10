import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    node: process.version,
    platform: process.platform,
    stdin: {
      fd: process.stdin.fd,
      isTTY: process.stdin.isTTY,
    },
    message: "Node.js is working",
  });
}