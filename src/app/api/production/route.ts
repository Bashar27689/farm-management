// src/app/api/production/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const { eggCount, date } = await request.json();

    if (!eggCount || !date) {
      return NextResponse.json(
        { message: 'عدد البيض والتاريخ مطلوبان' },
        { status: 400 }
      );
    }

    const existing = await prisma.production.findFirst({
      where: { date: new Date(date) }
    });

    if (existing) {
      return NextResponse.json(
        { message: 'تم إدخال الإنتاج لهذا اليوم مسبقاً' },
        { status: 400 }
      );
    }

    const production = await prisma.production.create({
      data: {
        eggCount: parseInt(eggCount),
        date: new Date(date),
      }
    });

    return NextResponse.json({
      message: 'تم إدخال الإنتاج بنجاح',
      production
    });
  } catch (error) {
    console.error('Error creating production:', error);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const where: any = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const productions = await prisma.production.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    const totalEggs = productions.reduce((sum, p) => sum + p.eggCount, 0);

    return NextResponse.json({
      productions,
      stats: {
        totalEggs,
        average: productions.length > 0 ? Math.round(totalEggs / productions.length) : 0,
        count: productions.length
      }
    });
  } catch (error) {
    console.error('Error fetching productions:', error);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
  }

  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      { message: 'غير مصرح - هذه الميزة للمدير فقط' },
      { status: 403 }
    );
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'معرف الإنتاج مطلوب' },
        { status: 400 }
      );
    }

    await prisma.production.delete({ where: { id } });
    return NextResponse.json({ message: 'تم الحذف بنجاح' });
  } catch (error) {
    console.error('Error deleting production:', error);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}