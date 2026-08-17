import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    console.log("=== NODE STDIN TEST ===");

    const result = {
      stdinExists: !!process.stdin,
      stdinReadable: process.stdin.readable,
      stdinDestroyed: process.stdin.destroyed,
      stdinFd:
        typeof process.stdin.fd === "number"
          ? process.stdin.fd
          : null,
    };

    console.log(
      "STDIN:",
      result
    );

    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (error) {

    console.error(
      "STDIN TEST FAILED:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : String(error),

        stack:
          error instanceof Error
            ? error.stack
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}