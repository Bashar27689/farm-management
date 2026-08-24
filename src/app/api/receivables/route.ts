// src/app/api/receivables/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '../../../lib/prisma';

import { getCurrentUser } from '../../../lib/auth';


// =====================================================
// GET - Receivables
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
    // جلب الفواتير التي عليها مبلغ متبقٍ
    // ===================================================

    const invoices =
      await prisma.invoice.findMany({
        where: {
          paymentStatus: {
            in: [
              'UNPAID',
              'PARTIAL',
            ],
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
    // إزالة الفواتير التي لا يوجد عليها مبلغ متبقٍ
    // ===================================================

    const outstandingInvoices =
      invoices
        .map((invoice) => {

          const remainingAmount =
            Math.max(
              invoice.total -
                invoice.paidAmount,
              0
            );

          return {
            id: invoice.id,

            number: invoice.number,

            date: invoice.date,

            total: invoice.total,

            paidAmount:
              invoice.paidAmount,

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
    // تجميع الفواتير حسب العميل
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
          invoices: typeof outstandingInvoices;
        }
      >();


    for (
      const invoice of outstandingInvoices
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
    // تحويل Map إلى Array
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
    // الإحصائيات العامة
    // ===================================================

    const totalOutstanding =
      outstandingInvoices.reduce(
        (
          sum,
          invoice
        ) =>
          sum +
          invoice.remainingAmount,
        0
      );


    const totalInvoices =
      outstandingInvoices.length;


    const totalCustomers =
      customers.length;


    const totalInvoiceValue =
      outstandingInvoices.reduce(
        (
          sum,
          invoice
        ) =>
          sum +
          invoice.total,
        0
      );


    const totalPaidAmount =
      outstandingInvoices.reduce(
        (
          sum,
          invoice
        ) =>
          sum +
          invoice.paidAmount,
        0
      );


    // ===================================================
    // Response
    // ===================================================

    return NextResponse.json({

      summary: {

        totalOutstanding,

        totalCustomers,

        totalInvoices,

        totalInvoiceValue,

        totalPaidAmount,

      },

      customers,

      invoices:
        outstandingInvoices,

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