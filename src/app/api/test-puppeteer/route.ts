import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  let browser = null;

  try {
    console.log("=== PUPPETEER TEST START ===");

    const puppeteer = await import("puppeteer");

    console.log("Puppeteer loaded");

    const executablePath =
      puppeteer.default.executablePath();

    console.log(
      "Puppeteer executable path:",
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
          "--disable-software-rasterizer",
          "--no-first-run",
          "--no-default-browser-check",
        ],
      });

    console.log(
      "Chromium launched successfully"
    );

    const page =
      await browser.newPage();

    await page.setContent(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>Puppeteer Test</title>
        </head>

        <body>
          <h1>اختبار Puppeteer</h1>
          <p>Chrome يعمل بنجاح على Hostinger.</p>
        </body>
      </html>
    `);

    console.log("Page loaded");

    const pdf =
      await page.pdf({
        format: "A4",
        printBackground: true,
      });

    console.log(
      "PDF generated:",
      pdf.length
    );

return NextResponse.json({
  success: true,

  executablePath,

  pdfSize:
    pdf.length,

  message:
    "Puppeteer و Chromium يعملان بنجاح",
});

  } catch (error) {

    console.error(
      "=== PUPPETEER TEST FAILED ==="
    );

    console.error(error);

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

  }
}