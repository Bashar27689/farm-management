
// src/app/api/sales/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      { message: 'غير مصرح' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const {
      shopName,
      trayCount,
      pricePerTray,
      customerId,
      customerName,
      customerPhone,
      date,
    } = body;

    if (
      !shopName ||
      trayCount === undefined ||
      pricePerTray === undefined
    ) {
      return NextResponse.json(
        { message: 'جميع الحقول المطلوبة غير مكتملة' },
        { status: 400 }
      );
    }

    const parsedTrayCount = Number(trayCount);
    const parsedPricePerTray = Number(pricePerTray);

    if (
      !Number.isInteger(parsedTrayCount) ||
      parsedTrayCount <= 0
    ) {
      return NextResponse.json(
        { message: 'عدد الأطباق غير صحيح' },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(parsedPricePerTray) ||
      parsedPricePerTray <= 0
    ) {
      return NextResponse.json(
        { message: 'سعر الطبق غير صحيح' },
        { status: 400 }
      );
    }

    const total =
      parsedTrayCount * parsedPricePerTray;

    const result = await prisma.$transaction(async (tx) => {
      let invoiceCustomerId: string;

      /*
       * 1. عميل موجود
       */
      if (
        typeof customerId === 'string' &&
        customerId.trim()
      ) {
        const existingCustomer =
          await tx.customer.findUnique({
            where: {
              id: customerId,
            },
            select: {
              id: true,
            },
          });

        if (!existingCustomer) {
          throw new Error('CUSTOMER_NOT_FOUND');
        }

        invoiceCustomerId = existingCustomer.id;
      }

      /*
       * 2. عميل جديد
       */
      else if (
        typeof customerName === 'string' &&
        customerName.trim() &&
        typeof customerPhone === 'string' &&
        customerPhone.trim()
      ) {
        const customer = await tx.customer.upsert({
          where: {
            phone: customerPhone.trim(),
          },
          update: {
            name: customerName.trim(),
          },
          create: {
            name: customerName.trim(),
            phone: customerPhone.trim(),
          },
          select: {
            id: true,
          },
        });

        invoiceCustomerId = customer.id;
      }

      /*
       * 3. لا يوجد عميل
       */
      else {
        const defaultCustomer =
          await tx.customer.upsert({
            where: {
              phone: '000000000',
            },
            update: {},
            create: {
              name: 'عميل نقدي',
              phone: '000000000',
            },
            select: {
              id: true,
            },
          });

        invoiceCustomerId = defaultCustomer.id;
      }

      /*
       * إنشاء المبيعات
       */
      const sales = await tx.sales.create({
        data: {
          shopName: String(shopName).trim(),
          trayCount: parsedTrayCount,
          pricePerTray: parsedPricePerTray,
          total,
          date: date
            ? new Date(date)
            : new Date(),
          customerId: invoiceCustomerId,
        },
      });

      /*
       * إنشاء رقم الفاتورة
       */
      const invoiceNumber =
        `INV-${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}`;

      /*
       * إنشاء الفاتورة
       */
      const invoice =
        await tx.invoice.create({
          data: {
            number: invoiceNumber,
            date: sales.date,
            customerId: invoiceCustomerId,
            items: JSON.stringify({
              shopName: sales.shopName,
              trayCount: sales.trayCount,
              pricePerTray:
                sales.pricePerTray,
            }),
            total: sales.total,
            salesId: sales.id,
          },
          include: {
            customer: true,
          },
        });

      /*
       * ربط الفاتورة بالمبيعات
       */
      const updatedSales =
        await tx.sales.update({
          where: {
            id: sales.id,
          },
          data: {
            invoiceId: invoice.id,
          },
          include: {
            customer: true,
          },
        });

      return {
        sales: updatedSales,
        invoice,
      };
    });

    return NextResponse.json({
      message: 'تم إدخال المبيعات بنجاح',
      sales: result.sales,
      invoice: result.invoice,
    });
  } catch (error) {
    console.error(
      'Error creating sales:',
      error
    );

    if (
      error instanceof Error &&
      error.message === 'CUSTOMER_NOT_FOUND'
    ) {
      return NextResponse.json(
        { message: 'العميل المحدد غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'حدث خطأ في الخادم',
        ...(process.env.NODE_ENV ===
          'development' &&
        error instanceof Error
          ? { error: error.message }
          : {}),
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest
) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      { message: 'غير مصرح' },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);

    const startDate =
      url.searchParams.get('startDate');

    const endDate =
      url.searchParams.get('endDate');

    const where: {
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const sales =
      await prisma.sales.findMany({
        where,
        include: {
          customer: true,
          invoice: {
            include: {
              customer: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

    const totalRevenue =
      sales.reduce(
        (
          sum: number,
          sale: { total: number }
        ) => sum + sale.total,
        0
      );

    const totalTrays =
      sales.reduce(
        (
          sum: number,
          sale: { trayCount: number }
        ) => sum + sale.trayCount,
        0
      );

    return NextResponse.json({
      sales,
      stats: {
        totalRevenue,
        totalTrays,
        totalOrders: sales.length,
      },
    });
  } catch (error) {
    console.error(
      'Error fetching sales:',
      error
    );

    return NextResponse.json(
      { message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
