import { load } from "dotenv";
import { createClient } from "../src/utils/db-utils.ts";
import { getAuth } from "../src/auth.ts";
import { initDb } from "../src/models/db.ts";

// Load environment variables
await load({ export: true });

async function createAdminUser() {
  // Check required environment variables
  const adminEmail = Deno.env.get("ADMIN_USER");
  const adminPass = Deno.env.get("ADMIN_PASS");
  
  if (!adminEmail) {
    console.error("ADMIN_USER environment variable is required");
    Deno.exit(1);
  }
  
  if (!adminPass) {
    console.error("ADMIN_PASS environment variable is required");
    Deno.exit(1);
  }
  
  console.log(`Creating admin user: ${adminEmail}`);
  
  // Initialize database pools first
  await initDb();
  
  const client = await createClient();
  const auth = getAuth();
  
  try {
    await client.connect();
    // Check if admin user already exists
    const existing = await client.queryObject(
      `SELECT id FROM "user" WHERE email = $1 AND "isAdmin" = true`,
      [adminEmail]
    );
    if (existing.rows.length > 0) {
      console.log("✅ Admin user already exists");
      return;
    }
    console.log("📝 Creating new admin user...");
    // Use Better Auth's internal API to create user with proper password hashing
    const signupResponse = await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: adminPass,
        name: "Admin User"
      }
    });
    if (signupResponse) {
      // Update the user to be an admin
      await client.queryObject(
        `UPDATE "user" SET "isAdmin" = true, email_verified = true WHERE email = $1`,
        [adminEmail]
      );
      console.log("✅ Admin user created successfully");
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPass}`);
    } else {
      console.error("❌ Failed to create admin user");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await client.end();
  }
}

// Run the script
if (import.meta.main) {
  await createAdminUser();
}
