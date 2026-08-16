import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  console.log("TEST NODE: route started");

  console.log(
    "TEST NODE: version",
    process.version
  );

  console.log(
    "TEST NODE: stdin",
    process.stdin
      ? "exists"
      : "missing"
  );

  console.log(
    "TEST NODE: stdout",
    process.stdout
      ? "exists"
      : "missing"
  );

  return NextResponse.json({
    success: true,
    node: process.version,
    stdin: !!process.stdin,
    stdout: !!process.stdout,
  });
}