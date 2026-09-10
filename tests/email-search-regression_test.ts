import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.160.0/testing/asserts.ts";
import {
  renderLastMinuteShiftsEmail,
  renderVolunteerLoginEmail,
} from "../src/utils/email.ts";
import { renderVolunteersTemplate } from "../src/views/admin/templates/volunteers-template.ts";

const loginUrl =
  "https://example.com/volunteer/signup/11111111-1111-1111-1111-111111111111";
const data = {
  volunteerName: "Josh",
  volunteerEmail: "josh@example.com",
  loginUrl,
};

Deno.test("login email closes its hidden preview before the visible content", () => {
  const html = renderVolunteerLoginEmail(data);
  const beforeTable = html.slice(0, html.indexOf("<table"));
  assertEquals(
    (beforeTable.match(/<div\b/g) || []).length,
    (beforeTable.match(/<\/div>/g) || []).length,
  );
  assert(html.includes(`href="${loginUrl}"`));
});

Deno.test("last minute emails include a personal sign in link with and without shifts", () => {
  for (const hasShifts of [true, false]) {
    const html = renderLastMinuteShiftsEmail({
      ...data,
      hasShifts,
      shifts: hasShifts ? ["Sample shift"] : [],
    });
    assert(html.includes(`href="${loginUrl}"`));
  }
});

Deno.test("rendered volunteer search preserves s and normalizes whitespace and accents", () => {
  const html = renderVolunteersTemplate({ volunteers: [] });
  const source = html.match(
    /const normalizeSearchValue = rawValue => \{([\s\S]*?)\n          \};/,
  )![1];
  const normalize = new Function("rawValue", source);
  assertEquals(normalize("jos"), "jos");
  assertEquals(normalize("josh"), "josh");
  assertEquals(normalize("  JÓSH\t Smith  "), "josh smith");
  for (const name of ["Josh Example", "Joshua Example"]) {
    assert(name.toLowerCase().includes(normalize("josh")));
  }
});
