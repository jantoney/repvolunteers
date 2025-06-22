#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

console.log("Running show structure migration...");

try {
  const { migrateShowStructure } = await import("./scripts/migrate-show-structure.ts");
  await migrateShowStructure();
  console.log("Migration completed successfully!");
} catch (error) {
  console.error("Migration failed:", error);
  Deno.exit(1);
}
