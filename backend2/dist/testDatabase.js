"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const connectDB_1 = require("./config/connectDB");
const DataSetModel_1 = require("./models/DataSetModel");
const drizzle_orm_1 = require("drizzle-orm");
class DatabaseTester {
    constructor() {
        this.results = [];
    }
    addResult(test, status, message, error) {
        this.results.push({ test, status, message, error });
        console.log(`${status} ${test}: ${message}`);
        if (error)
            console.error("Error details:", error);
    }
    async testConnection() {
        try {
            const connected = await (0, connectDB_1.testConnection)();
            if (connected) {
                this.addResult("Connection Test", "✅ PASS", "Successfully connected to database");
            }
            else {
                this.addResult("Connection Test", "❌ FAIL", "Failed to connect to database");
            }
        }
        catch (error) {
            this.addResult("Connection Test", "❌ FAIL", "Connection test threw an error", error);
        }
    }
    async testTableExists() {
        try {
            const result = await connectDB_1.db.execute((0, drizzle_orm_1.sql) `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'datasets'
      `);
            if (result.rows.length > 0) {
                this.addResult("Table Existence", "✅ PASS", "datasets table exists");
            }
            else {
                this.addResult("Table Existence", "❌ FAIL", "datasets table does not exist");
            }
        }
        catch (error) {
            this.addResult("Table Existence", "❌ FAIL", "Error checking table existence", error);
        }
    }
    async testTableStructure() {
        try {
            const result = await connectDB_1.db.execute((0, drizzle_orm_1.sql) `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'datasets' 
        ORDER BY ordinal_position
      `);
            if (result.rows.length > 0) {
                console.log("\n📋 Table Structure:");
                result.rows.forEach((row) => {
                    console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === "NO" ? "(NOT NULL)" : "(NULLABLE)"}`);
                });
                this.addResult("Table Structure", "✅ PASS", `Found ${result.rows.length} columns`);
            }
            else {
                this.addResult("Table Structure", "❌ FAIL", "No columns found or table doesn't exist");
            }
        }
        catch (error) {
            this.addResult("Table Structure", "❌ FAIL", "Error checking table structure", error);
        }
    }
    async testInsert() {
        try {
            const testData = {
                name: "Test Dataset " + Date.now(),
                description: "This is a test dataset",
                ipfs_hash: "QmTestHash" + Date.now(),
                file_size: 1024,
                file_type: "json",
                owner_address: "0x1234567890123456789012345678901234567890",
                price: 100, // Add the required price field
            };
            const [inserted] = await connectDB_1.db.insert(DataSetModel_1.datasets).values(testData).returning();
            if (inserted && inserted.id) {
                this.addResult("Insert Test", "✅ PASS", `Successfully inserted dataset with ID: ${inserted.id}`);
                return inserted.id;
            }
            else {
                this.addResult("Insert Test", "❌ FAIL", "Insert succeeded but no ID returned");
                return null;
            }
        }
        catch (error) {
            this.addResult("Insert Test", "❌ FAIL", "Error inserting data", error);
            return null;
        }
    }
    async testSelect(insertedId) {
        try {
            const allDatasets = await connectDB_1.db.select().from(DataSetModel_1.datasets);
            this.addResult("Select All Test", "✅ PASS", `Found ${allDatasets.length} datasets`);
            if (insertedId) {
                const specificDataset = await connectDB_1.db
                    .select()
                    .from(DataSetModel_1.datasets)
                    .where((0, drizzle_orm_1.eq)(DataSetModel_1.datasets.id, insertedId));
                if (specificDataset.length > 0) {
                    this.addResult("Select by ID Test", "✅ PASS", `Found dataset with ID: ${insertedId}`);
                }
                else {
                    this.addResult("Select by ID Test", "❌ FAIL", `Dataset with ID ${insertedId} not found`);
                }
            }
        }
        catch (error) {
            this.addResult("Select Test", "❌ FAIL", "Error selecting data", error);
        }
    }
    async testUpdate(insertedId) {
        if (!insertedId) {
            this.addResult("Update Test", "❌ FAIL", "No dataset ID available for update test");
            return;
        }
        try {
            const [updated] = await connectDB_1.db
                .update(DataSetModel_1.datasets)
                .set({
                description: "Updated test description",
                updated_at: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(DataSetModel_1.datasets.id, insertedId))
                .returning();
            if (updated) {
                this.addResult("Update Test", "✅ PASS", `Successfully updated dataset with ID: ${insertedId}`);
            }
            else {
                this.addResult("Update Test", "❌ FAIL", "Update operation returned no results");
            }
        }
        catch (error) {
            this.addResult("Update Test", "❌ FAIL", "Error updating data", error);
        }
    }
    async testArrayOperations(insertedId) {
        if (!insertedId) {
            this.addResult("Array Test", "❌ FAIL", "No dataset ID available for array test");
            return;
        }
        try {
            // Add purchaser to array
            const testAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
            const [dataset] = await connectDB_1.db
                .select()
                .from(DataSetModel_1.datasets)
                .where((0, drizzle_orm_1.eq)(DataSetModel_1.datasets.id, insertedId));
            const currentPurchasers = dataset.purchasers || [];
            const updatedPurchasers = [...currentPurchasers, testAddress];
            const [updated] = await connectDB_1.db
                .update(DataSetModel_1.datasets)
                .set({ purchasers: updatedPurchasers })
                .where((0, drizzle_orm_1.eq)(DataSetModel_1.datasets.id, insertedId))
                .returning();
            if (updated && updated.purchasers?.includes(testAddress)) {
                this.addResult("Array Operations Test", "✅ PASS", "Successfully added purchaser to array");
            }
            else {
                this.addResult("Array Operations Test", "❌ FAIL", "Failed to add purchaser to array");
            }
        }
        catch (error) {
            this.addResult("Array Operations Test", "❌ FAIL", "Error with array operations", error);
        }
    }
    async testDelete(insertedId) {
        if (!insertedId) {
            this.addResult("Delete Test", "❌ FAIL", "No dataset ID available for delete test");
            return;
        }
        try {
            const deleted = await connectDB_1.db
                .delete(DataSetModel_1.datasets)
                .where((0, drizzle_orm_1.eq)(DataSetModel_1.datasets.id, insertedId));
            this.addResult("Delete Test", "✅ PASS", `Successfully deleted dataset with ID: ${insertedId}`);
        }
        catch (error) {
            this.addResult("Delete Test", "❌ FAIL", "Error deleting data", error);
        }
    }
    async runAllTests() {
        console.log("🧪 Starting Database Tests...\n");
        await this.testConnection();
        await this.testTableExists();
        await this.testTableStructure();
        const insertedId = await this.testInsert();
        await this.testSelect(insertedId);
        await this.testUpdate(insertedId);
        await this.testArrayOperations(insertedId);
        await this.testDelete(insertedId);
        this.printSummary();
    }
    printSummary() {
        console.log("\n" + "=".repeat(50));
        console.log("📊 TEST SUMMARY");
        console.log("=".repeat(50));
        const passed = this.results.filter((r) => r.status === "✅ PASS").length;
        const failed = this.results.filter((r) => r.status === "❌ FAIL").length;
        this.results.forEach((result) => {
            console.log(`${result.status} ${result.test}`);
        });
        console.log("\n" + "-".repeat(50));
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
        if (failed === 0) {
            console.log("🎉 All tests passed! Your database is working correctly.");
        }
        else {
            console.log("⚠️  Some tests failed. Please check the errors above.");
        }
    }
}
// Run the tests
const tester = new DatabaseTester();
tester.runAllTests().catch(console.error);
//# sourceMappingURL=testDatabase.js.map