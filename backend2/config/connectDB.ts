import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../models/DataSetModel";

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  console.log("📋 Available environment variables:");
  console.log("   - PORT:", process.env.PORT);
  console.log("   - NODE_ENV:", process.env.NODE_ENV);
  console.log(
    "   - DATABASE_URL:",
    process.env.DATABASE_URL ? "SET" : "NOT SET"
  );
  throw new Error("DATABASE_URL is required");
}

console.log("🔍 DATABASE_URL loaded:", "✅ Yes");

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Test connection function
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Database connected successfully");
    client.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
};

export const db = drizzle(pool, { schema });
