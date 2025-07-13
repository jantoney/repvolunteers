#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

import { load } from "https://deno.land/std@0.211.0/dotenv/mod.ts";
import { getPool, initDb } from "../src/models/db.ts";

async function addIntervalsTable() {
  // Load environment variables
  const env = await load();
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string') {
      Deno.env.set(key, value);
    }
  }
  
  // Initialize database first
  await initDb();
  
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    console.log("🎭 Adding show_intervals table...");
    
    // Start transaction
    await client.queryObject("BEGIN");
    
    // Create show_intervals table
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS show_intervals (
        id SERIAL PRIMARY KEY,
        show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
        start_minutes INTEGER NOT NULL, -- Minutes from start of performance
        duration_minutes INTEGER NOT NULL, -- Length of interval in minutes
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    
    // Commit transaction
    await client.queryObject("COMMIT");
    
    console.log("✅ Successfully added show_intervals table!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

if (import.meta.main) {
  await addIntervalsTable();
}
