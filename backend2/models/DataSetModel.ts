import {
  pgTable,
  integer,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const datasets = pgTable("datasets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  blockchain_pool_id: integer("blockchain_pool_id").unique(), // Remove .notNull() to make it optional
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ipfs_hash: varchar("ipfs_hash", { length: 100 }).notNull(),
  file_size: integer("file_size").notNull(),
  file_type: varchar("file_type", { length: 50 }),
  owner_address: varchar("owner_address", { length: 42 }).notNull(),
  tx_hash: varchar("tx_hash", { length: 66 }),
  price: integer("price").notNull(),
  purchasers: text("purchasers")
    .array()
    .default(sql`'{}'::text[]`),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type Dataset = typeof datasets.$inferSelect;
export type NewDataSet = typeof datasets.$inferInsert;

// Use the inferred types from Drizzle instead of custom interface
export type DataSet = Dataset;

export interface CreateDataSetInput {
  name: string;
  blockchain_pool_id?: string | number | null; // Make optional to allow creation without blockchain ID
  description?: string;
  ipfs_hash: string;
  tx_hash?: string; // Make optional since it might not be available at creation time
  file_size: number;
  file_type?: string;
  owner_address: string;
  price: string;
}
