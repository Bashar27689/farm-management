import { NextResponse } from "next/server";
import { Readable } from "stream";

export const runtime = "nodejs";

export async function GET() {
  try {
    console.log("=== STDIN OVERRIDE TEST ===");

    const fakeStdin = new Readable({
      read() {
        this.push(null);
      },
    });

    Object.defineProperty(
      process,
      "stdin",
      {
        configurable: true,
        enumerable: true,
        writable: false,
        value: fakeStdin,
      }
    );

    console.log(
      "process.stdin replaced"
    );

    console.log(
      "stdin readable:",
      process.stdin.readable
    );

    return NextResponse.json({
      success: true,
      message:
        "process.stdin override works",
      readable:
        process.stdin.readable,
    });

  } catch (error) {

    console.error(
      "=== STDIN OVERRIDE ERROR ==="
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