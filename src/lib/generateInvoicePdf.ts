// src/lib/generateInvoicePdf.ts

import fs from "node:fs";
import path from "node:path";

import type {
  Content,
  TDocumentDefinitions,
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
      "public/assets/farm-Logo.png"
    );

  const signature =
    getImageBase64(
      "public/assets/Signature.png"
    );

  // ===================================================
  // Invoice Date
  // ===================================================
const invoiceDate =
  new Date(
    invoice.date
  );

const day =
  invoiceDate
    .getDate()
    .toString();

const month =
  (
    invoiceDate.getMonth() + 1
  )
    .toString();

const year =
  invoiceDate
    .getFullYear()
    .toString();

const date =
  `${day}-${month}-${year}`;
// =====================================================

  // ===================================================
  // Colors
  // ===================================================

  const GREEN =
    "#1B5E20";

  const LIGHT_GRAY =
    "#f5f5f5";

  const BORDER =
    "#dddddd";

  const TEXT =
    "#333333";

  // ===================================================
  // Header
  // ===================================================

  const header: Content = {
    columns: [

      // -----------------------------------------------
      // Logo
      // -----------------------------------------------

      logo
        ? {
            image:
              logo,

            width:
              100,

            height:
              100,

            fit: [
              100,
              100,
            ],

            alignment:
              "left",
          }
        : {
            text: "",
          },

      // -----------------------------------------------
      // Title
      // -----------------------------------------------

      {
        text:
          " مبيعات "+"فاتورة ",

        fontSize:
          28,

        bold:
          true,

        color:
          GREEN,

        alignment:
          "right",

        margin: [
          0,
          30,
          0,
          0,
        ],
      },
    ],

    columnGap:
      10,

    margin: [
      0,
      0,
      0,
      20,
    ],
  };

  // ===================================================
  // Header Bottom Border
  // ===================================================

  const headerLine: Content = {
    canvas: [
      {
        type:
          "line",

        x1:
          0,

        y1:
          0,

        x2:
          535,

        y2:
          0,

        lineWidth:
          2,

        lineColor:
          GREEN,
      },
    ],

    margin: [
      0,
      -20,
      0,
      0,
    ],
  };

  // ===================================================
  // Invoice Info
  // ===================================================

  const invoiceInfo: Content = {
    columns: [

{
        text: [
       {
          text:
            date,
        },
        {
          text:
            "التاريخ: ",
        },

       
      ],

      alignment:
        "right",
    },

      {
        text: [

          String(
            invoice.number ?? ""
          ),

          {
            text:
              "الفاتورة: "+"رقم",
          },

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
  // Section Title Helper
  // ===================================================

  function sectionTitle(
    text: string
  ): Content {

    return {
      text,

      fontSize:
        20,

      bold:
        true,

      color:
        GREEN,

      alignment:
        "right",

      margin: [
        0,
        25,
        0,
        10,
      ],
    };
  }

  // ===================================================
  // Customer
  // ===================================================

  const customer: Content = {
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

                  String(
                    invoice.customer
                      ?.name ?? ""
                  ),

                  {
                    text:
                      "الاسم: ",
                  },

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

                  String(
                    invoice.customer
                      ?.phone ?? ""
                  ),

                  {
                    text:
                      "الهاتف: ",
                  },

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

      hLineWidth:
        () => 0,

      vLineWidth:
        () => 0,

      paddingLeft:
        () => 0,

      paddingRight:
        () => 0,

      paddingTop:
        () => 0,

      paddingBottom:
        () => 0,
    },

    margin: [
      0,
      0,
      0,
      0,
    ],
  };

  // ===================================================
  // Invoice Table
  // ===================================================

  const invoiceTable: Content = {
    table: {

      headerRows:
        1,

      widths: [
        "*",
        "*",
        "*",
        "*",
      ],

      body: [

        // =============================================
        // Header
        // =============================================

        [

          {
            text:
              "المجموع",

            bold:
              true,

            color:
              "#FFFFFF",

            fillColor:
              GREEN,

            alignment:
              "center",

            margin: [
              5,
              10,
              5,
              10,
            ],
          },

          {
            text:
              "السعر",

            bold:
              true,

            color:
              "#FFFFFF",

            fillColor:
              GREEN,

            alignment:
              "center",

            margin: [
              5,
              10,
              5,
              10,
            ],
          },

          {
            text:
              "الكمية",

            bold:
              true,

            color:
              "#FFFFFF",

            fillColor:
              GREEN,

            alignment:
              "center",

            margin: [
              5,
              10,
              5,
              10,
            ],
          },

          {
            text:
              " الدكان "+" اسم",

            bold:
              true,

            color:
              "#FFFFFF",

            fillColor:
              GREEN,

            alignment:
              "center",

            margin: [
              5,
              10,
              5,
              10,
            ],
          },
        ],

        // =============================================
        // Data
        // =============================================

        [

          {
            text:
              String(
                total
              ),

            alignment:
              "center",

            margin: [
              5,
              10,
              5,
              10,
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
              10,
              5,
              10,
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
              10,
              5,
              10,
            ],
          },

          {
            text:
              String(
                items.shopName ??
                "بيض"
              ),

            alignment:
              "center",

            margin: [
              5,
              10,
              5,
              10,
            ],
          },
        ],
      ],
    },

    layout: {

      // Horizontal lines

      hLineWidth:
        (
          i: number,
          node: any
        ) => {

          if (
            i === 0
          ) {
            return 0;
          }

          return 1;
        },

      hLineColor:
        () =>
          BORDER,

      // No vertical borders

      vLineWidth:
        () => 0,

      // Remove default cell padding

      paddingLeft:
        () => 0,

      paddingRight:
        () => 0,

      paddingTop:
        () => 0,

      paddingBottom:
        () => 0,
    },

    margin: [
      0,
      10,
      0,
      0,
    ],
  };

  // ===================================================
  // Total
  // ===================================================

  const totalSection: Content = {

    text: [

      " ل.س",

      String(
        invoice.total ??
        total
      ),

      " الكلي: "+"المجموع",

    ],

    fontSize:
      22,

    bold:
      true,

    color:
      GREEN,

    alignment:
      "left",

    margin: [
      0,
      30,
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
      35,
      30,
      35,
      250,
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

    // =================================================
    // Main Content
    // =================================================

    content: [

      header,

      headerLine,

      invoiceInfo,

      sectionTitle(
        " العميل "+" بيانات"
      ),

      customer,

      sectionTitle(
        "الفاتورة "+ "تفاصيل "
      ),

      invoiceTable,

      totalSection,
    ],

    // =================================================
    // Signature Footer
    // =================================================

    footer: signature
      ? {
          image:
            signature,

          width:
            600,

          height:
            250,


          alignment:
            "center",

          margin: [
            0,
            0,
            0,
            0,
          ],
        }
      : undefined,
  };

  // ===================================================
  // Generate PDF
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