#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

import { load } from "https://deno.land/std@0.211.0/dotenv/mod.ts";
import { getPool, initDb } from "../src/models/db.ts";

async function addParticipantStatusAndNotes() {
  const env = await load();
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") {
      Deno.env.set(key, value);
    }
  }

  await initDb();

  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log("Adding participant status and internal notes...");
    await client.queryObject("BEGIN");

    await client.queryObject(`
      ALTER TABLE participants
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    `);

    await client.queryObject(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'participants_status_check'
        ) THEN
          ALTER TABLE participants
            ADD CONSTRAINT participants_status_check
            CHECK (status IN ('active', 'inactive'));
        END IF;
      END $$
    `);

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS participant_notes (
        id SERIAL PRIMARY KEY,
        participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        note TEXT NOT NULL,
        visibility TEXT NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal')),
        created_by_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
        created_by_name TEXT,
        created_by_email TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.queryObject(`
      CREATE INDEX IF NOT EXISTS idx_participants_status
      ON participants(status)
    `);

    await client.queryObject(`
      CREATE INDEX IF NOT EXISTS idx_participant_notes_participant
      ON participant_notes(participant_id, created_at DESC)
    `);

    await client.queryObject("COMMIT");
    console.log("Successfully added participant status and notes.");
  } catch (error) {
    console.error("Migration failed:", error);
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

if (import.meta.main) {
  await addParticipantStatusAndNotes();
}
