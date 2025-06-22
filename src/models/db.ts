import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

let pool: Pool;

export function getPool() {
  if (!pool) throw new Error("Database not initialized");
  return pool;
}

export async function initDb() {
  const connectionString = Deno.env.get("DATABASE_URL");
  if (!connectionString) throw new Error("DATABASE_URL not set");
  pool = new Pool(connectionString, 10, true);
}
