import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';


// =====================================================
// GET - Get Invoice Payments
// =====================================================

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: 'غير مصرح',
      },
      {
        status: 401,
      }
    );
  }

  try {
    const { id } = await context.params;

    const invoice = await prisma.invoice.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        number: true,
        date: true,
        total: true,
        paidAmount: true,
        paymentStatus: true,

        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },

        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          message: 'الفاتورة غير موجودة',
        },
        {
          status: 404,
        }
      );
    }

    const total = Number(invoice.total);
    const paidAmount = Number(invoice.paidAmount);

    const remainingAmount = Math.max(
      total - paidAmount,
      0
    );

    return NextResponse.json({
      success: true,

      invoice: {
        ...invoice,
        total,
        paidAmount,
        remainingAmount,
      },
    });

  } catch (error) {
    console.error(
      'GET /api/invoices/[id]/payments error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'حدث خطأ أثناء جلب سجل الدفعات',
      },
      {
        status: 500,
      }
    );
  }
}


// =====================================================
// POST - Add Invoice Payment
// =====================================================

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: 'غير مصرح',
      },
      {
        status: 401,
      }
    );
  }

  try {
    const { id } = await context.params;

    // =================================================
    // Read Request Body
    // =================================================

    let body: {
      amount?: unknown;
      paymentDate?: unknown;
      note?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'بيانات الطلب غير صالحة',
        },
        {
          status: 400,
        }
      );
    }

    const {
      amount,
      paymentDate,
      note,
    } = body;


    // =================================================
    // Validate Amount
    // =================================================

    const parsedAmount = Number(amount);

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'مبلغ الدفعة يجب أن يكون رقماً أكبر من صفر',
        },
        {
          status: 400,
        }
      );
    }


    // =================================================
    // Validate Payment Date
    // =================================================

    let parsedPaymentDate = new Date();

