import { load } from "dotenv";
import { createClient } from "../src/utils/db-utils.ts";

// Load environment variables
await load({ export: true });

async function runMigrations() {
  const client = await createClient();
  
  try {
    await client.connect();
    console.log("Connected to database");
    
    // Read the schema file
    const schema = await Deno.readTextFile("./db/schema.sql");
    
    // Execute the schema
    await client.queryArray(schema);
    
    console.log("Database schema applied successfully");
    
  } catch (error) {
    console.error("Migration failed:", error);
    Deno.exit(1);
  } finally {
    await client.end();
  }
}

// Run the migration
if (import.meta.main) {
  await runMigrations();
}
