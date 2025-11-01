"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.testConnection = void 0;
require("dotenv/config");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const pg_1 = require("pg");
const schema = __importStar(require("../models/DataSetModel"));
// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    console.log("📋 Available environment variables:");
    console.log("   - PORT:", process.env.PORT);
    console.log("   - NODE_ENV:", process.env.NODE_ENV);
    console.log("   - DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
    throw new Error("DATABASE_URL is required");
}
console.log("🔍 DATABASE_URL loaded:", "✅ Yes");
// Create connection pool
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl:
//     process.env.NODE_ENV === "production"
//       ? { rejectUnauthorized: false }
//       : false,
// });
// trying the manual way ( no connection string)
const pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: typeof process.env.DB_PORT === "string"
        ? parseInt(process.env.DB_PORT)
        : 5432,
});
// Test connection function
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log("✅ Database connected successfully");
        client.release();
        return true;
    }
    catch (error) {
        console.error("❌ Database connection failed:", error);
        return false;
    }
};
exports.testConnection = testConnection;
exports.db = (0, node_postgres_1.drizzle)(pool, { schema });
//# sourceMappingURL=connectDB.js.map