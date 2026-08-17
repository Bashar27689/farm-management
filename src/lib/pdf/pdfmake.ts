import path from "node:path";
import pdfmake from "pdfmake";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

// =====================================================
// Types
// =====================================================

type PdfDocumentDefinition = TDocumentDefinitions;

// =====================================================
// Fonts
// =====================================================

const fonts = {
  Cairo: {
    normal: path.join(
      process.cwd(),
      "public/fonts/Cairo-Regular.ttf"
    ),

    bold: path.join(
      process.cwd(),
      "public/fonts/Cairo-Regular.ttf"
    ),

    italics: path.join(
      process.cwd(),
      "public/fonts/Cairo-Regular.ttf"
    ),

    bolditalics: path.join(
      process.cwd(),
      "public/fonts/Cairo-Regular.ttf"
    ),
  },
};

// =====================================================
// Register Fonts
// =====================================================

pdfmake.addFonts(fonts);

// =====================================================
// Create PDF
// =====================================================

export async function createPdf(
  documentDefinition: PdfDocumentDefinition
): Promise<Buffer> {
  console.log(
    "PDFMake: creating PDF"
  );

  const pdf =
    pdfmake.createPdf(
      documentDefinition
    );

  console.log(
    "PDFMake: PDF document created"
  );

  const buffer =
    await pdf.getBuffer();

  console.log(
    "PDFMake: PDF buffer created",
    buffer.length
  );

  return buffer;
}