import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(invoices, {
      status: 200,
    });
  } catch (error) {
    console.error("GET /api/invoices error:", error);

    return NextResponse.json(
      {
        message: "حدث خطأ أثناء جلب الفواتير",
      },
      {
        status: 500,
      }
    );
  }
}