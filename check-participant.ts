// Simple check for specific participant
// Run with: deno run -A check-participant.ts

import "jsr:@std/dotenv/load";
import { initDb, getPool } from "./src/models/db.ts";

const email = "jaya+ts@adelaiderep.com";
console.log(`Checking for participant: ${email}`);

// Initialize database connection
await initDb();

const pool = getPool();
const client = await pool.connect();

try {
  // Check if participant exists and is approved
  const result = await client.queryObject(
    "SELECT id, name, email, approved FROM participants WHERE email = $1",
    [email]
  );
  
  if (result.rows.length === 0) {
    console.log("❌ Participant not found in database");
  } else {
    const participant = result.rows[0] as { id: number; name: string; email: string; approved: boolean };
    console.log("✅ Participant found:");
    console.log(`  ID: ${participant.id}`);
    console.log(`  Name: ${participant.name}`);
    console.log(`  Email: ${participant.email}`);
    console.log(`  Approved: ${participant.approved}`);
    
    if (!participant.approved) {
      console.log("⚠️  Participant exists but is NOT approved - this is why login fails");
    } else {
      console.log("✅ Participant is approved - should be able to receive login email");
    }
  }
} catch (error) {
  console.error("Database error:", error);
} finally {
  client.release();
}
