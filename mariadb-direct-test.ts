import "dotenv/config";
import mariadb from "mariadb";

const config = {
  host: process.env.DATABASE_HOST!,
  port: Number(process.env.DATABASE_PORT || 3306),
  user: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  database: process.env.DATABASE_NAME!,
  connectTimeout: 10000,
};

async function main() {
  console.log("==============================================");
  console.log("       DIRECT MARIADB CONNECTION TEST");
  console.log("==============================================");

  console.log("\nConfiguration:");
  console.log("host           :", config.host);
  console.log("port           :", config.port);
  console.log("user           :", config.user);
  console.log("database       :", config.database);
  console.log("connectTimeout :", config.connectTimeout);

  const started = Date.now();

  let connection;

  try {
    console.log("\nConnecting directly to MariaDB...");

    connection = await mariadb.createConnection(config);

    console.log(
      `✅ MariaDB connection established in ${Date.now() - started} ms`
    );

    const result = await connection.query("SELECT 1 AS result");

    console.log("Query result:", result);

    const status = await connection.query(`
      SELECT
        USER() AS user,
        CURRENT_USER() AS currentUser,
        DATABASE() AS databaseName,
        @@hostname AS hostname,
        @@port AS port,
        @@wait_timeout AS waitTimeout,
        @@interactive_timeout AS interactiveTimeout
    `);

    console.log("\n========== DATABASE INFO ==========");
    console.table(status);

    console.log("\nClosing connection...");

    await connection.end();

    console.log("✅ Connection closed successfully");

  } catch (error) {
    console.error("\n❌ DIRECT MARIADB CONNECTION FAILED");
    console.error(error);

    if (connection) {
      try {
        await connection.end();
      } catch {}
    }

    process.exitCode = 1;
  }
}

main();