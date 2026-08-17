import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    console.log("=== STDIN TEST START ===");

    console.log(
      "stdin exists:",
      !!process.stdin
    );

    console.log(
      "stdin fd:",
      process.stdin.fd
    );

    console.log(
      "stdin isTTY:",
      process.stdin.isTTY
    );

    console.log(
      "stdin readable:",
      process.stdin.readable
    );

    return NextResponse.json({
      success: true,
      stdin: {
        exists: !!process.stdin,
        fd: process.stdin.fd,
        isTTY: process.stdin.isTTY ?? false,
        readable: process.stdin.readable,
      },
    });

  } catch (error) {

    console.error(
      "=== STDIN TEST ERROR ==="
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