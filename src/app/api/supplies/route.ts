// src/app/api/supplies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const { type, name, quantity, price, date, expiryDate } = await request.json();

    if (!type || !name || !quantity || !price || !date) {
      return NextResponse.json(
        { message: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    const supply = await prisma.supply.create({
      data: {
        type,
        name,
        quantity: parseInt(quantity),
        price: parseInt(price),
        date: new Date(date),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      }
    });

    return NextResponse.json({
      message: 'تم إدخال المستلزمات بنجاح',
      supply
    });
  } catch (error) {
    console.error('Error creating supply:', error);
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
    const supplies = await prisma.supply.findMany({
      orderBy: { date: 'desc' }
    });

const totalCost = supplies.reduce(
  (
    sum: number,
    s: {
      price: number;
      quantity: number;
    }
  ) => sum + (s.price * s.quantity),
  0
);
    return NextResponse.json({
      supplies,
      stats: {
        totalCost,
        totalItems: supplies.length,
      byType: {
  FEED: supplies.filter(
    (s: { type: string }) => s.type === "FEED"
  ).length,

  VACCINE: supplies.filter(
    (s: { type: string }) => s.type === "VACCINE"
  ).length,

  OTHER: supplies.filter(
    (s: { type: string }) => s.type === "OTHER"
  ).length,
}
      }
    });
  } catch (error) {
    console.error('Error fetching supplies:', error);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}