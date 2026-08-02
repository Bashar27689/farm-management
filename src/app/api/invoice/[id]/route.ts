// src/app/api/invoice/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from '../../../../lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        sales: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { message: 'الفاتورة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}