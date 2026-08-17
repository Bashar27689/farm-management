import {
  NextResponse,
} from "next/server";

import {
  createPdf,
} from "../../../lib/pdf/pdfmake";

export const runtime = "nodejs";

export async function GET() {
  try {
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
          text: "فاتورة مبيعات",
          fontSize: 26,
          bold: true,
          alignment: "right",
          color: "#1B5E20",
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
          alignment: "right",
          color: "#1B5E20",
          margin: [
            0,
            10,
            0,
            10,
          ],
        },

        {
          text: [
            {
              text: "الاسم: ",
              bold: true,
            },
            "محمد أحمد",
          ],

          alignment: "right",

          margin: [
            0,
            0,
            0,
            8,
          ],
        },

        {
          text: [
            {
              text: "الهاتف: ",
              bold: true,
            },
            "0123456789",
          ],

          alignment: "right",

          margin: [
            0,
            0,
            0,
            20,
          ],
        },

        {
          text: "تفاصيل الفاتورة",
          fontSize: 18,
          bold: true,
          alignment: "right",
          color: "#1B5E20",
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
              "auto",
              "auto",
              "auto",
            ],

            body: [
              [
                {
                  text: "اسم الدكان",
                  bold: true,
                  color: "#FFFFFF",
                  fillColor: "#1B5E20",
                  alignment: "center",
                },

                {
                  text: "الكمية",
                  bold: true,
                  color: "#FFFFFF",
                  fillColor: "#1B5E20",
                  alignment: "center",
                },

                {
                  text: "السعر",
                  bold: true,
                  color: "#FFFFFF",
                  fillColor: "#1B5E20",
                  alignment: "center",
                },

                {
                  text: "المجموع",
                  bold: true,
                  color: "#FFFFFF",
                  fillColor: "#1B5E20",
                  alignment: "center",
                },
              ],

              [
                {
                  text: "دكان الخير",
                  alignment: "right",
                },

                {
                  text: "10",
                  alignment: "center",
                },

                {
                  text: "15000",
                  alignment: "center",
                },

                {
                  text: "150000",
                  alignment: "center",
                },
              ],
            ],
          },

          layout: "lightHorizontalLines",
        },

        {
          text: "المجموع الكلي: 150,000 ل.س",
          fontSize: 20,
          bold: true,
          alignment: "right",
          color: "#1B5E20",
          margin: [
            0,
            25,
            0,
            0,
          ],
        },

        {
          text:
            "هذه فاتورة تجريبية باستخدام pdfmake وبدون Puppeteer أو Chrome.",
          alignment: "center",
          fontSize: 11,
          margin: [
            0,
            40,
            0,
            0,
          ],
        },
      ],
    };

    const pdf =
      await createPdf(
        documentDefinition
      );

    return new NextResponse(
      new Uint8Array(pdf),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            'inline; filename="test-invoice.pdf"',

          "Content-Length":
            String(pdf.length),

          "Cache-Control":
            "no-store",
        },
      }
    );

  } catch (error) {
    console.error(
      "Test Invoice PDF Error:",
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