import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

/** Shared Postgres connection pool for the API process. */
export const pool = new Pool({ connectionString });