if (paymentDate) {
  const dateOnly = String(paymentDate).trim();

  // Validate YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return NextResponse.json(
      {
        message: 'تاريخ الدفعة غير صالح',
      },
      {
        status: 400,
      }
    );
  }

  const [year = 0, month = 0, day = 0] = dateOnly
    .split('-')
    .map(Number);

  // Create local date instead of UTC date
  parsedPaymentDate = new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0,
    0
  );

  if (
    Number.isNaN(
      parsedPaymentDate.getTime()
    )
  ) {
    return NextResponse.json(
      {
        message: 'تاريخ الدفعة غير صالح',
      },
      {
        status: 400,
      }
    );
  }
}


    // =================================================
    // Transaction
    // =================================================

    const result = await prisma.$transaction(
      async (tx) => {

        // =============================================
        // Find Invoice
        // =============================================

        const invoice =
          await tx.invoice.findUnique({
            where: {
              id,
            },

            select: {
              id: true,
              number: true,
              total: true,
              paidAmount: true,
              paymentStatus: true,

              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          });


        if (!invoice) {
          throw new Error(
            'INVOICE_NOT_FOUND'
          );
        }


        // =============================================
        // Convert Prisma Decimal Safely
        // =============================================

        const total =
          Number(invoice.total);

        const currentPaidAmount =
          Number(invoice.paidAmount);


        if (
          !Number.isFinite(total) ||
          !Number.isFinite(currentPaidAmount)
        ) {
          throw new Error(
            'INVALID_INVOICE_AMOUNT'
          );
        }


        // =============================================
        // Calculate Remaining Amount
        // =============================================

        const remainingAmount = Math.max(
          total - currentPaidAmount,
          0
        );


        // =============================================
        // Already Fully Paid
        // =============================================

        if (remainingAmount <= 0) {
          throw new Error(
            'INVOICE_ALREADY_PAID'
          );
        }


        // =============================================
        // Payment Bigger Than Remaining
        // =============================================

        if (
          parsedAmount >
          remainingAmount
        ) {
          throw new Error(
            'PAYMENT_EXCEEDS_REMAINING'
          );
        }


        // =============================================
        // Calculate New Paid Amount
        // =============================================

        const newPaidAmount =
          currentPaidAmount +
          parsedAmount;


        // =============================================
        // Calculate New Payment Status
        // =============================================

        let paymentStatus:
          | 'UNPAID'
          | 'PARTIAL'
          | 'PAID';

        if (
          newPaidAmount >= total
        ) {
          paymentStatus = 'PAID';
        } else if (
          newPaidAmount > 0
        ) {
          paymentStatus = 'PARTIAL';
        } else {
          paymentStatus = 'UNPAID';
        }


        // =============================================
        // Create Payment
        // =============================================

        let payment;

        try {
          payment =
            await tx.invoicePayment.create({
              data: {
                invoiceId: invoice.id,

                amount: parsedAmount,

                paymentDate:
                  parsedPaymentDate,

                note:
                  note !== undefined &&
                  note !== null &&
                  String(note).trim() !== ''
                    ? String(note).trim()
                    : null,
              },
            });

        } catch (paymentError) {

          console.error(
            'CREATE INVOICE PAYMENT ERROR:',
            paymentError
          );

          throw paymentError;
        }


        // =============================================
        // Update Invoice
        // =============================================

        let updatedInvoice;

        try {
          updatedInvoice =
            await tx.invoice.update({
              where: {
                id: invoice.id,
              },

              data: {
                paidAmount:
                  newPaidAmount,

                paymentStatus,
              },

              select: {
                id: true,
                number: true,
                date: true,
                total: true,
                paidAmount: true,
                paymentStatus: true,

                customer: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                  },
                },
              },
            });

        } catch (invoiceUpdateError) {

          console.error(
            'UPDATE INVOICE PAYMENT ERROR:',
            invoiceUpdateError
          );

          throw invoiceUpdateError;
        }


        // =============================================
        // Return Result
        // =============================================

        return {
          payment,

          invoice: {
            ...updatedInvoice,

            total:
              Number(updatedInvoice.total),

            paidAmount:
              Number(updatedInvoice.paidAmount),

            remainingAmount:
              Math.max(
                Number(updatedInvoice.total) -
                  Number(updatedInvoice.paidAmount),
                0
              ),
          },
        };
      }
    );


    // =================================================
    // Success Response
    // =================================================

    return NextResponse.json(
      {
        success: true,

        message:
          'تم تسجيل الدفعة بنجاح',

        ...result,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.error(
      'POST /api/invoices/[id]/payments ERROR:',
      error
    );


    // =================================================
    // Known Application Errors
    // =================================================

    if (
      error instanceof Error
    ) {

      if (
        error.message ===
        'INVOICE_NOT_FOUND'
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'الفاتورة غير موجودة',
          },
          {
            status: 404,
          }
        );
      }


      if (
        error.message ===
        'INVOICE_ALREADY_PAID'
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'هذه الفاتورة مكتملة الدفع بالفعل',
          },
          {
            status: 400,
          }
        );
      }


      if (
        error.message ===
        'PAYMENT_EXCEEDS_REMAINING'
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'مبلغ الدفعة أكبر من المبلغ المتبقي على الفاتورة',
          },
          {
            status: 400,
          }
        );
      }


      if (
        error.message ===
        'INVALID_INVOICE_AMOUNT'
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'قيمة إجمالي الفاتورة أو المبلغ المدفوع غير صالحة',
          },
          {
            status: 400,
          }
        );
      }
    }


    // =================================================
    // IMPORTANT:
    // Return Real Error For Debugging
    // =================================================

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);


    console.error(
      'FINAL PAYMENT ERROR:',
      errorMessage
    );


    return NextResponse.json(
      {
        success: false,

        message:
          'حدث خطأ أثناء تسجيل الدفعة',

        error:
          errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}