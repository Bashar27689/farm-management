// src/app/api/invoice-pdf/route.ts

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "../../../lib/prisma";

import {
  getCurrentUser,
} from "../../../lib/auth";

import {
  generateInvoicePdf,
} from "../../../lib/generateInvoicePdf";

export const runtime = "nodejs";

// =====================================================
// POST
// =====================================================

export async function POST(
  request: NextRequest
) {
  console.log("PDF Route: started");

  try {
    // =================================================
    // Authentication
    // =================================================

    const user = getCurrentUser(request);

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

    const body = await request.json();

    const invoiceId =
      typeof body?.invoiceId === "string"
        ? body.invoiceId.trim()
        : "";

    if (!invoiceId) {
      return NextResponse.json(
        {
          success: false,
          message: "معرف الفاتورة مطلوب",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "PDF Route: invoiceId",
      invoiceId
    );

    // =================================================
    // Get Latest Invoice Data
    // =================================================

    const invoice =
      await prisma.invoice.findUnique({
        where: {
          id: invoiceId,
        },

        include: {
          customer: true,

          sales: true,

          payments: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

    // =================================================
    // Invoice Not Found
    // =================================================

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          message: "الفاتورة غير موجودة",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // Calculate Payment Information
    // =================================================

    const paymentsTotal =
      invoice.payments.reduce(
        (
          total: number,
          payment
        ) => {
          return (
            total +
            Number(payment.amount ?? 0)
          );
        },
        0
      );

    const invoiceTotal =
      Number(invoice.total ?? 0);

    const invoicePaidAmount =
      Number(invoice.paidAmount ?? 0);

    const remainingAmount =
      Math.max(
        invoiceTotal -
          invoicePaidAmount,
        0
      );

    // =================================================
    // Logs
    // =================================================

    console.log(
      "PDF Route: invoice total:",
      invoiceTotal
    );

    console.log(
      "PDF Route: invoice.paidAmount:",
      invoicePaidAmount
    );

    console.log(
      "PDF Route: payments count:",
      invoice.payments.length
    );

    console.log(
      "PDF Route: payments total:",
      paymentsTotal
    );

    console.log(
      "PDF Route: remaining amount:",
      remainingAmount
    );

    // =================================================
    // Generate PDF
    // =================================================
    //
    // مهم:
    // generateInvoicePdf حالياً يستقبل InvoicePdfInput
    // ولا يحتوي هذا النوع على paymentsTotal.
    //
    // لذلك نرسل invoice فقط.
    // =================================================

    const pdf =
      await generateInvoicePdf({
        invoice,
      });

    console.log(
      "PDF Route: PDF ready",
      pdf.length
    );

    // =================================================
    // Buffer → Uint8Array
    // =================================================

    const bodyBuffer =
      new Uint8Array(pdf);

    // =================================================
    // Response
    // =================================================

    return new NextResponse(
      bodyBuffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="invoice-${invoice.number}.pdf"`,

          "Content-Length":
            String(
              bodyBuffer.byteLength
            ),

          "Cache-Control":
            "no-store",
        },
      }
    );

  } catch (error) {
    console.error(
      "PDF Route Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "حدث خطأ أثناء إنشاء PDF",

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