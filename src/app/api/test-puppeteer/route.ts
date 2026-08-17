import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    console.log("=== NODE STDIN TEST ===");

    console.log(
      "Node version:",
      process.version
    );

    console.log(
      "execPath:",
      process.execPath
    );

    console.log(
      "stdin fd:",
      process.stdin.fd
    );

    console.log(
      "stdin readable:",
      process.stdin.readable
    );

    return NextResponse.json({
      success: true,

      nodeVersion:
        process.version,

      execPath:
        process.execPath,

      stdin: {
        fd: process.stdin.fd,
        readable: process.stdin.readable,
        isTTY:
          process.stdin.isTTY ?? false,
      },
    });

  } catch (error) {

    console.error(
      "=== NODE STDIN TEST FAILED ==="
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