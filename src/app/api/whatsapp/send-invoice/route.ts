// src/app/api/whatsapp/send-invoice/route.ts

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  prisma,
} from "../../../../lib/prisma";

import {
  getCurrentUser,
} from "../../../../lib/auth";

import {
  generateInvoicePdf,
} from "../../../../lib/generateInvoicePdf";

export const runtime = "nodejs";

// =====================================================
// WhatsApp Configuration
// =====================================================

const WHATSAPP_ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN;

const WHATSAPP_PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID;

const WHATSAPP_API_VERSION =
  "v26.0";

// =====================================================
// WhatsApp Template
// =====================================================

const WHATSAPP_TEMPLATE_NAME =
  "invoice_document";

const WHATSAPP_TEMPLATE_LANGUAGE =
  "ar";

// =====================================================
// Normalize Phone
// =====================================================

function normalizePhone(
  phone: string
): string {

  let normalized =
    phone.trim();

  normalized =
    normalized.replace(
      /\s+/g,
      ""
    );

  normalized =
    normalized.replace(
      /[()-]/g,
      ""
    );

  if (
    normalized.startsWith("+")
  ) {
    normalized =
      normalized.substring(1);
  }

  if (
    normalized.startsWith("00")
  ) {
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
    new Uint8Array(
      arrayBuffer
    );

  view.set(buffer);

  return arrayBuffer;
}

// =====================================================
// Upload PDF to WhatsApp
// =====================================================

async function uploadWhatsAppDocument(
  pdf: Buffer,
  filename: string
): Promise<string> {

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

  console.log(
    "WhatsApp: preparing media upload"
  );

  // ===================================================
  // Buffer → ArrayBuffer → Blob
  // ===================================================

  const arrayBuffer =
    bufferToArrayBuffer(
      pdf
    );

  const blob =
    new Blob(
      [
        arrayBuffer,
      ],
      {
        type:
          "application/pdf",
      }
    );

  const formData =
    new FormData();

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

  console.log(
    "WhatsApp: uploading media"
  );

  const response =
    await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/media`,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        },

        body:
          formData,
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

  console.log(
    "WhatsApp: media uploaded",
    data.id
  );

  return data.id;
}

// =====================================================
// Send WhatsApp Template
// =====================================================

async function sendWhatsAppInvoiceTemplate(
  to: string,
  mediaId: string,
  filename: string,
  invoiceNumber: string,
  total: string
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

  console.log(
    "WhatsApp: sending invoice template to",
    to
  );

  console.log(
    "WhatsApp: template",
    WHATSAPP_TEMPLATE_NAME
  );

  console.log(
    "WhatsApp: language",
    WHATSAPP_TEMPLATE_LANGUAGE
  );

  // ===================================================
  // Template Message
  // ===================================================

  const requestBody = {

    messaging_product:
      "whatsapp",

    recipient_type:
      "individual",

    to,

    type:
      "template",

    template: {

      name:
        WHATSAPP_TEMPLATE_NAME,

      language: {
        code:
          WHATSAPP_TEMPLATE_LANGUAGE,
      },

      components: [

        // =============================================
        // HEADER
        // PDF Document
        // =============================================

        {
          type:
            "header",

          parameters: [

            {
              type:
                "document",

              document: {

                id:
                  mediaId,

                filename:
                  filename,
              },
            },

          ],
        },

        // =============================================
        // BODY
        // {{1}} = Invoice Number
        // {{2}} = Total
        // =============================================

        {
          type:
            "body",

          parameters: [

            {
              type:
                "text",

              text:
                invoiceNumber,
            },

            {
              type:
                "text",

              text:
                total,
            },

          ],
        },

      ],
    },
  };

  console.log(
    "WhatsApp: template request prepared"
  );

  console.log(
    "WhatsApp: invoice number:",
    invoiceNumber
  );

  console.log(
    "WhatsApp: invoice total:",
    total
  );

  const response =
    await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method:
          "POST",

        headers: {

          Authorization:
            `Bearer ${WHATSAPP_ACCESS_TOKEN}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            requestBody
          ),
      }
    );

  const data =
    await response.json();

  // ===================================================
  // API Error
  // ===================================================

  if (!response.ok) {

    console.error(
      "WhatsApp template send error:",
      JSON.stringify(
        data,
        null,
        2
      )
    );

    throw new Error(
      data?.error?.message ||
      "Failed to send WhatsApp invoice template"
    );
  }

  // ===================================================
  // Validate Response
  // ===================================================

  if (
    !data?.messages?.[0]?.id
  ) {

    console.error(
      "WhatsApp unexpected response:",
      JSON.stringify(
        data,
        null,
        2
      )
    );

    throw new Error(
      "WhatsApp did not return message ID"
    );
  }

  const messageId =
    data.messages[0].id;

  console.log(
    "WhatsApp: template message accepted"
  );

  console.log(
    "WhatsApp Message ID:",
    messageId
  );

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

  try {

    // =================================================
    // Authentication
    // =================================================

    const user =
      getCurrentUser(
        request
      );

    if (!user) {

      return NextResponse.json(
        {
          success:
            false,

          message:
            "غير مصرح",
        },
        {
          status:
            401,
        }
      );
    }

    // =================================================
    // Request Body
    // =================================================

    const {
      invoiceId,
    } =
      await request.json();

    if (!invoiceId) {

      return NextResponse.json(
        {
          success:
            false,

          message:
            "معرف الفاتورة مطلوب",
        },
        {
          status:
            400,
        }
      );
    }

    // =================================================
    // WhatsApp Configuration
    // =================================================

    if (!WHATSAPP_ACCESS_TOKEN) {

      return NextResponse.json(
        {
          success:
            false,

          message:
            "WHATSAPP_ACCESS_TOKEN غير موجود في Environment Variables",
        },
        {
          status:
            500,
        }
      );
    }

    if (!WHATSAPP_PHONE_NUMBER_ID) {

      return NextResponse.json(
        {
          success:
            false,

          message:
            "WHATSAPP_PHONE_NUMBER_ID غير موجود في Environment Variables",
        },
        {
          status:
            500,
        }
      );
    }

    // =================================================
    // Get Invoice
    // =================================================

    console.log(
      "WhatsApp Invoice: loading invoice"
    );

    const invoice =
      await prisma.invoice.findUnique({

        where: {
          id:
            invoiceId,
        },

        include: {

          customer:
            true,

          sales:
            true,
        },
      });

    if (!invoice) {

      return NextResponse.json(
        {
          success:
            false,

          message:
            "الفاتورة غير موجودة",
        },
        {
          status:
            404,
        }
      );
    }

    // =================================================
    // Customer
    // =================================================

    if (!invoice.customer) {

      return NextResponse.json(
        {
          success:
            false,

          message:
            "لا يوجد عميل مرتبط بالفاتورة",
        },
        {
          status:
            400,
        }
      );
    }

    if (!invoice.customer.phone) {

      return NextResponse.json(
        {
          success:
            false,

          message:
            "رقم هاتف العميل غير موجود",
        },
        {
          status:
            400,
        }
      );
    }

    // =================================================
    // Normalize Phone
    // =================================================

    const whatsappPhone =
      normalizePhone(
        invoice.customer.phone
      );

    if (!whatsappPhone) {

      return NextResponse.json(
        {
          success:
            false,

          message:
            "رقم هاتف العميل غير صالح",
        },
        {
          status:
            400,
        }
      );
    }

    console.log(
      "WhatsApp recipient:",
      whatsappPhone
    );

    // =================================================
    // Generate PDF
    // =================================================

    console.log(
      "WhatsApp Invoice: generating PDF"
    );

    const pdf =
      await generateInvoicePdf({
        invoice,
      });

    console.log(
      "WhatsApp Invoice: PDF generated",
      pdf.length
    );

    // =================================================
    // Filename
    // =================================================

    const filename =
      `invoice-${invoice.number}.pdf`;

    // =================================================
    // Upload PDF
    // =================================================

    const mediaId =
      await uploadWhatsAppDocument(
        pdf,
        filename
      );

    // =================================================
    // Invoice Values
    // =================================================

    const invoiceNumber =
      String(
        invoice.number ?? ""
      );

    const invoiceTotal =
      String(
        invoice.total ?? "0"
      );

    // =================================================
    // Send Template
    // =================================================

    const whatsappResult =
      await sendWhatsAppInvoiceTemplate(

        whatsappPhone,

        mediaId,

        filename,

        invoiceNumber,

        invoiceTotal

      );

    // =================================================
    // Success
    // =================================================

    return NextResponse.json(
      {
        success:
          true,

        message:
          "تم إرسال قالب الفاتورة عبر WhatsApp بنجاح",

        invoiceId:
          invoice.id,

        invoiceNumber:
          invoice.number,

        recipient:
          whatsappPhone,

        mediaId:
          mediaId,

        whatsapp:
          whatsappResult,
      },
      {
        status:
          200,
      }
    );

  } catch (error) {

    console.error(
      "WhatsApp Invoice Error:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          "حدث خطأ أثناء إرسال الفاتورة عبر WhatsApp",

        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status:
          500,
      }
    );
  }
}