import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/client";

const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_HOST!,
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD!,
    database: process.env.DATABASE_NAME!,

    // نفس إعدادات التطبيق الحالية
    connectionLimit: 5,
    acquireTimeout: 30000,
    connectTimeout: 10000,
    idleTimeout: 300,

    ssl: {
        rejectUnauthorized: false,
    },

    allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({
    adapter,
});

function sleep(seconds: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000);
    });
}

async function queryDatabase(label: string) {
    const start = Date.now();

    try {
        const result = await prisma.$queryRaw<
            Array<{
                value: number;
            }>
        >`SELECT 1 AS value`;

        const duration = Date.now() - start;

        console.log(
            `✅ ${label} | ${duration} ms | result=${result[0]?.value}`
        );

        return true;
    } catch (error) {
        const duration = Date.now() - start;

        console.error(
            `❌ ${label} | ${duration} ms`
        );

        console.error(error);

        return false;
    }
}

async function showConnectionInfo() {
    try {
        const result = await prisma.$queryRaw<
            Array<{
                user: string;
                currentUser: string;
                database: string | null;
                hostname: string;
                port: number;
                waitTimeout: number;
                interactiveTimeout: number;
            }>
        >`
            SELECT
                USER() AS user,
                CURRENT_USER() AS currentUser,
                DATABASE() AS database,
                @@hostname AS hostname,
                @@port AS port,
                @@wait_timeout AS waitTimeout,
                @@interactive_timeout AS interactiveTimeout
        `;

        console.log("\n========== DATABASE INFO ==========");

        console.table(result);

        console.log("===================================\n");
    } catch (error) {
        console.error("❌ Could not read database information");
        console.error(error);
    }
}

async function main() {
    console.log("\n");
    console.log("==============================================");
    console.log("       PRISMA MARIADB CONNECTION TEST");
    console.log("==============================================");

    console.log("\nPool configuration:");
    console.log("connectionLimit : 5");
    console.log("acquireTimeout  : 30000 ms");
    console.log("connectTimeout  : 10000 ms");
    console.log("idleTimeout     : 300 seconds");

    console.log("\n----------------------------------------------");
    console.log("TEST 1 - Initial connection");
    console.log("----------------------------------------------");

    const first = await queryDatabase("Initial query");

    if (!first) {
        throw new Error("Initial database connection failed.");
    }

    await showConnectionInfo();

    const tests = [
        5,
        15,
        25,
        35,
    ];

    for (const seconds of tests) {
        console.log("\n----------------------------------------------");
        console.log(`TEST - Idle for ${seconds} seconds`);
        console.log("----------------------------------------------");

        console.log(
            `⏳ Waiting ${seconds} seconds without database activity...`
        );

        await sleep(seconds);

        await queryDatabase(
            `Query after ${seconds}s idle`
        );
    }

    console.log("\n----------------------------------------------");
    console.log("FINAL TEST");
    console.log("----------------------------------------------");

    await queryDatabase("Final query");

    console.log("\n==============================================");
    console.log("Test completed.");
    console.log("==============================================\n");

    await prisma.$disconnect();

    console.log("Prisma disconnected.");
}

main()
    .catch(async (error) => {
        console.error("\n==============================================");
        console.error("FATAL TEST ERROR");
        console.error("==============================================");

        console.error(error);

        try {
            await prisma.$disconnect();
        } catch {
            // Ignore disconnect error
        }

        process.exit(1);
    });