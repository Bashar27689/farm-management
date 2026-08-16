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

  console.log(
    "PDF Route: started"
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


    console.log(
      "PDF Route: invoiceId",
      invoiceId
    );


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


    console.log(
      "PDF Route: invoice loaded"
    );


    // =================================================
    // Generate PDF
    // =================================================

    const pdf =
      await generateInvoicePdf({
        invoice,
      });


    console.log(
      "PDF Route: PDF ready"
    );


    // =================================================
    // Response
    // =================================================

   return new NextResponse(
  new Uint8Array(pdf),
  {
    status: 200,

    headers: {
      "Content-Type": "application/pdf",

      "Content-Disposition":
        `attachment; filename="invoice-${invoice.number}.pdf"`,

      "Content-Length":
        String(pdf.length),
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