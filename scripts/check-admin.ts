import { load } from "dotenv";
import { createClient } from "../src/utils/db-utils.ts";
import { initDb } from "../src/models/db.ts";

// Load environment variables
await load({ export: true });

async function checkAdminUsers() {
  console.log("🔍 Checking admin users in database...");
  
  // Initialize database pools first
  await initDb();
  
  const client = await createClient();
  
  try {
    await client.connect();
    
    // Check all users and their admin status
    const allUsers = await client.queryObject(
      `SELECT id, email, name, email_verified, "isAdmin", created_at FROM "user" ORDER BY created_at DESC`
    );
    
    console.log("📊 All users in database:");
    console.table(allUsers.rows);
    
    // Check specifically for admin users
    const adminUsers = await client.queryObject(
      `SELECT id, email, name, email_verified, "isAdmin", created_at FROM "user" WHERE "isAdmin" = true`
    );
    
    console.log("\n🔑 Admin users:");
    if (adminUsers.rows.length === 0) {
      console.log("❌ No admin users found!");
    } else {
      console.table(adminUsers.rows);
    }
    
    // Check accounts table for admin users
    const adminAccounts = await client.queryObject(
      `SELECT a.account_id, a.provider_id, u.email, u."isAdmin" 
       FROM account a 
       JOIN "user" u ON u.id = a.user_id 
       WHERE u."isAdmin" = true`
    );
    
    console.log("\n🔐 Admin accounts:");
    if (adminAccounts.rows.length === 0) {
      console.log("❌ No admin accounts found!");
    } else {
      console.table(adminAccounts.rows);
    }
    
  } catch (error) {
    console.error("❌ Error checking admin users:", error);
  } finally {
    await client.end();
  }
}

// Run the script
if (import.meta.main) {
  await checkAdminUsers();
}
