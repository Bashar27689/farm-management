import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      error: String(error),
    });
  }
}