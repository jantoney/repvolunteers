// Debug script to check participant email issues
// Run this with: deno run -A debug-participant.ts

import { getPool } from "./src/models/db.ts";

const email = "jaya+ts@adelaiderep.com";

const pool = getPool();
const client = await pool.connect();

try {
  console.log("🔍 Debugging participant email:", email);
  console.log("=" .repeat(50));
  
  // 1. Check if email exists at all (regardless of approval)
  console.log("1. Checking if email exists (any approval status):");
  const allResults = await client.queryObject(
    "SELECT id, name, email, approved, created_at FROM participants WHERE email = $1",
    [email]
  );
  console.log("Results:", allResults.rows);
  
  // 2. Check with case-insensitive search
  console.log("\n2. Checking with case-insensitive search:");
  const caseInsensitiveResults = await client.queryObject(
    "SELECT id, name, email, approved, created_at FROM participants WHERE LOWER(email) = LOWER($1)",
    [email]
  );
  console.log("Results:", caseInsensitiveResults.rows);
  
  // 3. Check for similar emails (in case of typos)
  console.log("\n3. Checking for similar emails:");
  const similarResults = await client.queryObject(
    "SELECT id, name, email, approved, created_at FROM participants WHERE email ILIKE $1",
    [`%${email.split('@')[0].split('+')[0]}%`] // Search for base email part
  );
  console.log("Results:", similarResults.rows);
  
  // 4. Check the exact query used by the auth system
  console.log("\n4. Checking exact auth query (approved = true):");
  const authResults = await client.queryObject(
    "SELECT id, name, email FROM participants WHERE email = $1 AND approved = true",
    [email]
  );
  console.log("Results:", authResults.rows);
  
  // 5. Show all participants for debugging (limit to 10)
  console.log("\n5. All participants (first 10):");
  const allParticipants = await client.queryObject(
    "SELECT id, name, email, approved FROM participants ORDER BY created_at DESC LIMIT 10"
  );
  console.log("Results:", allParticipants.rows);
  
} catch (error) {
  console.error("Error:", error);
} finally {
  client.release();
  console.log("\n✅ Debug complete");
}
