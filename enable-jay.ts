// Enable Jay's account for testing
// Run with: deno run -A enable-jay.ts

import "jsr:@std/dotenv/load";
import { initDb, getPool } from "./src/models/db.ts";

console.log("Enabling Jay's account...");

// Initialize database connection
await initDb();

const pool = getPool();
const client = await pool.connect();

try {
  // Enable Jay's account
  const result = await client.queryObject(
    "UPDATE participants SET approved = true WHERE email = $1 RETURNING id, name, email, approved",
    ["jaya+ts@adelaiderep.com"]
  );
  
  if (result.rows.length === 0) {
    console.log("❌ Participant not found");
  } else {
    const participant = result.rows[0] as { id: number; name: string; email: string; approved: boolean };
    console.log("✅ Participant updated:");
    console.log(`  ID: ${participant.id}`);
    console.log(`  Name: ${participant.name}`);
    console.log(`  Email: ${participant.email}`);
    console.log(`  Approved: ${participant.approved}`);
    console.log("\n✅ Jay can now receive login emails!");
  }
} catch (error) {
  console.error("Database error:", error);
} finally {
  client.release();
}
