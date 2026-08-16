// src/app/api/whatsapp/send-invoice/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

export const runtime = "nodejs";

// =====================================================
// WhatsApp Configuration
// =====================================================

const WHATSAPP_ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN;

const WHATSAPP_PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID;

const WHATSAPP_API_VERSION = "v26.0";

// =====================================================
// Image → Base64
// =====================================================

function getImageBase64(filePath: string) {
  try {
    const absolutePath = path.join(
      process.cwd(),
      filePath
    );

    if (!fs.existsSync(absolutePath)) {
      return "";
    }

    const buffer =
      fs.readFileSync(absolutePath);

    const ext =
      path
        .extname(filePath)
        .replace(".", "")
        .toLowerCase();

    return `data:image/${ext};base64,${buffer.toString(
      "base64"
    )}`;
  } catch {
    return "";
  }
}

// =====================================================
// Cairo Font → Base64
// =====================================================

function getFontBase64() {
  try {
    const fontPath = path.join(
      process.cwd(),
      "public/fonts/Cairo-Regular.ttf"
    );

    const font =
      fs.readFileSync(fontPath);

    return font.toString("base64");
  } catch {
    return "";
  }
}

// =====================================================
// Normalize WhatsApp Phone Number
// =====================================================

function normalizePhone(phone: string) {
  let normalized =
    phone.trim();

  // إزالة المسافات
  normalized =
    normalized.replace(/\s+/g, "");

  // إزالة الأقواس والشرطات
  normalized =
    normalized.replace(
      /[()-]/g,
      ""
    );

  // إزالة +
  if (normalized.startsWith("+")) {
    normalized =
      normalized.substring(1);
  }

  // تحويل 00xxxxxxxx إلى xxxxxxxx
  if (normalized.startsWith("00")) {
    normalized =
      normalized.substring(2);
  }

  return normalized;
}

// =====================================================
// Buffer → ArrayBuffer
// =====================================================

function bufferToArrayBuffer(
  buffer: Buffer
): ArrayBuffer {
  const arrayBuffer =
    new ArrayBuffer(
      buffer.byteLength
    );

  const view =
    new Uint8Array(arrayBuffer);

  view.set(buffer);

  return arrayBuffer;
}

// =====================================================
// Upload PDF to WhatsApp
// =====================================================

