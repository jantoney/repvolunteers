#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read

import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// Load environment variables
import "https://deno.land/std@0.208.0/dotenv/load.ts";

const DATABASE_URL = Deno.env.get("DATABASE_URL");
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  Deno.exit(1);
}

console.log("🕰️ Migrating database to TIMESTAMPTZ");
console.log("=====================================");

const client = new Client(DATABASE_URL);

try {
  await client.connect();
  console.log("✅ Connected to database");

  // Begin transaction
  await client.queryObject("BEGIN");
  console.log("🔄 Starting transaction...");

  // Check if tables exist and have the old TIMESTAMP columns
  const checkTables = await client.queryObject<{
    table_name: string;
    column_name: string;
    data_type: string;
  }>(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND (
      (data_type = 'timestamp without time zone' AND column_name IN ('arrive_time', 'depart_time', 'created_at', 'updated_at', 'expires_at', 'access_token_expires_at', 'refresh_token_expires_at'))
      OR 
      (data_type = 'time without time zone' AND column_name IN ('start_time', 'end_time') AND table_name = 'show_dates')
    )
    ORDER BY table_name, column_name
  `);

  if (checkTables.rows.length === 0) {
    console.log("✅ All tables already use TIMESTAMPTZ - no migration needed");
    await client.queryObject("ROLLBACK");
    await client.end();
    Deno.exit(0);
  }

  console.log(`📋 Found ${checkTables.rows.length} columns to migrate:`);
  for (const row of checkTables.rows) {
    console.log(`  - ${row.table_name}.${row.column_name}`);
  }

  console.log("\n🔄 Migrating columns to TIMESTAMPTZ...");

  // Migrate shifts table
  const shiftColumns = checkTables.rows.filter(r => r.table_name === 'shifts');
  if (shiftColumns.length > 0) {
    console.log("  Migrating shifts table...");
    for (const col of shiftColumns) {
      if (col.column_name === 'arrive_time' || col.column_name === 'depart_time') {
        await client.queryObject(`ALTER TABLE shifts ALTER COLUMN ${col.column_name} TYPE TIMESTAMPTZ`);
        console.log(`    ✅ ${col.column_name} -> TIMESTAMPTZ`);
      }
    }
  }

  // Migrate show_dates table
  const showDateColumns = checkTables.rows.filter(r => r.table_name === 'show_dates');
  if (showDateColumns.length > 0) {
    console.log("  Migrating show_dates table...");
    for (const col of showDateColumns) {
      if (col.column_name === 'start_time' || col.column_name === 'end_time') {
        await client.queryObject(`ALTER TABLE show_dates ALTER COLUMN ${col.column_name} TYPE TIMETZ`);
        console.log(`    ✅ ${col.column_name} -> TIMETZ`);
      }
    }
  }

  // Migrate shows table
  const showColumns = checkTables.rows.filter(r => r.table_name === 'shows');
  if (showColumns.length > 0) {
    console.log("  Migrating shows table...");
    for (const col of showColumns) {
      if (col.column_name === 'created_at') {
        await client.queryObject(`ALTER TABLE shows ALTER COLUMN ${col.column_name} TYPE TIMESTAMPTZ`);
        console.log(`    ✅ ${col.column_name} -> TIMESTAMPTZ`);
      }
    }
  }

  // Migrate participants table
  const participantColumns = checkTables.rows.filter(r => r.table_name === 'participants');
  if (participantColumns.length > 0) {
    console.log("  Migrating participants table...");
    for (const col of participantColumns) {
      if (col.column_name === 'created_at') {
        await client.queryObject(`ALTER TABLE participants ALTER COLUMN ${col.column_name} TYPE TIMESTAMPTZ`);
        console.log(`    ✅ ${col.column_name} -> TIMESTAMPTZ`);
      }
    }
  }

  // Migrate user table
  const userColumns = checkTables.rows.filter(r => r.table_name === 'user');
  if (userColumns.length > 0) {
    console.log("  Migrating user table...");
    for (const col of userColumns) {
      if (col.column_name === 'created_at' || col.column_name === 'updated_at') {
        await client.queryObject(`ALTER TABLE "user" ALTER COLUMN ${col.column_name} TYPE TIMESTAMPTZ`);
        console.log(`    ✅ ${col.column_name} -> TIMESTAMPTZ`);
      }
    }
  }

  // Migrate session table
  const sessionColumns = checkTables.rows.filter(r => r.table_name === 'session');
  if (sessionColumns.length > 0) {
    console.log("  Migrating session table...");
    for (const col of sessionColumns) {
      if (col.column_name === 'expires_at' || col.column_name === 'created_at' || col.column_name === 'updated_at') {
        await client.queryObject(`ALTER TABLE session ALTER COLUMN ${col.column_name} TYPE TIMESTAMPTZ`);
        console.log(`    ✅ ${col.column_name} -> TIMESTAMPTZ`);
      }
    }
  }

  // Migrate account table
  const accountColumns = checkTables.rows.filter(r => r.table_name === 'account');
  if (accountColumns.length > 0) {
    console.log("  Migrating account table...");
    for (const col of accountColumns) {
      if (['access_token_expires_at', 'refresh_token_expires_at', 'created_at', 'updated_at'].includes(col.column_name)) {
        await client.queryObject(`ALTER TABLE account ALTER COLUMN ${col.column_name} TYPE TIMESTAMPTZ`);
        console.log(`    ✅ ${col.column_name} -> TIMESTAMPTZ`);
      }
    }
  }

  // Migrate verification table
  const verificationColumns = checkTables.rows.filter(r => r.table_name === 'verification');
  if (verificationColumns.length > 0) {
    console.log("  Migrating verification table...");
    for (const col of verificationColumns) {
      if (['expires_at', 'created_at', 'updated_at'].includes(col.column_name)) {
        await client.queryObject(`ALTER TABLE verification ALTER COLUMN ${col.column_name} TYPE TIMESTAMPTZ`);
        console.log(`    ✅ ${col.column_name} -> TIMESTAMPTZ`);
      }
    }
  }

  // Commit the transaction
  await client.queryObject("COMMIT");
  console.log("\n✅ Migration completed successfully!");

  // Verify the changes
  console.log("\n🔍 Verifying migration...");
  const verifyTables = await client.queryObject<{
    table_name: string;
    column_name: string;
    data_type: string;
  }>(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND data_type = 'timestamp with time zone'
    AND column_name IN ('arrive_time', 'depart_time', 'created_at', 'updated_at', 'expires_at', 'access_token_expires_at', 'refresh_token_expires_at')
    ORDER BY table_name, column_name
  `);

  console.log(`✅ Successfully migrated ${verifyTables.rows.length} columns to TIMESTAMPTZ:`);
  for (const row of verifyTables.rows) {
    console.log(`  - ${row.table_name}.${row.column_name}`);
  }

} catch (error) {
  console.error("❌ Migration failed:", error);
  try {
    await client.queryObject("ROLLBACK");
    console.log("🔄 Transaction rolled back");
  } catch (rollbackError) {
    console.error("❌ Rollback failed:", rollbackError);
  }
  Deno.exit(1);
} finally {
  await client.end();
  console.log("🔌 Database connection closed");
}

console.log("\n🎯 Next steps:");
console.log("1. All database columns now use TIMESTAMPTZ");
console.log("2. All inputs are treated as Adelaide timezone");
console.log("3. All displays show Adelaide timezone");
console.log("4. Your PUT request should now work correctly!");
