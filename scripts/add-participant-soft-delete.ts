import { load } from "dotenv";
import { createClient } from "../src/utils/db-utils.ts";

await load({ export: true });
const client = await createClient();
try {
  await client.connect();
  await client.queryArray(
    "ALTER TABLE participants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ",
  );
  console.log("Volunteer soft-delete migration applied.");
} finally {
  await client.end();
}
