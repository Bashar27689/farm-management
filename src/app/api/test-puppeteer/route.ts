import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,

      nodeVersion:
        process.version,

      nodeVersions:
        process.versions,

      platform:
        process.platform,

      architecture:
        process.arch,

      cwd:
        process.cwd(),

      execPath:
        process.execPath,
    });

  } catch (error) {

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}