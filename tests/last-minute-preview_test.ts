import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.160.0/testing/asserts.ts";
import { buildLastMinutePreview } from "../src/utils/last-minute-preview.ts";

Deno.test("preview lists each performance once on ten vacancy dates, skipping gaps", () => {
  const shifts = Array.from(
    { length: 12 },
    (_, day) =>
      Array.from({ length: 3 }, (_, role) => ({
        show_start: new Date(Date.UTC(2030, 0, 1 + day * 3, 10)),
        show_end: new Date(Date.UTC(2030, 0, 1 + day * 3, 12)),
        show_date_id: day,
        show_name: `Production ${day}`,
        role: `Role ${role}`,
      })),
  ).flat().reverse();
  const preview = buildLastMinutePreview(shifts);
  assertEquals(preview.length, 10);
  assert(preview[9].includes("Production 9"));
  assert(!preview.join("").includes("Production 10"));
  assertEquals((preview.join("").match(/Production /g) || []).length, 10);
  assertEquals(buildLastMinutePreview([]), []);
});

Deno.test("preview groups by Adelaide dates across UTC midnight and escapes names", () => {
  const preview = buildLastMinutePreview([
    {
      show_start: "2030-01-01T14:00:00Z",
      show_end: "2030-01-01T16:00:00Z",
      show_date_id: 1,
      show_name: "<Show>",
    },
    {
      show_start: "2030-01-02T01:00:00Z",
      show_end: "2030-01-02T03:00:00Z",
      show_date_id: 2,
      show_name: "Later",
    },
  ]);
  assertEquals(preview.length, 1);
  assert(preview[0].replace(/\s/g, " ").includes("11:30 am – 01:30 pm"));
  assert(preview[0].includes("02 Jan 2030"));
  assert(preview[0].replace(/\s/g, " ").includes("12:30 am – 02:30 am"));
  assert(preview[0].includes("&lt;Show&gt;"));
});
