import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  const cachePath = path.join(
    process.cwd(),
    ".puppeteer-cache"
  );

  let files: string[] = [];

  try {
    files = fs.readdirSync(
      cachePath,
      {
        recursive: true,
      }
    ) as string[];
  } catch (error) {
    return NextResponse.json({
      success: false,
      cachePath,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }

  return NextResponse.json({
    success: true,
    cachePath,
    files,
  });
}