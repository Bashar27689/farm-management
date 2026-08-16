import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  console.log("STEP 1");

  const stdin = process.stdin;

  console.log("STEP 2");

  return NextResponse.json({
    success: true,
    node: process.version,
    stdinExists: !!stdin,
  });
}