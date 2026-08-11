import { NextResponse } from "next/server";
import mariadb from "mariadb";

export const runtime = "nodejs";

export async function GET() {
  let connection;

  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "DATABASE_URL is not defined",
        },
        { status: 500 }
      );
    }

    console.log("TEST DB: DATABASE_URL exists");

    connection = await mariadb.createConnection(databaseUrl);

    console.log("TEST DB: connection established");

    const result = await connection.query("SELECT 1 AS test");

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("TEST DB ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log("TEST DB: connection closed");
      } catch (error) {
        console.error("TEST DB CLOSE ERROR:", error);
      }
    }
  }
}