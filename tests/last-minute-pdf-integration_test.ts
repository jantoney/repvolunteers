import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.160.0/testing/asserts.ts";
import { getAuthPool, getPool, initDb } from "../src/models/db.ts";
import { getUnfilledShiftsForVolunteer } from "../src/controllers/admin.ts";
import { generateOutstandingShiftsPDFForVolunteer } from "../src/utils/unfilled-shifts-pdf-generator.ts";
import { buildLastMinutePreview } from "../src/utils/last-minute-preview.ts";

Deno.test({
  name: "last-minute PDF includes every eligible vacancy beyond ten dates",
  ignore: !Deno.env.get("TEST_DATABASE_URL"),
  async fn() {
    const url = Deno.env.get("TEST_DATABASE_URL")!;
    assert(new URL(url).pathname.endsWith("_test"));
    Deno.env.set("DATABASE_URL", url);
    await initDb();
    const client = await getPool().connect();
    let showId: number | undefined;
    let volunteerId: string | undefined;
    try {
      await client.queryArray(await Deno.readTextFile("db/schema.sql"));
      volunteerId = (await client.queryObject<{ id: string }>(
        "INSERT INTO participants (name) VALUES ('PDF test') RETURNING id",
      )).rows[0].id;
      showId = (await client.queryObject<{ id: number }>(
        "INSERT INTO shows (name) VALUES ($1) RETURNING id",
        [`A Long Production Title for Pagination ${crypto.randomUUID()}`],
      )).rows[0].id;
      for (let day = 0; day < 14; day++) {
        const date = (await client.queryObject<{ id: number }>(
          "INSERT INTO show_dates (show_id, start_time, end_time) VALUES ($1, '2035-01-01T19:00:00+10:30'::timestamptz + $2 * INTERVAL '2 days', '2035-01-01T22:00:00+10:30'::timestamptz + $2 * INTERVAL '2 days') RETURNING id",
          [showId, day],
        )).rows[0].id;
        if (day === 0) {
          await client.queryArray(
            "INSERT INTO volunteer_unavailable_performances (participant_id, show_date_id) VALUES ($1,$2)",
            [volunteerId, date],
          );
        }
        for (let role = 0; role < 6; role++) {
          await client.queryArray(
            "INSERT INTO shifts (show_date_id, role, arrive_time, depart_time, assigned_participant_id) SELECT id, $2, start_time - INTERVAL '1 hour', end_time, $3 FROM show_dates WHERE id=$1",
            [
              date,
              day === 13 && role === 5
                ? "LASTVACANCY"
                : `Day ${day} volunteer role ${role}`,
              day === 1 && role === 0 ? volunteerId : null,
            ],
          );
        }
      }
      const shifts = await getUnfilledShiftsForVolunteer(volunteerId);
      assertEquals(shifts.length, 72);
      assert(
        !shifts.some((s) =>
          s.role.startsWith("Day 0 ") || s.role.startsWith("Day 1 ")
        ),
      );
      const preview = buildLastMinutePreview(shifts);
      assertEquals(preview.length, 10);
      assertEquals(
        (preview.join("").match(/volunteer role/g) || []).length,
        60,
      );
      assert(!preview.join("").includes("LASTVACANCY"));
      const pdf = await generateOutstandingShiftsPDFForVolunteer(
        volunteerId,
        null,
        { name: "Coordinator", phone: "0400000000" },
      );
      const pdfText = new TextDecoder().decode(pdf);
      assert(pdfText.includes("LASTVACANCY"));
      assert((pdfText.match(/\/Type \/Page\b/g) || []).length >= 3);
      const output = Deno.env.get("TEST_PDF_OUTPUT");
      if (output) await Deno.writeFile(output, pdf);
    } finally {
      if (showId) {
        await client.queryArray("DELETE FROM shows WHERE id=$1", [showId]);
      }
      if (volunteerId) {
        await client.queryArray("DELETE FROM participants WHERE id=$1", [
          volunteerId,
        ]);
      }
      client.release();
      await getPool().end();
      await getAuthPool().end();
    }
  },
});
