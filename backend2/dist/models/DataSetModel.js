"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.datasets = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.datasets = (0, pg_core_1.pgTable)("datasets", {
    id: (0, pg_core_1.integer)("id").primaryKey().generatedAlwaysAsIdentity(),
    blockchain_pool_id: (0, pg_core_1.integer)("blockchain_pool_id").unique(), // Remove .notNull() to make it optional
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    ipfs_hash: (0, pg_core_1.varchar)("ipfs_hash", { length: 100 }).notNull(),
    file_size: (0, pg_core_1.integer)("file_size").notNull(),
    file_type: (0, pg_core_1.varchar)("file_type", { length: 1000 }),
    owner_address: (0, pg_core_1.varchar)("owner_address", { length: 42 }).notNull(),
    tx_hash: (0, pg_core_1.varchar)("tx_hash", { length: 66 }),
    price: (0, pg_core_1.integer)("price").notNull(),
    purchasers: (0, pg_core_1.text)("purchasers")
        .array()
        .default((0, drizzle_orm_1.sql) `'{}'::text[]`),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
//# sourceMappingURL=DataSetModel.js.map