import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    console.log("=== NODE PROCESS TEST ===");

    const result = {
      nodeVersion: process.version,

      execPath: process.execPath,

      platform: process.platform,

      pid: process.pid,

      stdinProperty:
        Object.prototype.hasOwnProperty.call(
          process,
          "stdin"
        ),
    };

    console.log(
      "Process information:",
      result
    );

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {

    console.error(
      "=== PROCESS TEST ERROR ==="
    );

    console.error(error);

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