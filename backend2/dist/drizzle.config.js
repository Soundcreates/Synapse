"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    schema: "./models/DataSetModel.ts",
    out: "./migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
};
//# sourceMappingURL=drizzle.config.js.map