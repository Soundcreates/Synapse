import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function runMigrations() {
  // Validate required environment variables
  const requiredEnvVars = ["DB_USER", "DB_HOST", "DB_NAME", "DB_PASSWORD"];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    console.error(
      "❌ Missing required environment variables:",
      missingVars.join(", "),
    );
    console.log("📋 Available environment variables:");
    console.log("   - DB_USER:", process.env.DB_USER ? "SET" : "NOT SET");
    console.log("   - DB_HOST:", process.env.DB_HOST ? "SET" : "NOT SET");
    console.log("   - DB_NAME:", process.env.DB_NAME ? "SET" : "NOT SET");
    console.log(
      "   - DB_PASSWORD:",
      process.env.DB_PASSWORD ? "SET" : "NOT SET",
    );
    console.log("   - DB_PORT:", process.env.DB_PORT || "5432 (default)");
    process.exit(1);
  }

  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port:
      typeof process.env.DB_PORT === "string"
        ? parseInt(process.env.DB_PORT)
        : 5432,
  });

  const db = drizzle(pool);

  console.log("🔍 Database connection details:");
  console.log("   - Host:", process.env.DB_HOST);
  console.log("   - Database:", process.env.DB_NAME);
  console.log("   - User:", process.env.DB_USER);
  console.log("   - Port:", process.env.DB_PORT || "5432");

  console.log("🚀 Running migrations...");

  try {
    // Test connection first
    const client = await pool.connect();
    console.log("✅ Database connection successful");
    client.release();

    // Run migrations
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("✅ Migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);

    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes("ENOTFOUND")) {
        console.log("💡 Tip: Check your DB_HOST environment variable");
      } else if (error.message.includes("authentication")) {
        console.log(
          "💡 Tip: Check your DB_USER and DB_PASSWORD environment variables",
        );
      } else if (
        error.message.includes("database") &&
        error.message.includes("does not exist")
      ) {
        console.log(
          "💡 Tip: Check your DB_NAME environment variable or create the database",
        );
      }
    }
  } finally {
    await pool.end();
  }
}

runMigrations().catch(console.error);
