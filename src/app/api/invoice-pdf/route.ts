// src/app/api/invoice-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import { reshape } from "arabic-persian-reshaper";
import path from "path";
import fs from "fs";

// =============================
// Register Arabic Font
// =============================
Font.register({
  family: "Cairo",
  src: path.join(process.cwd(), "public/fonts/Cairo-Regular.ttf"),
});

// =============================
// Arabic Helper
// =============================
function arabic(text: string) {
  try {
    return reshape(text);
  } catch {
    return text;
  }
}

// =============================
// Helper to get image as base64
// =============================
function getImageBase64(imagePath: string): string {
  try {
    const fullPath = path.join(process.cwd(), imagePath);
    if (fs.existsSync(fullPath)) {
      const imageBuffer = fs.readFileSync(fullPath);
      const base64 = imageBuffer.toString('base64');
      const ext = path.extname(fullPath).toLowerCase();
      let mimeType = 'image/png';
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.gif') mimeType = 'image/gif';
      else if (ext === '.svg') mimeType = 'image/svg+xml';
      return `data:${mimeType};base64,${base64}`;
    }
    return '';
  } catch {
    return '';
  }
}

// =============================
// PDF Styles
// =============================
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Cairo",
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
  },
  header: {
    fontSize: 22,
    textAlign: "center",
    marginTop: 10,
  },
  subHeader: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    marginVertical: 10,
  },
  row: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    textAlign: "right",
    marginTop: 15,
    color: "#1B5E20",
  },
  text: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 5,
    color: "#333333",
  },
  tableHeader: {
    flexDirection: "row-reverse",
    borderBottomWidth: 1,
    borderBottomColor: "#999999",
    marginTop: 15,
    paddingBottom: 8,
  },
  tableRow: {
    flexDirection: "row-reverse",
    marginTop: 10,
  },
  col: {
    width: "25%",
    fontSize: 11,
    textAlign: "right",
  },
  total: {
    fontSize: 16,
    textAlign: "right",
    marginTop: 20,
  },
  signature: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "100%",
    textAlign: "center",
  },
  footer: {
    fontSize: 10,
    textAlign: "center",
  },
});

// =============================
// POST Handler
// =============================
export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json(
      { message: "غير مصرح" },
      { status: 401 }
    );
  }

  try {
    const { invoiceId } = await request.json();
    if (!invoiceId) {
      return NextResponse.json(
        { message: "معرف الفاتورة مطلوب" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        sales: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { message: "الفاتورة غير موجودة" },
        { status: 404 }
      );
    }

    let items: any = {};
    try {
      items = typeof invoice.items === "string"
        ? JSON.parse(invoice.items)
        : invoice.items;
    } catch {
      items = {
        shopName: "بيض",
        trayCount: 0,
        pricePerTray: 0,
      };
    }

    const itemTotal = (items.trayCount || 0) * (items.pricePerTray || 0);

    // Get images as base64
    const signature = getImageBase64('public/assets/signature.png');
    const farmLogoBase64 = getImageBase64('public/assets/farm Logo.png');

    const MyDocument = () => createElement(
      Document,
      null,
      createElement(
        Page,
        { size: "A4", style: styles.page },
        // Logo
        createElement(
          Image,
          { src: farmLogoBase64, style: styles.logo }
        ),
        // Header
        createElement(
          Text,
          { style: styles.header },
          arabic("فاتورة مبيعات")
        ),
        createElement(
          Text,
          { style: styles.subHeader },
          arabic("بيض الريف")
        ),
        createElement(
          View,
          { style: styles.divider }
        ),
        // Invoice info
        createElement(
          View,
          { style: styles.row },
          createElement(
            Text,
            { style: styles.text },
            arabic(` ${invoice.number} : رقم الفاتورة`)
          ),
          createElement(
            Text,
            { style: styles.text },
            arabic(
              new Date(invoice.date).toLocaleDateString("en-En")
            )
          )
        ),
        // Customer
        createElement(
          Text,
          { style: styles.title },
          arabic("بيانات العميل")
        ),
        createElement(
          Text,
          { style: styles.text },
          arabic(`الاسم: ${invoice.customer?.name || "غير محدد"}`)
        ),
        createElement(
          Text,
          { style: styles.text },
          arabic(`الهاتف: ${invoice.customer?.phone || "غير محدد"}`)
        ),
        // Details
        createElement(
          Text,
          { style: styles.title },
          arabic("تفاصيل الفاتورة")
        ),
        // Table Header
        createElement(
          View,
          { style: styles.tableHeader },
          createElement(
            Text,
            { style: styles.col },
            arabic("المنتج")
          ),
          createElement(
            Text,
            { style: styles.col },
            arabic("الكمية")
          ),
          createElement(
            Text,
            { style: styles.col },
            arabic("السعر")
          ),
          createElement(
            Text,
            { style: styles.col },
            arabic("المجموع")
          )
        ),
        // Table Row
        createElement(
          View,
          { style: styles.tableRow },
          createElement(
            Text,
            { style: styles.col },
            arabic(items.shopName || "بيض")
          ),
          createElement(
            Text,
            { style: styles.col },
            arabic(`${items.trayCount || 0} طبق عدد`)
          ),
          createElement(
            Text,
            { style: styles.col },
            `ل.س ${items.pricePerTray || 0}`
          ),
          createElement(
            Text,
            { style: styles.col },
            `ل.س ${itemTotal}`
          )
        ),
        // Total
        createElement(
          Text,
          { style: styles.total },
          arabic(`المجموع الكلي: ${invoice.total} ل.س`)
        ),
        // Signature
        createElement(
          View,
          { style: styles.signature },
          createElement(
            View,
            { style: styles.signatureBox },
            signature ? createElement(
              Image,
              {
                src: signature,
                style: { width: "100%", height: "100%" }
              }
            ) : null,
            
          ),
        
        ),
        // Footer
        createElement(
          Text,
          { style: styles.footer },
          arabic("شكراً لثقتكم بنا - نتمنى لكم يوماً سعيداً")
        )
      )
    );

    const pdfBuffer = await renderToBuffer(
      createElement(MyDocument, null)
    );

    return new NextResponse(
      pdfBuffer,
      {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=invoice-${invoice.number}.pdf`,
          "Content-Length": pdfBuffer.length.toString(),
        },
      }
    );
  } catch (error) {
    console.error("PDF Error:", error);
    return NextResponse.json(
      {
        message: "حدث خطأ أثناء إنشاء الفاتورة",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}