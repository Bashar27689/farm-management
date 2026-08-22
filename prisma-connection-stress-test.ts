import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/client";

const CONNECTION_LIMIT = 5;
const ACQUIRE_TIMEOUT = 30000;
const CONNECT_TIMEOUT = 10000;
const IDLE_TIMEOUT = 10;

const USERS = 3;
const REQUESTS_PER_USER = 10;

const IDLE_PERIODS = [
    5,
    15,
    25,
    35,
];

const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_HOST!,
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD!,
    database: process.env.DATABASE_NAME!,

    connectionLimit: CONNECTION_LIMIT,
    acquireTimeout: ACQUIRE_TIMEOUT,
    connectTimeout: CONNECT_TIMEOUT,
    idleTimeout: IDLE_TIMEOUT,

    ssl: {
        rejectUnauthorized: false,
    },

    allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({
    adapter,
});

interface TestResult {
    user: number;
    request: number;
    success: boolean;
    duration: number;
    error?: string;
}

const results: TestResult[] = [];

function sleep(seconds: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000);
    });
}

async function queryDatabase(
    user: number,
    request: number
): Promise<TestResult> {
    const start = Date.now();

    try {
        const result = await prisma.$queryRaw<
            Array<{ value: number }>
        >`SELECT 1 AS value`;

        const duration = Date.now() - start;

        const testResult: TestResult = {
            user,
            request,
            success: true,
            duration,
        };

        results.push(testResult);

        console.log(
            `✅ User ${user} | Request ${request} | ${duration} ms | result=${result[0]?.value}`
        );

        return testResult;
    } catch (error) {
        const duration = Date.now() - start;

        const errorMessage =
            error instanceof Error
                ? error.message
                : String(error);

        const testResult: TestResult = {
            user,
            request,
            success: false,
            duration,
            error: errorMessage,
        };

        results.push(testResult);

        console.error(
            `❌ User ${user} | Request ${request} | ${duration} ms`
        );

        console.error(errorMessage);

        return testResult;
    }
}

async function runConcurrentRequests(
    requestNumber: number
): Promise<void> {
    console.log("\n==============================================");
    console.log(
        `CONCURRENT REQUEST TEST #${requestNumber}`
    );
    console.log("==============================================");

    const start = Date.now();

    const requests: Promise<TestResult>[] = [];

    for (let user = 1; user <= USERS; user++) {
        requests.push(
            queryDatabase(
                user,
                requestNumber
            )
        );
    }

    await Promise.all(requests);

    const duration = Date.now() - start;

    console.log(
        `\n⏱ Concurrent batch completed in ${duration} ms`
    );
}

async function showDatabaseInfo(): Promise<void> {
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
                threadsConnected: number;
                threadsRunning: number;
                maxConnections: number;
            }>
        >`
            SELECT
                USER() AS user,
                CURRENT_USER() AS currentUser,
                DATABASE() AS database,
                @@hostname AS hostname,
                @@port AS port,
                @@wait_timeout AS waitTimeout,
                @@interactive_timeout AS interactiveTimeout,
                (
                    SELECT VARIABLE_VALUE
                    FROM information_schema.GLOBAL_STATUS
                    WHERE VARIABLE_NAME = 'Threads_connected'
                ) AS threadsConnected,
                (
                    SELECT VARIABLE_VALUE
                    FROM information_schema.GLOBAL_STATUS
                    WHERE VARIABLE_NAME = 'Threads_running'
                ) AS threadsRunning,
                @@max_connections AS maxConnections
        `;

        console.log("\n========== DATABASE STATUS ==========");

        console.table(result);

        console.log("=====================================\n");
    } catch (error) {
        console.error(
            "❌ Could not read database status"
        );

        console.error(error);
    }
}

async function showProcessList(): Promise<void> {
    try {
        const result = await prisma.$queryRaw<
            Array<{
                id: number;
                user: string;
                host: string;
                db: string | null;
                command: string;
                time: number;
                state: string | null;
                info: string | null;
            }>
        >`
            SELECT
                ID AS id,
                USER AS user,
                HOST AS host,
                DB AS db,
                COMMAND AS command,
                TIME AS time,
                STATE AS state,
                INFO AS info
            FROM information_schema.PROCESSLIST
            WHERE DB = ${process.env.DATABASE_NAME}
            ORDER BY TIME DESC
        `;

        console.log(
            "\n========== PROCESS LIST =========="
        );

        console.table(result);

        console.log(
            "==================================\n"
        );
    } catch (error) {
        console.error(
            "❌ Could not read PROCESSLIST"
        );

        console.error(error);
    }
}

