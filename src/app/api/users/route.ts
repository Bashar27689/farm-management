// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { hashPassword, getCurrentUser } from '../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'غير مصرح - هذه الميزة للمدير فقط' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'غير مصرح - هذه الميزة للمدير فقط' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, name, role } = body;

    if (!username || !password || !name || !role) {
      return NextResponse.json(
        { message: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'اسم المستخدم موجود بالفعل' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: 'تم إنشاء المستخدم بنجاح',
      user: newUser,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'غير مصرح - هذه الميزة للمدير فقط' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    if (id === user.id) {
      return NextResponse.json(
        { message: 'لا يمكنك حذف حسابك الخاص' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'تم حذف المستخدم بنجاح',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}