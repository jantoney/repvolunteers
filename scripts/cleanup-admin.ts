import { load } from "dotenv";
import { createClient } from "../src/utils/db-utils.ts";

// Load environment variables
await load({ export: true });

async function cleanupAdminUser() {
  const client = await createClient();
  
  try {
    await client.connect();
    
    const adminEmail = Deno.env.get("ADMIN_USER")!;
    
    // Delete account records first (due to foreign key constraints)
    await client.queryObject(
      `DELETE FROM account WHERE user_id IN (SELECT id FROM "user" WHERE email = $1)`,
      [adminEmail]
    );
      // Delete user record
    await client.queryObject(
      `DELETE FROM "user" WHERE email = $1`,
      [adminEmail]
    );
    
    console.log(`Deleted admin user: ${adminEmail}`);
    
  } catch (error) {
    console.error("Error cleaning up admin user:", error);
  } finally {
    await client.end();
  }
}

// Run the script
if (import.meta.main) {
  await cleanupAdminUser();
}
