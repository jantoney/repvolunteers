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
    
    const adminPass = Deno.env.get("ADMIN_PASS")!;
    
    // Use Better Auth's internal API to create user with proper password hashing
    try {
      // Create the signup request like a real signup
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
        console.log(`🔑 Password: ${adminPass}`);      } else {
        console.error("❌ Failed to create admin user");
      }
    } catch (error) {
      console.error("❌ Error during signup:", error);
        // Alternative method: Create user directly in database
      console.log("🔄 Trying alternative method...");
      try {
        // Use bcrypt to hash password manually
        const bcrypt = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
        const hashedPassword = await bcrypt.hash(adminPass);
        
        await client.queryObject(
          `INSERT INTO "user" (id, email, name, email_verified, "isAdmin", created_at, updated_at) 
           VALUES (gen_random_uuid(), $1, $2, true, true, NOW(), NOW())
           ON CONFLICT (email) DO UPDATE SET 
           "isAdmin" = true, 
           email_verified = true`,
          [adminEmail, "Admin User"]
        );
        
        // Create account entry with hashed password
        await client.queryObject(
          `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, 'credential', 
                   (SELECT id FROM "user" WHERE email = $1), $2, NOW(), NOW())
           ON CONFLICT (account_id, provider_id) DO UPDATE SET 
           password = EXCLUDED.password`,
          [adminEmail, hashedPassword]
        );
          console.log("✅ Admin user created using direct database method");
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Password: ${adminPass}`);
      } catch (dbError) {
        console.error("❌ Failed to create admin user via database:", dbError);
      }
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
