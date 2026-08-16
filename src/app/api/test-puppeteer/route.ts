// src/app/api/test-puppeteer/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  console.log("PUPPETEER TEST 1: route started");

  try {
    console.log("PUPPETEER TEST 2: importing puppeteer");

    const puppeteer = await import("puppeteer");

    console.log("PUPPETEER TEST 3: puppeteer imported");

    console.log(
      "PUPPETEER TEST 4: executable path",
      puppeteer.default.executablePath()
    );

    console.log("PUPPETEER TEST 5: launching browser");

    const browser = await puppeteer.default.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    console.log("PUPPETEER TEST 6: browser launched");

    const page = await browser.newPage();

    console.log("PUPPETEER TEST 7: page created");

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body>
          <h1>PDF Test</h1>
          <p>Hello from Hostinger</p>
        </body>
      </html>
    `);

    console.log("PUPPETEER TEST 8: content loaded");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    console.log(
      "PUPPETEER TEST 9: PDF generated",
      pdf.length
    );

    await browser.close();

    console.log("PUPPETEER TEST 10: browser closed");

    return new NextResponse(
      new Uint8Array(pdf),
      {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition":
            'inline; filename="test.pdf"',
          "Content-Length":
            String(pdf.length),
        },
      }
    );

  } catch (error) {

    console.error(
      "PUPPETEER TEST ERROR:",
      error
    );

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