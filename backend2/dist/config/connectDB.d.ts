import "dotenv/config";
import { Pool } from "pg";
import * as schema from "../models/DataSetModel";
export declare const testConnection: () => Promise<boolean>;
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: Pool;
};
//# sourceMappingURL=connectDB.d.ts.map