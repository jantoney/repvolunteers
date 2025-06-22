#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
import { getPool, initDb } from "../src/models/db.ts";

// Load environment variables
await load({ export: true });

async function migrateShowStructure() {
  // Load environment variables
  const env = await load();
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }
  
  // Initialize database first
  await initDb();
  
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    console.log("Starting migration to new show structure...");
    
    // Start transaction
    await client.queryObject("BEGIN");
    
    // Create new tables
    console.log("Creating show_dates table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS show_dates (
        id SERIAL PRIMARY KEY,
        show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        UNIQUE(show_id, date)
      )
    `);
    
    // Create a temporary table to backup existing data
    console.log("Backing up existing shows data...");
    await client.queryObject(`
      CREATE TEMP TABLE shows_backup AS 
      SELECT * FROM shows
    `);
    
    // Create new shows table structure
    console.log("Updating shows table structure...");
    await client.queryObject("DROP TABLE IF EXISTS shows CASCADE");
    await client.queryObject(`
      CREATE TABLE shows (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Recreate show_dates table with proper references
    await client.queryObject("DROP TABLE IF EXISTS show_dates CASCADE");
    await client.queryObject(`
      CREATE TABLE show_dates (
        id SERIAL PRIMARY KEY,
        show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        UNIQUE(show_id, date)
      )
    `);
    
    // Migrate data from backup
    console.log("Migrating existing data...");
    const oldShows = await client.queryObject<{
      id: number;
      name: string;
      date: string;
      start_time: string;
      end_time: string;
    }>("SELECT * FROM shows_backup");
    
    const showMap = new Map<string, number>();
    
    for (const oldShow of oldShows.rows) {
      let showId: number;
      
      if (showMap.has(oldShow.name)) {
        showId = showMap.get(oldShow.name)!;
      } else {
        // Create new show record
        const result = await client.queryObject<{ id: number }>(
          "INSERT INTO shows (name) VALUES ($1) RETURNING id",
          [oldShow.name]
        );
        showId = result.rows[0].id;
        showMap.set(oldShow.name, showId);
      }
      
      // Create show_date record
      await client.queryObject(
        "INSERT INTO show_dates (show_id, date, start_time, end_time) VALUES ($1, $2, $3, $4)",
        [showId, oldShow.date, oldShow.start_time, oldShow.end_time]
      );
    }
    
    // Update shifts table structure
    console.log("Updating shifts table...");
    
    // First backup existing shifts
    await client.queryObject(`
      CREATE TEMP TABLE shifts_backup AS 
      SELECT * FROM shifts
    `);
    
    // Drop and recreate shifts table
    await client.queryObject("DROP TABLE IF EXISTS shifts CASCADE");
    await client.queryObject(`
      CREATE TABLE shifts (
        id SERIAL PRIMARY KEY,
        show_date_id INTEGER REFERENCES show_dates(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        arrive_time TIMESTAMP NOT NULL,
        depart_time TIMESTAMP NOT NULL
      )
    `);
    
    // Migrate shift data
    const oldShifts = await client.queryObject<{
      id: number;
      show_id: number;
      role: string;
      start_time: string;
      end_time: string;
    }>("SELECT * FROM shifts_backup");
    
    for (const oldShift of oldShifts.rows) {
      // Find the corresponding show_date
      const showResult = await client.queryObject<{ name: string; date: string }>(
        "SELECT name, date FROM shows_backup WHERE id = $1",
        [oldShift.show_id]
      );
      
      if (showResult.rows.length > 0) {
        const show = showResult.rows[0];
        const showDateResult = await client.queryObject<{ id: number }>(
          `SELECT sd.id FROM show_dates sd 
           JOIN shows s ON s.id = sd.show_id 
           WHERE s.name = $1 AND sd.date = $2`,
          [show.name, show.date]
        );
        
        if (showDateResult.rows.length > 0) {
          await client.queryObject(
            "INSERT INTO shifts (show_date_id, role, arrive_time, depart_time) VALUES ($1, $2, $3, $4)",
            [showDateResult.rows[0].id, oldShift.role, oldShift.start_time, oldShift.end_time]
          );
        }
      }
    }
    
    // Recreate volunteer_shifts table
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS volunteer_shifts (
        volunteer_id INTEGER REFERENCES volunteers(id) ON DELETE CASCADE,
        shift_id INTEGER REFERENCES shifts(id) ON DELETE CASCADE,
        PRIMARY KEY (volunteer_id, shift_id)
      )
    `);
    
    // Commit transaction
    await client.queryObject("COMMIT");
    
    console.log("Migration completed successfully!");
    
  } catch (error) {
    console.error("Migration failed:", error);
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export { migrateShowStructure };

if (import.meta.main) {
  await migrateShowStructure();
}
