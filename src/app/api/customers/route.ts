// src/app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';


export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}