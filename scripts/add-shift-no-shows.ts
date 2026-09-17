import { load } from "dotenv";
import { createClient } from "../src/utils/db-utils.ts";

await load({ export: true });
const client = await createClient();
try {
  await client.connect();
  await client.queryArray(
    `CREATE TABLE IF NOT EXISTS participant_shift_no_shows (
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  shift_id INTEGER NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by TEXT,
  PRIMARY KEY (participant_id, shift_id)
);
`,
  );
  console.log("Admin no-show tracking migration applied.");
} finally {
  await client.end();
}
