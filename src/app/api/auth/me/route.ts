// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
    const user =  getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

  try {
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        id: true, 
        username: true, 
        name: true, 
        role: true 
      }
    });

    return NextResponse.json(fullUser);
  } catch (error) {
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}