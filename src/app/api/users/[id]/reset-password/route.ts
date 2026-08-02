// src/app/api/users/[id]/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword,getCurrentUser } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'غير مصرح - هذه الميزة للمدير فقط' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password || password.length < 6) {
      return NextResponse.json(
        { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: params.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      message: 'تم إعادة تعيين كلمة المرور بنجاح',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}