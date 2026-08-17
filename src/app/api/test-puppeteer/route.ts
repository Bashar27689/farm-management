import { NextResponse } from "next/server";
import { Readable } from "node:stream";

export const runtime = "nodejs";

export async function GET() {
  let browser = null;

  const originalDescriptor =
    Object.getOwnPropertyDescriptor(
      process,
      "stdin"
    );

  try {
    console.log(
      "=== PUPPETEER STDIN WORKAROUND TEST ==="
    );

    // Replace Hostinger socket-based stdin
    // with a harmless readable stream.
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
      "Fake stdin installed"
    );

    console.log(
      "stdin readable:",
      process.stdin.readable
    );

    // IMPORTANT:
    // Puppeteer is imported only AFTER
    // replacing process.stdin.
    const puppeteer =
      await import("puppeteer");

    console.log(
      "Puppeteer loaded"
    );

    const executablePath =
      puppeteer.default.executablePath();

    console.log(
      "Executable path:",
      executablePath
    );

    browser =
      await puppeteer.default.launch({
        headless: true,

        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });

    console.log(
      "Browser launched successfully"
    );

    const page =
      await browser.newPage();

    console.log(
      "Page created successfully"
    );

    await page.setContent(`
      <!DOCTYPE html>

      <html
        lang="ar"
        dir="rtl"
      >

      <head>

        <meta charset="UTF-8">

        <style>

          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            padding: 40px;
          }

        </style>

      </head>

      <body>

        <h1>
          اختبار Puppeteer
        </h1>

        <p>
          مرحباً من Hostinger
        </p>

      </body>

      </html>
    `);

    console.log(
      "HTML loaded successfully"
    );

    const pdf =
      await page.pdf({
        format: "A4",
        printBackground: true,
      });

    console.log(
      "PDF generated successfully:",
      pdf.length,
      "bytes"
    );

    return new NextResponse(
      Buffer.from(pdf),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            'inline; filename="puppeteer-test.pdf"',
        },
      }
    );

  } catch (error) {

    console.error(
      "=== PUPPETEER TEST ERROR ==="
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

  } finally {

    if (browser) {

      try {
        await browser.close();

        console.log(
          "Browser closed"
        );

      } catch (error) {

        console.error(
          "Browser close error:",
          error
        );
      }
    }

    // Restore the original stdin descriptor
    // after this diagnostic request.
    if (originalDescriptor) {

      try {

        Object.defineProperty(
          process,
          "stdin",
          originalDescriptor
        );

      } catch (error) {

        console.error(
          "stdin restore error:",
          error
        );
      }
    }
  }
}