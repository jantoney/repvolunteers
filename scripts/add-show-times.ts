#!/usr/bin/env -S deno run --allow-net --allow-env

import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const DATABASE_URL = Deno.env.get("DATABASE_URL") || "postgresql://postgres:password@localhost:5432/repvolunteers";

async function addShowTimes() {
  const pool = new Pool(DATABASE_URL, 1, true);
  const client = await pool.connect();

  try {
    console.log("Adding start_time and end_time columns to shows table...");
    
    // Check if columns already exist
    const checkColumns = await client.queryObject(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shows' 
      AND column_name IN ('start_time', 'end_time')
    `);
    
    if (checkColumns.rows.length === 0) {
      // Add the new columns
      await client.queryObject(`
        ALTER TABLE shows 
        ADD COLUMN start_time TIME,
        ADD COLUMN end_time TIME
      `);
      console.log("✅ Successfully added start_time and end_time columns to shows table");
    } else {
      console.log("⚠️  Columns already exist, skipping migration");
    }
    
  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (import.meta.main) {
  await addShowTimes();
}
