import fs from "fs";
import path from "path";


// =====================================================
// Types
// =====================================================

type InvoicePdfInput = {
  invoice: any;
};


// =====================================================
// Image → Base64
// =====================================================

function getImageBase64(
  filePath: string
): string {

  try {

    const absolutePath =
      path.join(
        process.cwd(),
        filePath
      );


    if (
      !fs.existsSync(
        absolutePath
      )
    ) {

      console.warn(
        "PDF Asset not found:",
        absolutePath
      );

      return "";
    }


    const buffer =
      fs.readFileSync(
        absolutePath
      );


    const extension =
      path
        .extname(filePath)
        .replace(".", "")
        .toLowerCase();


    let mimeType =
      "image/png";


    if (
      extension === "jpg" ||
      extension === "jpeg"
    ) {

      mimeType =
        "image/jpeg";

    } else if (
      extension === "webp"
    ) {

      mimeType =
        "image/webp";

    } else if (
      extension === "svg"
    ) {

      mimeType =
        "image/svg+xml";

    }


    return (
      `data:${mimeType};base64,` +
      buffer.toString("base64")
    );

  } catch (error) {

    console.error(
      "PDF Image Error:",
      error
    );

    return "";
  }
}


// =====================================================
// Cairo Font → Base64
// =====================================================

function getFontBase64(): string {

  try {

    const fontPath =
      path.join(
        process.cwd(),
        "public/fonts/Cairo-Regular.ttf"
      );


    if (
      !fs.existsSync(
        fontPath
      )
    ) {

      console.warn(
        "PDF Font not found:",
        fontPath
      );

      return "";
    }


    const font =
      fs.readFileSync(
        fontPath
      );


    return font.toString(
      "base64"
    );

  } catch (error) {

    console.error(
      "PDF Font Error:",
      error
    );

    return "";
  }
}


// =====================================================
// Generate Invoice HTML
// =====================================================

function generateInvoiceHtml(
  invoice: any
): string {

  // ===================================================
  // Parse Invoice Items
  // ===================================================

  let items: any = {};


  try {

    items =
      typeof invoice.items === "string"
        ? JSON.parse(invoice.items)
        : invoice.items;

  } catch {

    items = {
      shopName: "بيض",
      trayCount: 0,
      pricePerTray: 0,
    };

  }


  if (
    !items ||
    typeof items !== "object"
  ) {

    items = {
      shopName: "بيض",
      trayCount: 0,
      pricePerTray: 0,
    };

  }


  // ===================================================
  // Calculate Total
  // ===================================================

  const trayCount =
    Number(
      items.trayCount || 0
    );


  const pricePerTray =
    Number(
      items.pricePerTray || 0
    );


  const total =
    trayCount *
    pricePerTray;


  // ===================================================
  // Assets
  // ===================================================

  const logo =
    getImageBase64(
      "public/assets/farm Logo.png"
    );


  const signature =
    getImageBase64(
      "public/assets/signature.png"
    );


  const font =
    getFontBase64();


  // ===================================================
  // Invoice Date
  // ===================================================

  const date =
    new Date(
      invoice.date
    ).toLocaleDateString(
      "ar-EG",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );


  // ===================================================
  // Generate HTML
  // ===================================================

  return `
<!DOCTYPE html>

<html
  lang="ar"
  dir="rtl"
>

<head>

<meta charset="UTF-8">

<style>

@font-face {

  font-family: "Cairo";

  src:
    url(
      data:font/ttf;base64,${font}
    );

  font-weight: normal;

  font-style: normal;

}

* {

  box-sizing: border-box;

}

html,
body {

  margin: 0;

  padding: 0;

}

body {

  font-family:
    "Cairo",
    Arial,
    sans-serif;

  direction: rtl;

  padding: 5px;

  color: #333;

  background: white;

}

.header {

  display: flex;

  justify-content:
    space-between;

  align-items:
    center;

  border-bottom:
    2px solid #1B5E20;

  padding-bottom:
    20px;

}

.logo {

  width:
    100px;

  height:
    100px;

  object-fit:
    contain;

}

.title {

  text-align:
    right;

}

.title h1 {

  margin:
    0;

  color:
    #1B5E20;

  font-size:
    28px;

}

.info {

  display:
    flex;

  justify-content:
    space-between;

  margin-top:
    20px;

}

.section {

  margin-top:
    25px;

  font-size:
    20px;

  font-weight:
    bold;

  color:
    #1B5E20;

}

.customer {

  background:
    #f5f5f5;

  padding:
    15px;

  margin-top:
    10px;

}

.customer div {

  margin-bottom:
    5px;

}

table {

  width:
    100%;

  border-collapse:
    collapse;

  margin-top:
    20px;

}

th {

  background:
    #1B5E20;

  color:
    white;

  padding:
    10px;

}

td {

  padding:
    10px;

  border-bottom:
    1px solid #ddd;

  text-align:
    center;

}

.total {

  margin-top:
    30px;

  font-size:
    22px;

  font-weight:
    bold;

  color:
    #1B5E20;

  text-align:
    left;

}

.signature {

  margin-top:
    70px;

  text-align:
    center;

}

.signature img {

  max-width:
    100%;

  max-height:
    180px;

  object-fit:
    contain;

}

</style>

</head>


<body>


<div class="header">


  <div>

    ${
      logo
        ? `
          <img
            class="logo"
            src="${logo}"
          >
        `
        : ""
    }

  </div>


  <div class="title">

    <h1>
      فاتورة مبيعات
    </h1>

  </div>


</div>


<div class="info">


  <div>

    التاريخ:
    ${date}

  </div>


  <div>

    رقم الفاتورة:
    ${invoice.number}

  </div>


</div>


<div class="section">

  بيانات العميل

</div>


<div class="customer">


  <div>

    الاسم:
    ${invoice.customer?.name ?? ""}

  </div>


  <div>

    الهاتف:
    ${invoice.customer?.phone ?? ""}

  </div>


</div>


<div class="section">

  تفاصيل الفاتورة

</div>


<table>

  <thead>

    <tr>

      <th>
        اسم الدكان
      </th>

      <th>
        الكمية
      </th>

      <th>
        السعر
      </th>

      <th>
        المجموع
      </th>

    </tr>

  </thead>


  <tbody>

    <tr>

      <td>
        ${items.shopName ?? "بيض"}
      </td>

      <td>
        ${items.trayCount ?? 0}
      </td>

      <td>
        ${items.pricePerTray ?? 0}
      </td>

      <td>
        ${total}
      </td>

    </tr>

  </tbody>

</table>


<div class="total">

  المجموع الكلي:
  ${invoice.total ?? total}
  ل.س

</div>


<div class="signature">

  ${
    signature
      ? `
        <img
          src="${signature}"
        >
      `
      : ""
  }

</div>


</body>

</html>
`;
}


