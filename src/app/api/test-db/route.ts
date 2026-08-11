import { NextResponse } from "next/server";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../../../generated/prisma/client";

export const runtime = "nodejs";

export async function GET() {
  let prisma: PrismaClient | undefined;

  try {
    console.log("TEST DB: starting");

    const adapter = new PrismaMariaDb({
      host: process.env.DATABASE_HOST!,
      port: Number(process.env.DATABASE_PORT ?? 3306),
      user: process.env.DATABASE_USER!,
      password: process.env.DATABASE_PASSWORD!,
      database: process.env.DATABASE_NAME!,
      connectionLimit: 5,
      ssl: {
        rejectUnauthorized: false,
      },
      connectTimeout: 10000,
      logger: {
        error: (error) =>
          console.error("PrismaAdapterError:", error),

        warning: (info) =>
          console.warn("PrismaAdapterWarning:", info),

        network: (info) =>
          console.log("PrismaAdapterNetwork:", info),
      },
    });

    prisma = new PrismaClient({
      adapter,
    });

    console.log("TEST DB: PrismaClient created");

    const result = await prisma.$queryRaw<
      { test: number }[]
    >`SELECT 1 AS test`;

    console.log("TEST DB: query successful");

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      result,
    });
  } catch (error) {
    console.error("TEST DB ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect();
        console.log("TEST DB: Prisma disconnected");
      } catch (error) {
        console.error(
          "TEST DB DISCONNECT ERROR:",
          error
        );
      }
    }
  }
}