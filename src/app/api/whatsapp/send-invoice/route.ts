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
// Normalize Phone
// =====================================================

function normalizePhone(
  phone: string
): string {

  let normalized =
    phone.trim();


  // Remove spaces

  normalized =
    normalized.replace(
      /\s+/g,
      ""
    );


  // Remove brackets and dashes

  normalized =
    normalized.replace(
      /[()-]/g,
      ""
    );


  // Remove +

  if (
    normalized.startsWith("+")
  ) {

    normalized =
      normalized.substring(1);

  }


  // Convert 00XXXXXXXX
  // to XXXXXXXXXX

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


  view.set(
    buffer
  );


  return arrayBuffer;

}


// =====================================================
// Upload PDF
// =====================================================

async function uploadWhatsAppDocument(
  pdf: Buffer,
  filename: string
): Promise<string> {

  if (
    !WHATSAPP_ACCESS_TOKEN
  ) {

    throw new Error(
      "WHATSAPP_ACCESS_TOKEN is not configured"
    );

  }


  if (
    !WHATSAPP_PHONE_NUMBER_ID
  ) {

    throw new Error(
      "WHATSAPP_PHONE_NUMBER_ID is not configured"
    );

  }


  console.log(
    "WhatsApp: preparing media upload"
  );


  const formData =
    new FormData();


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


  if (
    !response.ok
  ) {

    console.error(
      "WhatsApp media upload error:",
      data
    );


    throw new Error(
      data?.error?.message ||
      "Failed to upload PDF to WhatsApp"
    );

  }


  if (
    !data?.id
  ) {

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
// Send WhatsApp Document
// =====================================================

async function sendWhatsAppDocument(
  to: string,
  mediaId: string,
  filename: string,
  caption: string
) {

  if (
    !WHATSAPP_ACCESS_TOKEN
  ) {

    throw new Error(
      "WHATSAPP_ACCESS_TOKEN is not configured"
    );

  }


  if (
    !WHATSAPP_PHONE_NUMBER_ID
  ) {

    throw new Error(
      "WHATSAPP_PHONE_NUMBER_ID is not configured"
    );

  }


  console.log(
    "WhatsApp: sending document to",
    to
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
          JSON.stringify({

            messaging_product:
              "whatsapp",

            recipient_type:
              "individual",

            to,

            type:
              "document",

            document: {

              id:
                mediaId,

              filename,

              caption,

            },

          }),

      }
    );


  const data =
    await response.json();


  if (
    !response.ok
  ) {

    console.error(
      "WhatsApp document send error:",
      data
    );


    throw new Error(
      data?.error?.message ||
      "Failed to send WhatsApp document"
    );

  }


  console.log(
    "WhatsApp: document sent"
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

          success: false,

          message:
            "غير مصرح",

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
    // WhatsApp Configuration
    // =================================================

    if (
      !WHATSAPP_ACCESS_TOKEN
    ) {

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


    if (
      !WHATSAPP_PHONE_NUMBER_ID
    ) {

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
    // Customer
    // =================================================

    if (
      !invoice.customer
    ) {

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


    if (
      !invoice.customer.phone
    ) {

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


    // =================================================
    // Normalize Phone
    // =================================================

    const whatsappPhone =
      normalizePhone(
        invoice.customer.phone
      );


    if (
      !whatsappPhone
    ) {

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
    // Caption
    // =================================================

    const caption =
      `فاتورة مبيعات رقم ${invoice.number}\n` +
      `العميل: ${invoice.customer.name}\n` +
      `المجموع: ${invoice.total} ل.س`;


    // =================================================
    // Send
    // =================================================

    const whatsappResult =
      await sendWhatsAppDocument(

        whatsappPhone,

        mediaId,

        filename,

        caption

      );


    // =================================================
    // Success
    // =================================================

    return NextResponse.json(
      {

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

      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.error(
      "WhatsApp Invoice Error:",
      error
    );


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