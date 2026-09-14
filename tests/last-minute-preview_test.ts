import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.160.0/testing/asserts.ts";
import { buildLastMinutePreview } from "../src/utils/last-minute-preview.ts";

Deno.test("preview includes all shifts on ten vacancy dates, skipping gaps", () => {
  const shifts = Array.from(
    { length: 12 },
    (_, day) =>
      Array.from({ length: 3 }, (_, role) => ({
        show_start: new Date(Date.UTC(2030, 0, 1 + day * 3, 10)),
        arrive_time: new Date(Date.UTC(2030, 0, 1 + day * 3, 9)),
        show_name: `Production ${day}`,
        role: `Role ${role}`,
      })),
  ).flat().reverse();
  const preview = buildLastMinutePreview(shifts);
  assertEquals(preview.length, 10);
  assert(preview[9].includes("Production 9 (Role 2)"));
  assert(!preview.join("").includes("Production 10"));
  assertEquals((preview.join("").match(/Role /g) || []).length, 30);
  assertEquals(buildLastMinutePreview([]), []);
});

Deno.test("preview groups by Adelaide dates across UTC midnight and escapes names", () => {
  const preview = buildLastMinutePreview([
    {
      show_start: "2030-01-01T14:00:00Z",
      arrive_time: "2030-01-01T13:00:00Z",
      show_name: "<Show>",
      role: "A & B",
    },
    {
      show_start: "2030-01-02T01:00:00Z",
      arrive_time: "2030-01-02T00:00:00Z",
      show_name: "Later",
      role: "Door",
    },
  ]);
  assertEquals(preview.length, 1);
  assert(preview[0].includes("02 Jan 2030"));
  assert(preview[0].replace(/\s/g, " ").includes("11:30 pm"));
  assert(preview[0].includes("&lt;Show&gt; (A &amp; B)"));
});
