
//src/app/api/customers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

// =====================================================
// PUT - تعديل العميل
// =====================================================

export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      { message: 'غير مصرح' },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;

    const body = await request.json();

    const name = String(body.name ?? '').trim();
    const phone = String(body.phone ?? '').trim();

    // =====================================================
    // التحقق من البيانات
    // =====================================================

    if (!name) {
      return NextResponse.json(
        { message: 'اسم العميل مطلوب' },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { message: 'رقم الهاتف مطلوب' },
        { status: 400 }
      );
    }

    // =====================================================
    // التأكد من وجود العميل
    // =====================================================

    const existingCustomer = await prisma.customer.findUnique({
      where: {
        id,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { message: 'العميل غير موجود' },
        { status: 404 }
      );
    }

    // =====================================================
    // التأكد أن رقم الهاتف غير مستخدم من عميل آخر
    // =====================================================

    const phoneOwner = await prisma.customer.findUnique({
      where: {
        phone,
      },
    });

    if (phoneOwner && phoneOwner.id !== id) {
      return NextResponse.json(
        {
          message: 'رقم الهاتف مستخدم بالفعل من عميل آخر',
        },
        { status: 409 }
      );
    }

    // =====================================================
    // تحديث العميل
    // =====================================================

    const customer = await prisma.customer.update({
      where: {
        id,
      },
      data: {
        name,
        phone,
      },
    });

    return NextResponse.json(customer, {
      status: 200,
    });
  } catch (error) {
    console.error('PUT /api/customers/[id] error:', error);

    return NextResponse.json(
      {
        message: 'حدث خطأ أثناء تعديل العميل',
      },
      {
        status: 500,
      }
    );
  }
}
