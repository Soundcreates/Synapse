"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    schema: "./models/DataSetModel.ts",
    out: "./migrations",
    dialect: "postgresql",
    dbCredentials: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    },
};
//# sourceMappingURL=drizzle.config.js.map