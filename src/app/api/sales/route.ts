// src/app/api/sales/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      { message: 'غير مصرح' },
      { status: 401 }
    );
  }

  try {
    const {
      trayCount,
      pricePerTray,
      paidAmount,
      customerName,
      customerPhone,
      customerId,
      date,
    } = await request.json();

    // =====================================================
    // التحقق من البيانات الأساسية
    // =====================================================

    if (!trayCount || !pricePerTray) {
      return NextResponse.json(
        {
          message: 'عدد الأطباق وسعر الطبق مطلوبان',
        },
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
        {
          message:
            'عدد الأطباق يجب أن يكون رقمًا صحيحًا أكبر من صفر',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(parsedPricePerTray) ||
      parsedPricePerTray <= 0
    ) {
      return NextResponse.json(
        {
          message:
            'سعر الطبق يجب أن يكون رقماً صحيحاً أكبر من صفر',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // حساب إجمالي البيع
    // =====================================================

    const total =
      parsedTrayCount * parsedPricePerTray;

    // =====================================================
    // المبلغ المدفوع
    // =====================================================

    const parsedPaidAmount =
      paidAmount === undefined ||
      paidAmount === null ||
      paidAmount === ''
        ? 0
        : Number(paidAmount);

    if (
      !Number.isInteger(parsedPaidAmount) ||
      parsedPaidAmount < 0
    ) {
      return NextResponse.json(
        {
          message:
            'المبلغ المدفوع يجب أن يكون رقمًا صحيحًا أكبر من أو يساوي صفر',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // منع دفع مبلغ أكبر من قيمة الفاتورة
    // =====================================================

    if (parsedPaidAmount > total) {
      return NextResponse.json(
        {
          message:
            'المبلغ المدفوع لا يمكن أن يكون أكبر من إجمالي الفاتورة',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // تحديد حالة الدفع
    // =====================================================

    let paymentStatus:
      | 'UNPAID'
      | 'PARTIAL'
      | 'PAID';

    if (parsedPaidAmount === 0) {
      paymentStatus = 'UNPAID';
    } else if (parsedPaidAmount < total) {
      paymentStatus = 'PARTIAL';
    } else {
      paymentStatus = 'PAID';
    }

    // =====================================================
    // تنظيف بيانات العميل
    // =====================================================

    const trimmedCustomerName =
      typeof customerName === 'string'
        ? customerName.trim()
        : '';

    const trimmedCustomerPhone =
      typeof customerPhone === 'string'
        ? customerPhone.trim()
        : '';

    // =====================================================
    // إذا تم اختيار عميل موجود
    // =====================================================

    let customer = null;

    if (customerId) {
      customer = await prisma.customer.findUnique({
        where: {
          id: String(customerId),
        },
      });

      if (!customer) {
        return NextResponse.json(
          {
            message:
              'العميل المحدد غير موجود',
          },
          { status: 400 }
        );
      }
    }

    // =====================================================
    // إذا لم يتم اختيار عميل موجود
    // يجب أن يكون اسم العميل موجودًا
    // =====================================================

    if (!customer && !trimmedCustomerName) {
      return NextResponse.json(
        {
          message: 'اسم العميل مطلوب',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // إنشاء أو العثور على العميل الجديد
    // =====================================================

    if (!customer) {
      // ---------------------------------------------------
      // يوجد رقم هاتف
      // ---------------------------------------------------

      if (trimmedCustomerPhone) {
        customer = await prisma.customer.upsert({
          where: {
            phone: trimmedCustomerPhone,
          },

          update: {
            name: trimmedCustomerName,
          },

          create: {
            name: trimmedCustomerName,
            phone: trimmedCustomerPhone,
          },
        });
      }

      // ---------------------------------------------------
      // لا يوجد رقم هاتف
      // ---------------------------------------------------

      else {
        customer = await prisma.customer.create({
          data: {
            name: trimmedCustomerName,
            phone: null,
          },
        });
      }
    }

    // =====================================================
    // إنشاء المبيعات والفاتورة داخل Transaction
    // =====================================================

    const result = await prisma.$transaction(
      async (tx) => {

        // -------------------------------------------------
        // إنشاء عملية البيع
        // -------------------------------------------------

        const sales = await tx.sales.create({
          data: {
            trayCount: parsedTrayCount,

            pricePerTray:
              parsedPricePerTray,

            total,

            paidAmount:
              parsedPaidAmount,

            date: date
              ? new Date(date)
              : new Date(),

            customerId:
              customer.id,
          },

          include: {
            customer: true,
          },
        });

        // -------------------------------------------------
        // إنشاء رقم الفاتورة
        // -------------------------------------------------

        const invoiceNumber =
          `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // -------------------------------------------------
        // إنشاء الفاتورة
        // -------------------------------------------------

        const invoice =
          await tx.invoice.create({
            data: {
              number: invoiceNumber,

              date: sales.date,

              customerId:
                customer.id,

              items: JSON.stringify({
                trayCount:
                  sales.trayCount,

                pricePerTray:
                  sales.pricePerTray,
              }),

              total:
                sales.total,

              paidAmount:
                parsedPaidAmount,

              paymentStatus,

              salesId:
                sales.id,
            },

            include: {
              customer: true,
            },
          });

        // -------------------------------------------------
        // ربط الفاتورة بالمبيعات
        // -------------------------------------------------

        await tx.sales.update({
          where: {
            id: sales.id,
          },

          data: {
            invoiceId:
              invoice.id,
          },
        });

        return {
          sales,
          invoice,
        };
      }
    );

    // =====================================================
    // حساب المبلغ المتبقي
    // =====================================================

    const remainingAmount =
      result.invoice.total -
      result.invoice.paidAmount;

    // =====================================================
    // Response
    // =====================================================

    return NextResponse.json({
      message:
        'تم إدخال المبيعات بنجاح',

      sales:
        result.sales,

      invoice: {
        ...result.invoice,

        remainingAmount,
      },
    });

  } catch (error) {

    console.error(
      'Error creating sales:',
      error
    );

    // =====================================================
    // معالجة خطأ رقم الهاتف المكرر
    // =====================================================

    if (
      error instanceof Error &&
      error.message.includes(
        'Unique constraint'
      )
    ) {
      return NextResponse.json(
        {
          message:
            'رقم هاتف العميل مستخدم بالفعل',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message:
          'حدث خطأ في الخادم: ' +
          (
            error instanceof Error
              ? error.message
              : 'خطأ غير معروف'
          ),
      },
      { status: 500 }
    );
  }
}

// =====================================================
// GET
// =====================================================

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
    const url =
      new URL(request.url);

    const startDate =
      url.searchParams.get(
        'startDate'
      );

    const endDate =
      url.searchParams.get(
        'endDate'
      );

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

    // =====================================================
    // إضافة بيانات الدفع لكل عملية
    // =====================================================

    const salesWithPayment =
      sales.map((sale) => {

        const invoice =
          sale.invoice;

        const remainingAmount =
          invoice
            ? invoice.total -
              invoice.paidAmount
            : sale.total -
              sale.paidAmount;

        return {
          ...sale,

          remainingAmount,

          paymentStatus:
            invoice?.paymentStatus ??
            (
              sale.paidAmount === 0
                ? 'UNPAID'
                : sale.paidAmount <
                    sale.total
                  ? 'PARTIAL'
                  : 'PAID'
            ),
        };
      });

    // =====================================================
    // الإحصائيات
    // =====================================================

    const totalRevenue =
      sales.reduce(
        (sum, sale) =>
          sum + sale.total,
        0
      );

    const totalPaid =
      sales.reduce(
        (sum, sale) =>
          sum + sale.paidAmount,
        0
      );

    const totalRemaining =
      sales.reduce(
        (sum, sale) =>
          sum +
          (
            sale.total -
            sale.paidAmount
          ),
        0
      );

    const totalTrays =
      sales.reduce(
        (sum, sale) =>
          sum + sale.trayCount,
        0
      );

    // =====================================================
    // Response
    // =====================================================

    return NextResponse.json({
      sales:
        salesWithPayment,

      stats: {
        totalRevenue,
        totalPaid,
        totalRemaining,
        totalTrays,
        totalOrders:
          sales.length,
      },
    });

  } catch (error) {

    console.error(
      'Error fetching sales:',
      error
    );

    return NextResponse.json(
      {
        message:
          'حدث خطأ في الخادم',
      },
      { status: 500 }
    );
  }
}