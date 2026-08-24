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
// Format Money
// =====================================================

function formatMoney(
  amount: number
): string {
  return (
    `ل.س  ${amount.toLocaleString("en-US")} `
  );
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
      trayCount: 0,
      pricePerTray: 0,
    };
  }

  if (
    !items ||
    typeof items !== "object"
  ) {

    items = {
      trayCount: 0,
      pricePerTray: 0,
    };
  }

  // ===================================================
  // Sale Data
  // ===================================================

  const trayCount =
    Number(
      items.trayCount || 0
    );

  const pricePerTray =
    Number(
      items.pricePerTray || 0
    );

  // ===================================================
  // Invoice Total
  // ===================================================

  const invoiceTotal =
    Number(
      invoice.total ??
      trayCount * pricePerTray
    );

  // ===================================================
  // Paid Amount
  // ===================================================

  const paidAmount =
    Math.max(
      0,
      Number(
        invoice.sales?.paidAmount ??
        invoice.paidAmount ??
        0
      )
    );

  // ===================================================
  // Remaining Amount
  // ===================================================

  const remainingAmount =
    Math.max(
      0,
      invoiceTotal -
      paidAmount
    );

  // ===================================================
  // Payment Status
  // ===================================================

  let paymentStatusText =
"مدفوعة "+"غير ";

  let paymentStatusColor =
    "#C62828";

  if (
    invoiceTotal > 0 &&
    paidAmount >= invoiceTotal
  ) {

    paymentStatusText =
      "مدفوعة بالكامل";

    paymentStatusColor =
      "#2E7D32";

  } else if (
    paidAmount > 0 &&
    paidAmount < invoiceTotal
  ) {

    paymentStatusText =
"جزئياً "+"مدفوعة ";

    paymentStatusColor =
      "#EF6C00";

  } else {

    paymentStatusText =
"مدفوعة "+"غير ";

    paymentStatusColor =
      "#C62828";
  }

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
      .toString()
      .padStart(2, "0");

  const month =
    (
      invoiceDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0");

  const year =
    invoiceDate
      .getFullYear()
      .toString();

  const date =
    `${day}-${month}-${year}`;

  // ===================================================
  // Colors
  // ===================================================

  const GREEN =
    "#1B5E20";

  const LIGHT_GREEN =
    "#E8F5E9";

  const LIGHT_GRAY =
    "#F5F5F5";

  const BORDER =
    "#D6D6D6";

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
              95,

            height:
              95,

            fit: [
              95,
              95,
            ],

            alignment:
              "left",
          }
        : {

            text:
              "",
          },

      // -----------------------------------------------
      // Title
      // -----------------------------------------------

      {

        text:
"مبيعات "+"فاتورة ",

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
  // Invoice Information
  // ===================================================

  const invoiceInfo: Content = {

    table: {

      widths: [
        "*",
        "*",
      ],

      body: [

        [

          // -------------------------------------------
          // Date
          // -------------------------------------------

          {

            text: [
              date,
              {

                text:
                  "التاريخ: ",

                bold:
                  true,
              },

             
            ],

            alignment:
              "right",

            margin: [
              5,
              8,
              5,
              8,
            ],
          },

          // -------------------------------------------
          // Invoice Number
          // -------------------------------------------

          {

            text: [
   String(
                invoice.number ?? ""
              ),
              {

                text:
                 "الفاتورة: "+"رقم ",

                bold:
                  true,
              },

           
            ],

            alignment:
              "right",

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
      15,
      0,
      0,
    ],
  };

  // ===================================================
  // Section Title
  // ===================================================

  function sectionTitle(
    text: string
  ): Content {

    return {

      text,

      fontSize:
        18,

      bold:
        true,

      color:
        GREEN,

      alignment:
        "right",

      margin: [
        0,
        20,
        0,
        10,
      ],
    };
  }

  // ===================================================
  // Customer Information
  // ===================================================

  const customer: Content = {

    table: {

      widths: [
        "*",
        "*",
      ],

      body: [

        [


          // -------------------------------------------
          // Customer Phone
          // -------------------------------------------

          {

            text: [
              String(
                invoice.customer
                  ?.phone ?? ""
              ),
              {

                text:
"الهاتف: "+"رقم ",

                bold:
                  true,
              },


            ],

            alignment:
              "right",

            fillColor:
              LIGHT_GRAY,

            margin: [
              10,
              12,
              10,
              12,
            ],
          },
                    // -------------------------------------------
          // Customer Name
          // -------------------------------------------

          {

            text: [
              String(
                invoice.customer
                  ?.name ?? ""
              ),
              {

                text:
"العميل: "+"أسم ",

                bold:
                  true,
              },


            ],

            alignment:
              "right",

            fillColor:
              LIGHT_GRAY,

            margin: [
              10,
              12,
              10,
              12,
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

      // سبعة أعمدة
      widths: [

        "*",
        "*",
        "*",
        "*",
        "*",
        "*",
        "*",
      ],

      body: [
       
        // =============================================
        // Table Header
        // =============================================

        [
          // -------------------------------------------
          // Payment Status
          // -------------------------------------------

          {

            text:
             "الدفع "+"حالة ",

            bold:
              true,

            color:
              "#FFFFFF",

            fillColor:
              GREEN,

            alignment:
              "center",

            margin: [
              3,
              9,
              3,
              9,
            ],
          },
                    // -------------------------------------------
          // Remaining Amount
          // -------------------------------------------

          {

            text:
             "المتبقي "+"المبلغ ",

            bold:
              true,

            color:
              "#FFFFFF",

            fillColor:
              GREEN,

            alignment:
              "center",

            margin: [
              3,
              9,
              3,
              9,
            ],
          },
          

          // -------------------------------------------
          // Paid Amount
          // -------------------------------------------

          {

            text:
             "المستلم "+"المبلغ ",

            bold:
              true,

            color:
              "#FFFFFF",

            fillColor:
              GREEN,

            alignment:
              "center",

            margin: [
              3,
              9,
              3,
              9,
            ],
          },


          // -------------------------------------------
          // Invoice Total
          // -------------------------------------------

          {

            text:
             "الفاتورة "+"إجمالي ",

            bold:
              true,

            color:
              "#FFFFFF",

            fillColor:
              GREEN,

            alignment:
              "center",

            margin: [
              3,
              9,
              3,
              9,
            ],
          },
          
          // -------------------------------------------
          // Price
          // -------------------------------------------

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
              3,
              9,
              3,
              9,
            ],
          },

          // -------------------------------------------
          // Quantity
          // -------------------------------------------

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
              3,
              9,
              3,
              9,
            ],
          },

          // -------------------------------------------
          // Item
          // -------------------------------------------

          {

            text:
              "المنتج",

            bold:
              true,

            color:
              "#FFFFFF",

            fillColor:
              GREEN,

            alignment:
              "center",

            margin: [
              3,
              9,
              3,
              9,
            ],
          },



        ],

        // =============================================
        // Table Data
        // =============================================

        [
          // -------------------------------------------
          // Payment Status
          // -------------------------------------------

          {

            text:
              paymentStatusText,

            bold:
              true,

            color:
              paymentStatusColor,

            alignment:
              "center",

            fillColor:
              remainingAmount === 0
                ? LIGHT_GREEN
                : "#FFF3E0",

            margin: [
              3,
              12,
              3,
              12,
            ],
          },
          // -------------------------------------------
          // Remaining Amount
          // -------------------------------------------

          {

            text:
              formatMoney(
                remainingAmount
              ),

            bold:
              true,

            color:
              remainingAmount === 0
                ? GREEN
                : "#EF6C00",

            alignment:
              "center",

            margin: [
              3,
              12,
              3,
              12,
            ],
          },

          // -------------------------------------------
          // Paid Amount
          // -------------------------------------------

          {

            text:
              formatMoney(
                paidAmount
              ),

            bold:
              true,

            color:
              GREEN,

            alignment:
              "center",

            margin: [
              3,
              12,
              3,
              12,
            ],
          },




          // -------------------------------------------
          // Invoice Total
          // -------------------------------------------

          {

            text:
              formatMoney(
                invoiceTotal
              ),

            bold:
              true,

            color:
              GREEN,

            alignment:
              "center",

            margin: [
              3,
              12,
              3,
              12,
            ],
          },
          // -------------------------------------------
          // Price
          // -------------------------------------------

          {

            text:
              formatMoney(
                pricePerTray
              ),

            alignment:
              "center",

            margin: [
              3,
              12,
              3,
              12,
            ],
          },

          // -------------------------------------------
          // Quantity
          // -------------------------------------------

          {

            text:
              String(
                trayCount
              ),

            alignment:
              "center",

            margin: [
              3,
              12,
              3,
              12,
            ],
          },

          // -------------------------------------------
          // Item
          // -------------------------------------------

          {

            text:
              "بيض",

            alignment:
              "center",

            margin: [
              3,
              12,
              3,
              12,
            ],
          },
        ],
      ],
    },

    layout: {

      // -----------------------------------------------
      // Horizontal Lines
      // -----------------------------------------------

      hLineWidth:
        (
          i: number
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

      // -----------------------------------------------
      // Vertical Lines
      // -----------------------------------------------

      vLineWidth:
        () => 1,

      vLineColor:
        () =>
          BORDER,

      // -----------------------------------------------
      // Padding
      // -----------------------------------------------

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
      300,
    ],

    defaultStyle: {

      font:
        "Cairo",

      fontSize:
        11,

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
"العميل "+"بيانات "
      ),

      customer,

      sectionTitle(
"الفاتورة "+"تفاصيل "
      ),

      invoiceTable,
    ],

    // =================================================
    // Signature Footer
    // =================================================

    footer:
      signature
        ? {

            image:
              signature,

            width:
              600,

            height:
              300,

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