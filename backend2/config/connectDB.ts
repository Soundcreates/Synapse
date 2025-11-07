import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../models/DataSetModel";

// Enhanced environment variable validation
console.log("🔍 Environment Check:");
console.log("   - NODE_ENV:", process.env.NODE_ENV);
console.log("   - PORT:", process.env.PORT);
console.log(
  "   - DATABASE_URL:",
  process.env.DATABASE_URL ? "✅ SET" : "❌ NOT SET"
);

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  console.log("📋 All environment variables:");
  console.log(JSON.stringify(Object.keys(process.env), null, 2));
  throw new Error("DATABASE_URL is required");
}

// Log the DATABASE_URL format (without exposing credentials)
const dbUrl = process.env.DATABASE_URL;
const urlParts = dbUrl.replace(/:\/\/.*@/, "://***:***@");
console.log("� DATABASE_URL format:", urlParts);

// Create connection pool with enhanced error handling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 10000, // How long to wait for a connection
});

// Enhanced connection test
export const testConnection = async () => {
  try {
    console.log("🔌 Attempting database connection...");
    const client = await pool.connect();

    // Test a simple query
    const result = await client.query("SELECT NOW() as current_time");
    console.log(
      "✅ Database connected successfully at:",
      result.rows[0].current_time
    );

    client.release();
    return true;
  } catch (error: any) {
    console.error("❌ Database connection failed:");
    console.error("Error code:", error?.code);
    console.error("Error message:", error?.message);

    if (error?.code === "ECONNREFUSED") {
      console.error("🚨 Connection refused - check if database URL is correct");
      console.error(
        "🚨 Make sure DATABASE_URL environment variable is set in your deployment platform"
      );
    }

    console.error("Full error:", error);
    return false;
  }
};

// Handle pool errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export const db = drizzle(pool, { schema });
