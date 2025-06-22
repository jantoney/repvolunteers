import { Pool } from "postgres";
import { Pool as PgPool } from "pg";
import { createPool, createPgPool } from "../utils/db-utils.ts";

let pool: Pool;
let authPool: PgPool;

export function getPool() {
  if (!pool) throw new Error("Database not initialized");
  return pool;
}

export function getAuthPool() {
  if (!authPool) throw new Error("Database not initialized");
  return authPool;
}

export async function initDb() {
  try {
    // Create main application pool
    pool = await createPool(10);
    
    // Create separate pg pool for authentication (Better Auth)
    authPool = await createPgPool();
    
    console.log("Database pools initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}
