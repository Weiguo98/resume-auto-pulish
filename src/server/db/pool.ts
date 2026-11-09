import { readFileSync } from "node:fs";
import pg from "pg";
import { config } from "../config.ts";

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

// ponytail: one idempotent schema file run at boot; add a migration tool when a change needs to alter existing tables.
export async function migrate(): Promise<void> {
  await pool.query(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
}

export async function inTx<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}
