"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Synapse/backend2/clearDatabase.ts
require("dotenv/config");
const connectDB_1 = require("./config/connectDB");
const DataSetModel_1 = require("./models/DataSetModel");
const drizzle_orm_1 = require("drizzle-orm");
async function clearDatabase() {
    try {
        console.log("🗑️  Starting database cleanup...");
        // Count existing records
        const existingRecords = await connectDB_1.db.select().from(DataSetModel_1.datasets);
        console.log(`📊 Found ${existingRecords.length} existing records`);
        if (existingRecords.length === 0) {
            console.log("✅ Database is already empty!");
            process.exit(0);
        }
        // Delete all records from datasets table
        await connectDB_1.db.delete(DataSetModel_1.datasets);
        console.log("✅ All records deleted successfully!");
        // Reset the auto-increment sequence to start from 1
        await connectDB_1.db.execute((0, drizzle_orm_1.sql) `ALTER SEQUENCE datasets_id_seq RESTART WITH 1`);
        console.log("🔄 Reset ID sequence to start from 1");
        // Verify deletion
        const remainingRecords = await connectDB_1.db.select().from(DataSetModel_1.datasets);
        console.log(`📊 Remaining records: ${remainingRecords.length}`);
        console.log("🎉 Database cleared successfully!");
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Error clearing database:", error);
        process.exit(1);
    }
}
// Add confirmation prompt
const args = process.argv.slice(2);
if (!args.includes("--confirm")) {
    console.log("⚠️  This will delete ALL records from the database!");
    console.log("💡 Add --confirm flag to proceed: npm run clear-db --confirm");
    process.exit(1);
}
clearDatabase();
//# sourceMappingURL=clearDatabase.js.map