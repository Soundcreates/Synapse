// Test database connection script
// Run this with: node test-db-connection.js

import pkg from "pg";
const { Pool } = pkg;

const DATABASE_URL =
  "postgresql://synapse_database_txii_user:u3HvzQi1T3nJikP23inIJJyZn8ds5998@dpg-d3t0d76mcj7s73bcq9bg-a.singapore-postgres.render.com/synapse_database_txii";

console.log("🧪 Testing Database Connection...\n");

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function testConnection() {
  try {
    console.log("🔌 Attempting connection to Render database...");

    const client = await pool.connect();
    console.log("✅ Connected successfully!");

    // Test a simple query
    const result = await client.query(
      "SELECT NOW() as current_time, version() as db_version"
    );
    console.log("🕒 Current time:", result.rows[0].current_time);
    console.log(
      "🗄️ Database version:",
      result.rows[0].db_version.split(" ")[0]
    );

    // Test if your tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log("📋 Available tables:");
    tables.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    client.release();
    console.log("\n🎉 Database connection test passed!");
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.error(
        "🚨 Connection refused - database might be down or URL incorrect"
      );
    }
    if (error.code === "ENOTFOUND") {
      console.error("🚨 Host not found - check database URL");
    }
    if (error.code === "28P01") {
      console.error("🚨 Authentication failed - check credentials");
    }
  } finally {
    await pool.end();
  }
}

testConnection();