// =====================================================
// Generate PDF
// =====================================================

export async function generateInvoicePdf(
  input: InvoicePdfInput
): Promise<Buffer> {

  let browser:
    Awaited<
      ReturnType<
        typeof import("puppeteer")["launch"]
      >
    > | null = null;


  try {

    console.log(
      "PDF: starting generation"
    );


    // =================================================
    // Generate HTML
    // =================================================

    const html =
      generateInvoiceHtml(
        input.invoice
      );


    console.log(
      "PDF: HTML generated"
    );


    // =================================================
    // Load Puppeteer
    // =================================================

    console.log(
      "PDF: loading Puppeteer"
    );


    const puppeteer =
      await import(
        "puppeteer"
      );


    console.log(
      "PDF: Puppeteer loaded"
    );


    // =================================================
    // Launch Chromium
    // =================================================

    console.log(
      "PDF: launching Chromium"
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
      "PDF: Chromium launched"
    );


    // =================================================
    // Create Page
    // =================================================

    const page =
      await browser.newPage();


    console.log(
      "PDF: page created"
    );


    // =================================================
    // Set HTML
    // =================================================

    await page.setContent(
      html,
      {
        waitUntil:
          "load",
      }
    );


    console.log(
      "PDF: content loaded"
    );


    // =================================================
    // Generate PDF
    // =================================================

    const pdf =
      await page.pdf({

        format:
          "A4",

        printBackground:
          true,

        preferCSSPageSize:
          false,

      });


    console.log(
      "PDF: PDF generated"
    );


    // =================================================
    // IMPORTANT
    // Always return Buffer
    // =================================================

    return Buffer.from(
      pdf
    );

  } catch (error) {

    console.error(
      "PDF Generation Error:",
      error
    );

    throw error;

  } finally {

    // =================================================
    // Always Close Browser
    // =================================================

    if (browser) {

      try {

        await browser.close();

        console.log(
          "PDF: Chromium closed"
        );

      } catch (error) {

        console.error(
          "PDF: Chromium close error:",
          error
        );

      }

    }

  }

}