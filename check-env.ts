// Test database environment and connection
console.log("🔍 Checking database environment...");

const databaseUrl = Deno.env.get("DATABASE_URL");
if (!databaseUrl) {
  console.log("❌ DATABASE_URL environment variable is not set");
  console.log("Please set DATABASE_URL in your environment or .env file");
  Deno.exit(1);
}

console.log("✅ DATABASE_URL is set");
console.log("Database URL (masked):", databaseUrl.replace(/:[^:]*@/, ":***@"));

// Try to parse the URL
try {
  const parsed = new URL(databaseUrl);
  console.log("✅ DATABASE_URL is valid");
  console.log("  Host:", parsed.hostname);
  console.log("  Port:", parsed.port || 5432);
  console.log("  Database:", parsed.pathname.slice(1));
  console.log("  SSL Mode:", parsed.searchParams.get('sslmode') || 'none');
} catch (error) {
  console.log("❌ DATABASE_URL is invalid:", error.message);
  Deno.exit(1);
}

console.log("\n✅ Environment check complete. You can now run the participant check.");
