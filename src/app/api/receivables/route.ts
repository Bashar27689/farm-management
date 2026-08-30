// src/app/api/receivables/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { prisma } from '../../../lib/prisma';

import {
  getCurrentUser,
} from '../../../lib/auth';


// =====================================================
// GET - Receivables
// =====================================================

export async function GET(
  request: NextRequest
) {
  const user =
    getCurrentUser(request);

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
    // 1. جلب الفواتير غير المكتملة فقط
    //
    // لا نجلب الفواتير PAID هنا نهائياً.
    // ===================================================

    const outstandingInvoices =
      await prisma.invoice.findMany({
        where: {
          paymentStatus: {
            in: [
              'UNPAID',
              'PARTIAL',
            ],
          },

          // تأكيد إضافي:
          // يجب أن يكون هناك مبلغ متبقٍ
          paidAmount: {
            lt: prisma.invoice.fields.total,
          },
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

        orderBy: {
          date: 'desc',
        },
      });


    // ===================================================
    // 2. تنظيف البيانات
    //
    // أي فاتورة لا يوجد عليها مبلغ متبقٍ لن تظهر.
    // ===================================================

    const invoices =
      outstandingInvoices
        .map((invoice) => {

          const total =
            Number(invoice.total);

          const paidAmount =
            Number(
              invoice.paidAmount ?? 0
            );

          const remainingAmount =
            Math.max(
              total -
                paidAmount,
              0
            );

          return {
            id: invoice.id,

            number: invoice.number,

            date: invoice.date,

            total,

            paidAmount,

            remainingAmount,

            paymentStatus:
              invoice.paymentStatus,

            customer:
              invoice.customer,
          };
        })
        .filter(
          (invoice) =>
            invoice.remainingAmount > 0
        );


    // ===================================================
    // 3. حساب عدد الفواتير المكتملة فقط
    //
    // PAID لا تدخل في customers
    // ولا تدخل في invoices
    //
    // نحتاج عددها فقط.
    // ===================================================

    const completedInvoicesCount =
      await prisma.invoice.count({
        where: {
          paymentStatus: 'PAID',
        },
      });


    // ===================================================
    // 4. تجميع الفواتير غير المكتملة حسب العميل
    // ===================================================

    const customersMap =
      new Map<
        string,
        {
          id: string;
          name: string;
          phone: string | null;
          invoiceCount: number;
          total: number;
          paidAmount: number;
          remainingAmount: number;
          invoices: typeof invoices;
        }
      >();


    for (
      const invoice of invoices
    ) {

      const customerId =
        invoice.customer.id;


      const existing =
        customersMap.get(
          customerId
        );


      if (existing) {

        existing.invoiceCount += 1;

        existing.total +=
          invoice.total;

        existing.paidAmount +=
          invoice.paidAmount;

        existing.remainingAmount +=
          invoice.remainingAmount;

        existing.invoices.push(
          invoice
        );

      } else {

        customersMap.set(
          customerId,
          {
            id:
              invoice.customer.id,

            name:
              invoice.customer.name,

            phone:
              invoice.customer.phone,

            invoiceCount: 1,

            total:
              invoice.total,

            paidAmount:
              invoice.paidAmount,

            remainingAmount:
              invoice.remainingAmount,

            invoices: [
              invoice,
            ],
          }
        );
      }
    }


    // ===================================================
    // 5. تحويل Map إلى Array
    // ===================================================

    const customers =
      Array.from(
        customersMap.values()
      ).sort(
        (a, b) =>
          b.remainingAmount -
          a.remainingAmount
      );


    // ===================================================
    // 6. إجمالي المستحقات
    // ===================================================

    const totalOutstanding =
      invoices.reduce(
        (
          sum,
          invoice
        ) =>
          sum +
          invoice.remainingAmount,
        0
      );


    // ===================================================
    // 7. عدد الفواتير غير المكتملة
    // ===================================================

    const totalInvoices =
      invoices.length;


    // ===================================================
    // 8. عدد العملاء المدينين
    // ===================================================

    const totalCustomers =
      customers.length;


    // ===================================================
    // 9. إجمالي قيمة الفواتير غير المكتملة
    // ===================================================

    const totalInvoiceValue =
      invoices.reduce(
        (
          sum,
          invoice
        ) =>
          sum +
          invoice.total,
        0
      );


    // ===================================================
    // 10. إجمالي المدفوع من الفواتير غير المكتملة
    // ===================================================

    const totalPaidAmount =
      invoices.reduce(
        (
          sum,
          invoice
        ) =>
          sum +
          invoice.paidAmount,
        0
      );


    // ===================================================
    // 11. Response
    // ===================================================

    return NextResponse.json({

      summary: {

        // إجمالي المبالغ المتبقية
        totalOutstanding,

        // عدد العملاء الذين عليهم مبالغ
        totalCustomers,

        // عدد الفواتير غير المكتملة
        totalInvoices,

        // إجمالي قيمة الفواتير غير المكتملة
        totalInvoiceValue,

        // إجمالي المدفوع من الفواتير غير المكتملة
        totalPaidAmount,

        // عدد الفواتير المكتملة
        completedInvoicesCount,

      },

      // العملاء المدينون فقط
      customers,

      // الفواتير غير المكتملة فقط
      invoices,

    });

  } catch (error) {

    console.error(
      'Error fetching receivables:',
      error
    );

    return NextResponse.json(
      {
        message:
          'حدث خطأ أثناء جلب المستحقات',
      },
      {
        status: 500,
      }
    );
  }
}