async function printStatistics(): Promise<void> {
    console.log("\n");
    console.log("==============================================");
    console.log("             FINAL STATISTICS");
    console.log("==============================================");

    const total = results.length;

    const successful = results.filter(
        (result) => result.success
    ).length;

    const failed = results.filter(
        (result) => !result.success
    ).length;

    const durations = results.map(
        (result) => result.duration
    );

    const min =
        durations.length > 0
            ? Math.min(...durations)
            : 0;

    const max =
        durations.length > 0
            ? Math.max(...durations)
            : 0;

    const average =
        durations.length > 0
            ? Math.round(
                  durations.reduce(
                      (sum, value) =>
                          sum + value,
                      0
                  ) / durations.length
              )
            : 0;

    console.log(`Total requests : ${total}`);
    console.log(`Successful     : ${successful}`);
    console.log(`Failed         : ${failed}`);
    console.log(`Minimum        : ${min} ms`);
    console.log(`Average        : ${average} ms`);
    console.log(`Maximum        : ${max} ms`);

    console.log(
        `Success rate   : ${
            total > 0
                ? ((successful / total) * 100).toFixed(
                      2
                  )
                : "0.00"
        }%`
    );

    console.log(
        "\n----------------------------------------------"
    );

    const timeoutErrors = results.filter(
        (result) =>
            result.error?.toLowerCase().includes(
                "pool timeout"
            )
    );

    console.log(
        `Pool timeout errors: ${timeoutErrors.length}`
    );

    if (timeoutErrors.length > 0) {
        console.log(
            "\n⚠️ POOL TIMEOUT ERRORS DETECTED"
        );

        for (const error of timeoutErrors) {
            console.log(
                `User ${error.user} / Request ${error.request}`
            );

            console.log(error.error);
        }
    }

    const connectionErrors = results.filter(
        (result) =>
            result.error?.toLowerCase().includes(
                "connection"
            )
    );

    console.log(
        `Connection errors: ${connectionErrors.length}`
    );

    console.log(
        "==============================================\n"
    );
}

async function main(): Promise<void> {
    console.log("\n");
    console.log("==============================================");
    console.log("       PRISMA MARIADB STRESS TEST");
    console.log("==============================================");

    console.log("\nConfiguration:");
    console.log(
        `connectionLimit : ${CONNECTION_LIMIT}`
    );
    console.log(
        `acquireTimeout  : ${ACQUIRE_TIMEOUT} ms`
    );
    console.log(
        `connectTimeout  : ${CONNECT_TIMEOUT} ms`
    );
    console.log(
        `idleTimeout     : ${IDLE_TIMEOUT} seconds`
    );
    console.log(`Simulated users : ${USERS}`);
    console.log(
        `Requests/user   : ${REQUESTS_PER_USER}`
    );

    console.log(
        "\n=============================================="
    );
    console.log("TEST 1 - Initial connection");
    console.log(
        "=============================================="
    );

    const initial = await queryDatabase(
        0,
        0
    );

    if (!initial.success) {
        throw new Error(
            "Initial database connection failed."
        );
    }

    await showDatabaseInfo();
    await showProcessList();

    console.log(
        "\n=============================================="
    );
    console.log("TEST 2 - Concurrent users");
    console.log(
        "=============================================="
    );

    for (
        let request = 1;
        request <= REQUESTS_PER_USER;
        request++
    ) {
        await runConcurrentRequests(
            request
        );
    }

    await showDatabaseInfo();
    await showProcessList();

    console.log(
        "\n=============================================="
    );
    console.log("TEST 3 - Idle connection test");
    console.log(
        "=============================================="
    );

    for (const seconds of IDLE_PERIODS) {
        console.log(
            `\n⏳ Waiting ${seconds} seconds...`
        );

        await sleep(seconds);

        await runConcurrentRequests(
            seconds
        );

        await showDatabaseInfo();
        await showProcessList();
    }

    console.log(
        "\n=============================================="
    );
    console.log("TEST 4 - Final concurrent test");
    console.log(
        "=============================================="
    );

    await Promise.all(
        Array.from(
            { length: USERS },
            (_, index) =>
                queryDatabase(
                    index + 1,
                    999
                )
        )
    );

    await showDatabaseInfo();
    await showProcessList();

    await printStatistics();

    await prisma.$disconnect();

    console.log(
        "Prisma disconnected successfully."
    );
}

main()
    .catch(async (error) => {
        console.error("\n");
        console.error(
            "=============================================="
        );
        console.error("FATAL TEST ERROR");
        console.error(
            "=============================================="
        );

        console.error(error);

        try {
            await prisma.$disconnect();
        } catch {
            // Ignore disconnect errors
        }

        process.exit(1);
    });