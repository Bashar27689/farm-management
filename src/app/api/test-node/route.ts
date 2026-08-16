// src/app/api/test-node/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  console.log("TEST NODE: route started");

  console.log(
    "TEST NODE: version",
    process.version
  );

  console.log(
    "TEST NODE: platform",
    process.platform
  );

  return NextResponse.json({
    success: true,
    node: process.version,
    platform: process.platform,
  });
}