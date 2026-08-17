import { NextResponse } from "next/server";
import fs from "fs";

export const runtime = "nodejs";

export async function GET() {
  try {
    console.log("=== STDIN FD TEST ===");

    const result: Record<string, unknown> = {
      nodeVersion: process.version,
      execPath: process.execPath,
      pid: process.pid,
    };

    // Check Linux file descriptor 0 directly
    try {
      result.fd0 = fs.readlinkSync(
        `/proc/${process.pid}/fd/0`
      );
    } catch (error) {
      result.fd0Error =
        error instanceof Error
          ? error.message
          : String(error);
    }

    // Check file descriptor 1
    try {
      result.fd1 = fs.readlinkSync(
        `/proc/${process.pid}/fd/1`
      );
    } catch (error) {
      result.fd1Error =
        error instanceof Error
          ? error.message
          : String(error);
    }

    // Check file descriptor 2
    try {
      result.fd2 = fs.readlinkSync(
        `/proc/${process.pid}/fd/2`
      );
    } catch (error) {
      result.fd2Error =
        error instanceof Error
          ? error.message
          : String(error);
    }

    console.log(
      "FD information:",
      result
    );

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {

    console.error(
      "=== FD TEST ERROR ==="
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