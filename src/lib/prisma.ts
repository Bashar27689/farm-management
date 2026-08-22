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

    // Small pool for Hostinger shared hosting
    connectionLimit: 5,

    // Maximum time to wait for a connection
    acquireTimeout: 60000,

    // Maximum time to establish a new connection
    connectTimeout: 15000,

    // Must be lower than MySQL wait_timeout (20 seconds)
    idleTimeout: 10,

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

globalForPrisma.prisma = prisma;