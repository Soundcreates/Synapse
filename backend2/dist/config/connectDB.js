"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.pool = void 0;
const pg_1 = require("pg");
console.log(process.env.DB_PASSWORD);
exports.pool = new pg_1.Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME,
});
const connectDB = async () => {
    try {
        await exports.pool.connect();
        await exports.pool.query("SELECT NOW()");
        console.log("Database connected fast!");
    }
    catch (err) {
        console.log("error is: ", err);
        console.error("Error connecting to database");
    }
};
exports.connectDB = connectDB;
