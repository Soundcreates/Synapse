"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const migrator_1 = require("drizzle-orm/node-postgres/migrator");
const pg_1 = require("pg");
async function runMigrations() {
    const pool = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL,
    });
    const db = (0, node_postgres_1.drizzle)(pool);
    console.log("🚀 Running migrations...");
    try {
        await (0, migrator_1.migrate)(db, { migrationsFolder: "./migrations" });
        console.log("✅ Migrations completed successfully!");
    }
    catch (error) {
        console.error("❌ Migration failed:", error);
    }
    finally {
        await pool.end();
    }
}
runMigrations().catch(console.error);
//# sourceMappingURL=runMigrations.js.map