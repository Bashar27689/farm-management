// src/lib/generateInvoicePdf.ts

import fs from "node:fs";
import path from "node:path";

import type {
  TDocumentDefinitions,
  Content,
} from "pdfmake/interfaces";

import {
  createPdf,
} from "./pdf/pdfmake";

// =====================================================
// Types
// =====================================================

type InvoicePdfInput = {
  invoice: any;
};

// =====================================================
// Asset → Base64
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
// Generate Invoice PDF
// =====================================================

export async function generateInvoicePdf(
  input: InvoicePdfInput
): Promise<Buffer> {

  console.log(
    "PDF: starting generation"
  );

  const invoice =
    input.invoice;

  // ===================================================
  // Parse Invoice Items
  // ===================================================

  let items: any = {};

  try {
    items =
      typeof invoice.items === "string"
        ? JSON.parse(invoice.items)
        : invoice.items;

  } catch (error) {
    console.warn(
      "PDF: failed to parse invoice items",
      error
    );

    items = {};
  }

  if (
    !items ||
    typeof items !== "object"
  ) {
    items = {};
  }

  // ===================================================
  // Invoice Values
  // ===================================================

  const trayCount =
    Number(
      items.trayCount || 0
    );

  const pricePerTray =
    Number(
      items.pricePerTray || 0
    );

  const calculatedTotal =
    trayCount *
    pricePerTray;

  const total =
    invoice.total ??
    calculatedTotal;

  // ===================================================
  // Assets
  // ===================================================

  const logo =
    getImageBase64(
      "public/assets/farm-Logo.png"
    );

  const signature =
    getImageBase64(
      "public/assets/Signature.png"
    );

  // ===================================================
  // Date
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
  // Colors
  // ===================================================

  const GREEN =
    "#1B5E20";

  const LIGHT_GRAY =
    "#F5F5F5";

  const BORDER =
    "#DDDDDD";

  const TEXT =
    "#333333";

  // ===================================================
  // Header
  // ===================================================

  const header: Content = {
    table: {
      widths: [
        "*",
        "auto",
      ],

      body: [
        [
          {
            stack: [
              {
                text:
                  "فاتورة مبيعات",

                fontSize: 28,

                bold: true,

                color: GREEN,

                alignment:
                  "right",
              },
            ],

            border: [
              false,
              false,
              false,
              true,
            ],

            borderColor:
              GREEN,

            borderWidth:
              2,

            margin: [
              0,
              20,
              0,
              20,
            ],
          },

          logo
            ? {
                image: logo,

                width: 100,

                height: 100,

                fit: [
                  100,
                  100,
                ],

                alignment:
                  "left",

                border: [
                  false,
                  false,
                  false,
                  true,
                ],

                borderColor:
                  GREEN,

                borderWidth:
                  2,

                margin: [
                  0,
                  0,
                  0,
                  20,
                ],
              }
            : {
                text: "",

                border: [
                  false,
                  false,
                  false,
                  true,
                ],

                borderColor:
                  GREEN,

                borderWidth:
                  2,

                margin: [
                  0,
                  0,
                  0,
                  20,
                ],
              },
        ],
      ],
    },

    layout: {
      hLineWidth: () => 0,

      vLineWidth: () => 0,

      paddingLeft: () => 0,

      paddingRight: () => 0,

      paddingTop: () => 0,

      paddingBottom: () => 0,
    },
  };

  // ===================================================
  // Invoice Information
  // ===================================================

  const invoiceInfo: Content = {
    columns: [
      {
        text: [
          {
            text: "التاريخ: ",
            bold: true,
          },

          date,
        ],

        alignment:
          "right",
      },

      {
        text: [
          {
            text:
              "رقم الفاتورة: ",
            bold: true,
          },

          String(
            invoice.number ??
            ""
          ),
        ],

        alignment:
          "right",
      },
    ],

    margin: [
      0,
      20,
      0,
      0,
    ],
  };

  // ===================================================
  // Customer Section Title
  // ===================================================

  const customerTitle: Content = {
    text:
      "بيانات العميل",

    fontSize: 20,

    bold: true,

    color: GREEN,

    alignment:
      "right",

    margin: [
      0,
      25,
      0,
      10,
    ],
  };

  // ===================================================
  // Customer Information
  // ===================================================

  const customerInfo: Content = {
    table: {
      widths: [
        "*",
      ],

      body: [
        [
          {
            stack: [
              {
                text: [
                  {
                    text:
                      "الاسم: ",
                    bold: true,
                  },

                  String(
                    invoice.customer
                      ?.name ??
                    ""
                  ),
                ],

                alignment:
                  "right",

                margin: [
                  0,
                  0,
                  0,
                  5,
                ],
              },

              {
                text: [
                  {
                    text:
                      "الهاتف: ",
                    bold: true,
                  },

                  String(
                    invoice.customer
                      ?.phone ??
                    ""
                  ),
                ],

                alignment:
                  "right",
              },
            ],

            fillColor:
              LIGHT_GRAY,

            margin: [
              15,
              15,
              15,
              15,
            ],
          },
        ],
      ],
    },

    layout: {
      hLineWidth: () => 0,

      vLineWidth: () => 0,

      paddingLeft: () => 0,

      paddingRight: () => 0,

      paddingTop: () => 0,

      paddingBottom: () => 0,
    },
  };

  // ===================================================
  // Details Title
  // ===================================================

  const detailsTitle: Content = {
    text:
      "تفاصيل الفاتورة",

    fontSize: 20,

    bold: true,

    color: GREEN,

    alignment:
      "right",

    margin: [
      0,
      25,
      0,
      10,
    ],
  };

  // ===================================================
  // Invoice Table
  // ===================================================

  const invoiceTable: Content = {
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
            text:
              "اسم الدكان",

            bold: true,

            color:
              "#FFFFFF",

            fillColor:
              GREEN,

            alignment:
              "center",

            margin: [
              5,
              8,
              5,
              8,
            ],
          },

          {
            text:
              "الكمية",

            bold: true,

            color:
              "#FFFFFF",

            fillColor:
              GREEN,

            alignment:
              "center",

            margin: [
              5,
              8,
              5,
              8,
            ],
          },

          {
            text:
              "السعر",

            bold: true,

            color:
              "#FFFFFF",

            fillColor:
              GREEN,

            alignment:
              "center",

            margin: [
              5,
              8,
              5,
              8,
            ],
          },

          {
            text:
              "المجموع",

            bold: true,

            color:
              "#FFFFFF",

            fillColor:
              GREEN,

            alignment:
              "center",

            margin: [
              5,
              8,
              5,
              8,
            ],
          },
        ],

        [
          {
            text:
              String(
                items.shopName ??
                "بيض"
              ),

            alignment:
              "right",

            margin: [
              5,
              8,
              5,
              8,
            ],
          },

          {
            text:
              String(
                items.trayCount ??
                0
              ),

            alignment:
              "center",

            margin: [
              5,
              8,
              5,
              8,
            ],
          },

          {
            text:
              String(
                items.pricePerTray ??
                0
              ),

            alignment:
              "center",

            margin: [
              5,
              8,
              5,
              8,
            ],
          },

          {
            text:
              String(
                calculatedTotal
              ),

            alignment:
              "center",

            margin: [
              5,
              8,
              5,
              8,
            ],
          },
        ],
      ],
    },

    layout: {
      hLineWidth: (
        i: number,
        node: any
      ) => {
        if (
          i === 0 ||
          i ===
            node.table.body.length
        ) {
          return 0;
        }

        return 1;
      },

      vLineWidth: () => 0,

      hLineColor: () =>
        BORDER,

      paddingLeft: () => 0,

      paddingRight: () => 0,

      paddingTop: () => 0,

      paddingBottom: () => 0,
    },
  };

  // ===================================================
  // Total
  // ===================================================

  const totalSection: Content = {
    text: [
      {
        text:
          "المجموع الكلي: ",
        bold: true,
      },

      String(total),

      " ل.س",
    ],

    fontSize: 22,

    bold: true,

    color: GREEN,

    alignment:
      "right",

    margin: [
      0,
      30,
      0,
      0,
    ],
  };

  // ===================================================
  // Signature
  // ===================================================

  const signatureSection: Content =
    signature
      ? {
          image:
            signature,

          width: 180,

          height: 100,

          fit: [
            180,
            100,
          ],

          alignment:
            "center",

          margin: [
            0,
            60,
            0,
            0,
          ],
        }
      : {
          text: "",

          margin: [
            0,
            60,
            0,
            0,
          ],
        };

  // ===================================================
  // Document Definition
  // ===================================================

  const documentDefinition:
    TDocumentDefinitions = {
      pageSize:
        "A4",

      pageOrientation:
        "portrait",

      pageMargins: [
        30,
        30,
        30,
        30,
      ],

      defaultStyle: {
        font:
          "Cairo",

        fontSize:
          12,

        color:
          TEXT,

        alignment:
          "right",
      },

      content: [
        header,

        invoiceInfo,

        customerTitle,

        customerInfo,

        detailsTitle,

        invoiceTable,

        totalSection,

        signatureSection,
      ],
    };

  // ===================================================
  // Generate
  // ===================================================

  console.log(
    "PDF: generating with pdfmake"
  );

  const pdf =
    await createPdf(
      documentDefinition
    );

  console.log(
    "PDF: generated",
    pdf.length
  );

  return pdf;
}