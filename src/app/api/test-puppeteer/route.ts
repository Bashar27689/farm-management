import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  const puppeteerPath = path.join(
    process.cwd(),
    "node_modules",
    "puppeteer"
  );

  const packageJsonPath = path.join(
    puppeteerPath,
    "package.json"
  );

  return NextResponse.json({
    cwd: process.cwd(),

    puppeteerDirectoryExists:
      fs.existsSync(puppeteerPath),

    puppeteerPackageExists:
      fs.existsSync(packageJsonPath),

    puppeteerPackage:
      fs.existsSync(packageJsonPath)
        ? JSON.parse(
            fs.readFileSync(
              packageJsonPath,
              "utf8"
            )
          ).version
        : null,
  });
}