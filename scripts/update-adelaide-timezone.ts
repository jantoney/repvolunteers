#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read

import { Client } from "postgres";

// Load environment variables
import { load } from "dotenv";
await load({ export: true });

const DATABASE_URL = Deno.env.get("DATABASE_URL");
if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    Deno.exit(1);
}

console.log("🕰️ Migrating stored timestamps to Adelaide timezone interpretation");
console.log("=============================================================");

const client = new Client(DATABASE_URL);

try {
    await client.connect();
    console.log("✅ Connected to database");

    // Begin transaction
    await client.queryObject("BEGIN");
    console.log("🔄 Starting transaction...");

    // First check if the database columns are already TIMESTAMPTZ
    const checkTimestampTz = await client.queryObject<{
        table_name: string;
        column_name: string;
        data_type: string;
    }>(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND data_type = 'timestamp with time zone'
    AND column_name IN ('arrive_time', 'depart_time', 'start_time', 'end_time', 'created_at')
    ORDER BY table_name, column_name
  `);

    if (checkTimestampTz.rows.length === 0) {
        console.log("❌ No TIMESTAMPTZ columns found - run migrate-to-timestamptz.ts first");
        await client.queryObject("ROLLBACK");
        await client.end();
        Deno.exit(1);
    }

    console.log(`📋 Found ${checkTimestampTz.rows.length} timestamptz columns to migrate:`);
    for (const row of checkTimestampTz.rows) {
        console.log(`  - ${row.table_name}.${row.column_name}`);
    }

    console.log("\n🔄 Updating stored timestamps to be interpreted in Adelaide timezone...");

    // Update show_dates table timestamps
    console.log("  Migrating show_dates table...");
    const showDatesResult = await client.queryObject(`
    UPDATE show_dates
    SET 
      start_time = start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Australia/Adelaide',
      end_time = end_time AT TIME ZONE 'UTC' AT TIME ZONE 'Australia/Adelaide'
  `);
    console.log(`    ✅ Updated ${showDatesResult.rowCount} rows in show_dates`);

    // Update shifts table timestamps
    console.log("  Migrating shifts table...");
    const shiftsResult = await client.queryObject(`
    UPDATE shifts
    SET 
      arrive_time = arrive_time AT TIME ZONE 'UTC' AT TIME ZONE 'Australia/Adelaide',
      depart_time = depart_time AT TIME ZONE 'UTC' AT TIME ZONE 'Australia/Adelaide'
  `);
    console.log(`    ✅ Updated ${shiftsResult.rowCount} rows in shifts`);

    // Update shows table timestamps
    console.log("  Migrating shows table...");
    const showsResult = await client.queryObject(`
    UPDATE shows
    SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Australia/Adelaide'
  `);
    console.log(`    ✅ Updated ${showsResult.rowCount} rows in shows`);

    // Update participants table timestamps
    console.log("  Migrating participants table...");
    const participantsResult = await client.queryObject(`
    UPDATE participants
    SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Australia/Adelaide'
  `);
    console.log(`    ✅ Updated ${participantsResult.rowCount} rows in participants`);

    // Commit the transaction
    await client.queryObject("COMMIT");
    console.log("\n✅ Migration completed successfully!");

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
console.log("1. All timestamps in the database now represent Adelaide timezone");
console.log("2. Backend code now interprets all timestamps as Adelaide timezone");
console.log("3. Frontend no longer attempts timezone conversions");
console.log("4. All displays show Adelaide timezone");
