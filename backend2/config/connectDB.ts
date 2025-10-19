import { Pool } from "pg";

export const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME,
});

export const connectDB = async () => {
  try {
    await pool.connect();
    await pool.query("SELECT NOW()");
    console.log("Database connected fast!");
  } catch (err) {
    console.log("error is: ", err);
    console.error("Error connecting to database");
  }
};
