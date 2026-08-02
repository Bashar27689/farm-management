// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from '../../../lib/auth';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [production, sales, supplies, customers] = await Promise.all([
      prisma.production.aggregate({
        where: { date: { gte: today, lt: tomorrow } },
        _sum: { eggCount: true }
      }),
      prisma.sales.aggregate({
        where: { date: { gte: today, lt: tomorrow } },
        _sum: { total: true, trayCount: true }
      }),
      prisma.supply.aggregate({
        _sum: { price: true },
        _count: true
      }),
      prisma.customer.count()
    ]);

    const recentSales = await prisma.sales.findMany({
      include: { customer: true },
      orderBy: { date: 'desc' },
      take: 5
    });

    const recentProduction = await prisma.production.findMany({
      orderBy: { date: 'desc' },
      take: 5
    });
    const recentSupplies = await prisma.supply.findMany({
      orderBy: { date: 'desc' },
      take: 5
    });

    return NextResponse.json({
      today: {
        eggs: production._sum.eggCount || 0,
        revenue: sales._sum.total || 0,
        trays: sales._sum.trayCount || 0
      },
      total: {
        customers,
        supplies: supplies._count,
        supplyCost: supplies._sum.price || 0
      },
      recent: {
        sales: recentSales,
        production: recentProduction,
        supplies: recentSupplies
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}