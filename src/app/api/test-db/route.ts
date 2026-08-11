import { NextResponse } from "next/server";
import mariadb from "mariadb";

export const runtime = "nodejs";

export async function GET() {
  let connection;

  try {
connection = await mariadb.createConnection({
  host: process.env.DATABASE_HOST!,
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  database: process.env.DATABASE_NAME!,
  connectTimeout: 10000,
});
    const result = await connection.query("SELECT 1 AS test");

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("DIRECT DB ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}