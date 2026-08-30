// src/app/api/dashboard/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';

export async function GET(request: NextRequest) {
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
    // ==========================================
    // تاريخ اليوم
    // ==========================================

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    // ==========================================
    // إحصائيات اليوم + آخر العمليات + المستحقات
    // ==========================================

    const [
      production,
      sales,
      recentSales,
      recentProduction,
      receivables,
    ] = await Promise.all([

      // ==========================================
      // إنتاج اليوم
      // ==========================================

      prisma.production.aggregate({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
        },

        _sum: {
          eggCount: true,
        },
      }),

      // ==========================================
      // مبيعات اليوم
      // ==========================================

      prisma.sales.aggregate({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
        },

        _sum: {
          total: true,
          trayCount: true,
        },
      }),

      // ==========================================
      // آخر 5 مبيعات
      // ==========================================

      prisma.sales.findMany({
        include: {
          customer: true,
        },

        orderBy: {
          date: 'desc',
        },

        take: 5,
      }),

      // ==========================================
      // آخر 5 إنتاج
      // ==========================================

      prisma.production.findMany({
        orderBy: {
          date: 'desc',
        },

        take: 5,
      }),

      // ==========================================
      // أعلى 5 فواتير مستحقة
      // ==========================================

      prisma.invoice.findMany({
        where: {
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

        take: 5,
      }),
    ]);

    // ==========================================
    // تجهيز المستحقات
    // ==========================================

    const formattedReceivables = receivables
      .map((invoice) => ({
        id: invoice.id,
        date: invoice.date,
        customer: invoice.customer,
        total: invoice.total,
        paidAmount: invoice.paidAmount,
        remainingAmount:
          invoice.total - invoice.paidAmount,
        paymentStatus: invoice.paymentStatus,
      }))
      .filter(
        (invoice) =>
          invoice.remainingAmount > 0
      )
      .sort(
        (a, b) =>
          b.remainingAmount -
          a.remainingAmount
      );

    // ==========================================
    // Response
    // ==========================================

    return NextResponse.json({
      today: {
        eggs:
          production._sum.eggCount || 0,

        revenue:
          sales._sum.total || 0,

        trays:
          sales._sum.trayCount || 0,
      },

      recent: {
        sales: recentSales,
        production: recentProduction,
      },

      receivables: {
        invoices:
          formattedReceivables,

        count:
          formattedReceivables.length,

        totalAmount:
          formattedReceivables.reduce(
            (sum, invoice) =>
              sum + invoice.remainingAmount,
            0
          ),
      },
    });
  } catch (error) {
    console.error(
      'Error fetching dashboard:',
      error
    );

    return NextResponse.json(
      {
        message:
          'حدث خطأ في الخادم',
      },
      {
        status: 500,
      }
    );
  }
}