import { NextResponse } from "next/server";

import {
  createPdf,
} from "../../../lib/pdf/pdfmake";

export const runtime = "nodejs";

export async function GET() {
  try {
    console.log(
      "PDFMake Test: started"
    );

    const documentDefinition = {
      pageSize: "A4",

      pageMargins: [
        40,
        40,
        40,
        40,
      ],

      defaultStyle: {
        font: "Cairo",
        fontSize: 14,
      },

      content: [
        {
          text: "اختبار إنشاء ملف PDF",
          fontSize: 24,
          bold: true,
          alignment: "center",
          color: "#1B5E20",
          margin: [
            0,
            0,
            0,
            20,
          ],
        },

        {
          text:
            "هذه فاتورة تجريبية باللغة العربية للتأكد من دعم الخط العربي واتجاه النص.",
          alignment: "right",
          margin: [
            0,
            0,
            0,
            20,
          ],
        },

        {
          text: "بيانات العميل",
          fontSize: 18,
          bold: true,
          color: "#1B5E20",
          alignment: "right",
          margin: [
            0,
            10,
            0,
            10,
          ],
        },

        {
          table: {
            headerRows: 1,

            widths: [
              "*",
              "*",
            ],

            body: [
              [
                {
                  text: "البيان",
                  bold: true,
                  color: "#FFFFFF",
                  fillColor: "#1B5E20",
                  alignment: "center",
                },

                {
                  text: "القيمة",
                  bold: true,
                  color: "#FFFFFF",
                  fillColor: "#1B5E20",
                  alignment: "center",
                },
              ],

              [
                {
                  text: "اسم العميل",
                  alignment: "right",
                },

                {
                  text: "بشار محمد",
                  alignment: "right",
                },
              ],

              [
                {
                  text: "رقم الهاتف",
                  alignment: "right",
                },

                {
                  text: "0000000000",
                  alignment: "right",
                },
              ],

              [
                {
                  text: "المجموع",
                  alignment: "right",
                  bold: true,
                },

                {
                  text: "150,000 ل.س",
                  alignment: "right",
                  bold: true,
                },
              ],
            ],
          },

          layout: "lightHorizontalLines",
        },

        {
          text:
            "تم إنشاء هذا الملف باستخدام pdfmake بدون Puppeteer أو Chrome.",
          alignment: "center",
          margin: [
            0,
            30,
            0,
            0,
          ],
        },
      ],
    };

    console.log(
      "PDFMake Test: creating PDF"
    );

    const pdf =
      await createPdf(
        documentDefinition
      );

    console.log(
      "PDFMake Test: PDF created",
      pdf.length
    );

    return new NextResponse(
      new Uint8Array(pdf),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            'inline; filename="test-pdfmake.pdf"',

          "Content-Length":
            String(pdf.length),

          "Cache-Control":
            "no-store",
        },
      }
    );

  } catch (error) {
    console.error(
      "PDFMake Test Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

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