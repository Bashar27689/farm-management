// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { verifyPassword, generateToken } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "يرجى إدخال اسم المستخدم وكلمة المرور" },
        { status: 400 },
      );
    }
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { message: "اسم المستخدم أو كلمة المرور غير صحيحة" },
        { status: 401 },
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { message: "اسم المستخدم أو كلمة المرور غير صحيحة" },
        { status: 401 },
      );
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      message: "تم تسجيل الدخول بنجاح",
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
