import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';


// =====================================================
// GET - All Invoices + Receivables
// =====================================================

export async function GET(
  request: NextRequest
) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      {
        message: 'غير مصرح',
      },
      {
        status: 401,
      }
    );
  }

  try {
    // ===================================================
    // 1. جلب جميع الفواتير
    // ===================================================

    const invoices =
      await prisma.invoice.findMany({
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },

        orderBy: {
          date: 'desc',
        },
      });


    // ===================================================
    // 2. تجهيز جميع الفواتير
    // ===================================================

    const formattedInvoices =
      invoices.map((invoice) => {
        const total =
          Number(invoice.total);

        const paidAmount =
          Number(invoice.paidAmount ?? 0);

        const remainingAmount =
          Math.max(
            total - paidAmount,
            0
          );

        return {
          id: invoice.id,

          number: invoice.number,

          date: invoice.date,

          createdAt: invoice.createdAt,

          total,

          paidAmount,

          remainingAmount,

          paymentStatus:
            invoice.paymentStatus,

          customer:
            invoice.customer,
        };
      });


    // ===================================================
    // 3. الفواتير المكتملة
    // ===================================================

    const completedInvoices =
      formattedInvoices.filter(
        (invoice) =>
          invoice.remainingAmount <= 0 ||
          invoice.paymentStatus === 'PAID'
      );


    // ===================================================
    // 4. الفواتير المستحقة
    //
    // كل فاتورة لديها مبلغ متبقٍ
    // ===================================================

    const outstandingInvoices =
      formattedInvoices.filter(
        (invoice) =>
          invoice.remainingAmount > 0 &&
          invoice.paymentStatus !== 'PAID'
      );


    // ===================================================
    // 5. قيمة الفواتير المكتملة
    // ===================================================

    const completedInvoiceValue =
      completedInvoices.reduce(
        (sum, invoice) =>
          sum + invoice.total,
        0
      );


    // ===================================================
    // 6. إجمالي المبلغ المستحق للتحصيل
    // ===================================================

    const outstandingAmount =
      outstandingInvoices.reduce(
        (sum, invoice) =>
          sum + invoice.remainingAmount,
        0
      );


    // ===================================================
    // 7. العملاء المدينون
    // ===================================================

    const outstandingCustomerIds =
      new Set(
        outstandingInvoices
          .map(
            (invoice) =>
              invoice.customer?.id
          )
          .filter(Boolean)
      );


    // ===================================================
    // 8. إجمالي قيمة جميع الفواتير
    // ===================================================

    const totalInvoiceValue =
      formattedInvoices.reduce(
        (sum, invoice) =>
          sum + invoice.total,
        0
      );


    // ===================================================
    // 9. إجمالي المدفوع لجميع الفواتير
    // ===================================================

    const totalPaidAmount =
      formattedInvoices.reduce(
        (sum, invoice) =>
          sum + invoice.paidAmount,
        0
      );


    // ===================================================
    // 10. Response
    // ===================================================

    return NextResponse.json({

      // =================================================
      // الإحصائيات
      // =================================================

      summary: {

        // جميع الفواتير
        totalInvoices:
          formattedInvoices.length,

        // قيمة جميع الفواتير
        totalInvoiceValue,

        // إجمالي المدفوع
        totalPaidAmount,

        // الفواتير المكتملة
        completedInvoicesCount:
          completedInvoices.length,

        // قيمة الفواتير المكتملة
        completedInvoiceValue,

        // الفواتير المستحقة
        outstandingInvoicesCount:
          outstandingInvoices.length,

        // المبلغ المتبقي للتحصيل
        outstandingAmount,

        // عدد العملاء المدينين
        outstandingCustomersCount:
          outstandingCustomerIds.size,
      },


      // =================================================
      // جميع الفواتير
      //
      // تستخدم في تبويب "الفواتير"
      // =================================================

      invoices:
        formattedInvoices,


      // =================================================
      // الفواتير المستحقة فقط
      //
      // تستخدم في تبويب "المستحقات"
      // =================================================

      receivables:
        outstandingInvoices,

    });

  } catch (error) {

    console.error(
      'Error fetching invoices:',
      error
    );

    return NextResponse.json(
      {
        message:
          'حدث خطأ أثناء جلب الفواتير',
      },
      {
        status: 500,
      }
    );
  }
}