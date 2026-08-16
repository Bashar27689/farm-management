import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST!,
  port: Number(process.env.DATABASE_PORT || 3306),
  user: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  database: process.env.DATABASE_NAME!,

  // عدد الاتصالات لكل Prisma Client
  connectionLimit: 5,

  // مهلة انتظار الحصول على connection
  acquireTimeout: 30000,

  // مهلة إنشاء الاتصال
  connectTimeout: 10000,

  // إغلاق الاتصالات الخاملة بعد فترة
  idleTimeout: 300,

  ssl: {
    rejectUnauthorized: false,
  },

  allowPublicKeyRetrieval: true,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

// مهم جدًا على Hostinger
// نحتفظ بنفس Prisma Client حتى في Production
globalForPrisma.prisma = prisma;