async function uploadWhatsAppDocument(
  pdf: Buffer,
  filename: string
) {
  if (!WHATSAPP_ACCESS_TOKEN) {
    throw new Error(
      "WHATSAPP_ACCESS_TOKEN is not configured"
    );
  }

  if (!WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error(
      "WHATSAPP_PHONE_NUMBER_ID is not configured"
    );
  }

  const formData =
    new FormData();

  // تحويل Buffer إلى ArrayBuffer حقيقي
  const arrayBuffer =
    bufferToArrayBuffer(pdf);

  const blob =
    new Blob(
      [arrayBuffer],
      {
        type: "application/pdf",
      }
    );

  formData.append(
    "file",
    blob,
    filename
  );

  formData.append(
    "messaging_product",
    "whatsapp"
  );

  formData.append(
    "type",
    "application/pdf"
  );

  const response =
    await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/media`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        },

        body: formData,
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    console.error(
      "WhatsApp media upload error:",
      data
    );

    throw new Error(
      data?.error?.message ||
        "Failed to upload PDF to WhatsApp"
    );
  }

  if (!data?.id) {
    throw new Error(
      "WhatsApp did not return media ID"
    );
  }

  return data.id;
}

// =====================================================
// Send WhatsApp Document
// =====================================================

async function sendWhatsAppDocument(
  to: string,
  mediaId: string,
  filename: string,
  caption: string
) {
  if (!WHATSAPP_ACCESS_TOKEN) {
    throw new Error(
      "WHATSAPP_ACCESS_TOKEN is not configured"
    );
  }

  if (!WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error(
      "WHATSAPP_PHONE_NUMBER_ID is not configured"
    );
  }

  const response =
    await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${WHATSAPP_ACCESS_TOKEN}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          messaging_product:
            "whatsapp",

          recipient_type:
            "individual",

          to,

          type: "document",

          document: {
            id: mediaId,

            filename,

            caption,
          },
        }),
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    console.error(
      "WhatsApp document send error:",
      data
    );

    throw new Error(
      data?.error?.message ||
        "Failed to send WhatsApp document"
    );
  }

  return data;
}

// =====================================================
// POST
// =====================================================

export async function POST(
  request: NextRequest
) {
  console.log(
    "WhatsApp Invoice: route started"
  );

  let browser:
    Awaited<
      ReturnType<
        typeof puppeteer.launch
      >
    > | null = null;

  try {
    // =================================================
    // Authentication
    // =================================================

    const user =
      getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "غير مصرح",
        },
        {
          status: 401,
        }
      );
    }

    // =================================================
    // Request Body
    // =================================================

    const {
      invoiceId,
    } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "معرف الفاتورة مطلوب",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Check WhatsApp Configuration
    // =================================================

    if (!WHATSAPP_ACCESS_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          message:
            "WHATSAPP_ACCESS_TOKEN غير موجود في Environment Variables",
        },
        {
          status: 500,
        }
      );
    }

    if (!WHATSAPP_PHONE_NUMBER_ID) {
      return NextResponse.json(
        {
          success: false,
          message:
            "WHATSAPP_PHONE_NUMBER_ID غير موجود في Environment Variables",
        },
        {
          status: 500,
        }
      );
    }

    // =================================================
    // Get Invoice
    // =================================================

    const invoice =
      await prisma.invoice.findUnique({
        where: {
          id: invoiceId,
        },

        include: {
          customer: true,
          sales: true,
        },
      });

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          message:
            "الفاتورة غير موجودة",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // Customer Phone
    // =================================================

    if (!invoice.customer) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لا يوجد عميل مرتبط بالفاتورة",
        },
        {
          status: 400,
        }
      );
    }

    if (!invoice.customer.phone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "رقم هاتف العميل غير موجود",
        },
        {
          status: 400,
        }
      );
    }

    const whatsappPhone =
      normalizePhone(
        invoice.customer.phone
      );

    if (!whatsappPhone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "رقم هاتف العميل غير صالح",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "WhatsApp recipient:",
      whatsappPhone
    );

    // =================================================
    // Parse Invoice Items
    // =================================================

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

    // =================================================
    // Calculate Total
    // =================================================

    const total =
      (items.trayCount || 0) *
      (items.pricePerTray || 0);

    // =================================================
    // Assets
    // =================================================

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

    // =================================================
    // Invoice Date
    // =================================================

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

    // =================================================
    // HTML
    // =================================================

    const html = `

<!DOCTYPE html>

<html lang="ar" dir="rtl">

<head>

<meta charset="UTF-8">

<style>

@font-face {

  font-family: Cairo;

  src:
    url(data:font/ttf;base64,${font});

}

* {
  box-sizing: border-box;
}

body {
  font-family: Cairo;
  direction: rtl;
  padding: 5px;
  color: #333;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom:
    2px solid #1B5E20;
  padding-bottom: 20px;
}

.logo {
  width: 100px;
  height: 100px;
  object-fit: contain;
}

.title {
  text-align: right;
}

.title h1 {
  color: #1B5E20;
  font-size: 28px;
}

.info {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.section {
  margin-top: 25px;
  font-size: 20px;
  font-weight: bold;
  color: #1B5E20;
}

.customer {
  background: #f5f5f5;
  padding: 15px;
  margin-top: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th {
  background: #1B5E20;
  color: white;
  padding: 10px;
}

td {
  padding: 10px;
  border-bottom:
    1px solid #ddd;
  text-align: center;
}

.total {
  margin-top: 30px;
  font-size: 22px;
  font-weight: bold;
  color: #1B5E20;
  text-align: left;
}

.signature {
  margin-top: 70px;
  text-align: center;
}

.signature img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

</style>

</head>

<body>

<div class="header">

<div>

${
  logo
    ? `<img class="logo" src="${logo}">`
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

</table>

<div class="total">

المجموع الكلي:
${invoice.total}
ل.س

</div>

<div class="signature">

${
  signature
    ? `<img src="${signature}">`
    : ""
}

</div>

</body>

</html>

`;

    // =================================================
    // Generate PDF
    // =================================================

    console.log(
      "WhatsApp Invoice: launching Puppeteer"
    );

    browser =
      await puppeteer.launch({
        headless: true,

        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      });

    const page =
      await browser.newPage();

    await page.setContent(
      html,
      {
        waitUntil: "load",
      }
    );

    const pdf =
      await page.pdf({
        format: "A4",
        printBackground: true,
      });

    console.log(
      "WhatsApp Invoice: PDF generated"
    );

    await browser.close();

    browser = null;

    // =================================================
    // PDF Filename
    // =================================================

    const filename =
      `invoice-${invoice.number}.pdf`;

    // =================================================
    // Upload PDF to WhatsApp
    // =================================================

    console.log(
      "WhatsApp Invoice: uploading PDF"
    );

    const mediaId =
      await uploadWhatsAppDocument(
        Buffer.from(pdf),
        filename
      );

    console.log(
      "WhatsApp Invoice: media uploaded",
      mediaId
    );

    // =================================================
    // Caption
    // =================================================

    const caption =
      `فاتورة مبيعات رقم ${invoice.number}\n` +
      `العميل: ${invoice.customer.name}\n` +
      `المجموع: ${invoice.total} ل.س`;

    // =================================================
    // Send PDF
    // =================================================

    console.log(
      "WhatsApp Invoice: sending document"
    );

    const whatsappResult =
      await sendWhatsAppDocument(
        whatsappPhone,
        mediaId,
        filename,
        caption
      );

    console.log(
      "WhatsApp Invoice: sent successfully"
    );

    // =================================================
    // Response
    // =================================================

    return NextResponse.json({
      success: true,

      message:
        "تم إرسال الفاتورة عبر WhatsApp بنجاح",

      invoiceId:
        invoice.id,

      invoiceNumber:
        invoice.number,

      recipient:
        whatsappPhone,

      whatsapp:
        whatsappResult,
    });

  } catch (error) {
    console.error(
      "WhatsApp Invoice Error:",
      error
    );

    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore
      }
    }

    return NextResponse.json(
      {
        success: false,

        message:
          "حدث خطأ أثناء إرسال الفاتورة عبر WhatsApp",

        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}