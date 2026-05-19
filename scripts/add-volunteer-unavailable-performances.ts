#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

import { load } from "https://deno.land/std@0.211.0/dotenv/mod.ts";
import { getPool, initDb } from "../src/models/db.ts";

async function addVolunteerUnavailablePerformancesTable() {
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
    console.log("Adding volunteer_unavailable_performances table...");
    await client.queryObject("BEGIN");

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS volunteer_unavailable_performances (
        participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
        show_date_id INTEGER REFERENCES show_dates(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (participant_id, show_date_id)
      )
    `);

    await client
      .queryObject(
        `
      INSERT INTO volunteer_unavailable_performances (participant_id, show_date_id)
      SELECT DISTINCT vud.participant_id, sd.id
      FROM volunteer_unavailable_dates vud
      JOIN show_dates sd
        ON (sd.start_time AT TIME ZONE 'Australia/Adelaide')::date = vud.unavailable_date
      ON CONFLICT DO NOTHING
    `,
      )
      .catch((error) => {
        if (
          error instanceof Error &&
          error.message.includes("volunteer_unavailable_dates")
        ) {
          return;
        }
        throw error;
      });

    await client.queryObject(`
      CREATE INDEX IF NOT EXISTS idx_volunteer_unavailable_performances_show_date
      ON volunteer_unavailable_performances(show_date_id)
    `);

    await client.queryObject(
      "DROP TABLE IF EXISTS volunteer_unavailable_dates",
    );

    await client.queryObject("COMMIT");
    console.log("Successfully added volunteer_unavailable_performances table.");
  } catch (error) {
    console.error("Migration failed:", error);
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

if (import.meta.main) {
  await addVolunteerUnavailablePerformancesTable();
}
