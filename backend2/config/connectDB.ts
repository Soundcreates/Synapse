import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../models/DataSetModel";

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
