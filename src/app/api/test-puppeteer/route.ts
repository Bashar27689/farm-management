import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export const runtime = "nodejs";

export async function GET() {
  let browser = null;

  try {
    console.log("=== PUPPETEER TEST START ===");

    console.log(
      "Puppeteer executable:",
      puppeteer.executablePath()
    );

    browser = await puppeteer.launch({
      headless: true,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    console.log(
      "=== BROWSER LAUNCHED ==="
    );

    const page =
      await browser.newPage();

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
      "=== HTML LOADED ==="
    );

    const pdf =
      await page.pdf({
        format: "A4",
        printBackground: true,
      });

    console.log(
      "=== PDF GENERATED ===",
      pdf.length
    );

    return new NextResponse(
      Buffer.from(pdf),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            'inline; filename="test.pdf"',
        },
      }
    );

  } catch (error) {

    console.error(
      "=== PUPPETEER ERROR ==="
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

      } catch {}

    }

  }
}