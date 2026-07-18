import { getAdelaideTimeParameterSQL } from "../src/utils/timezone.ts";

Deno.test("getAdelaideTimeParameterSQL casts prepared-statement parameters", () => {
  const actual = getAdelaideTimeParameterSQL("$1");
  const expected = "$1::timestamp AT TIME ZONE 'Australia/Adelaide'";

  if (actual !== expected) {
    throw new Error(`Expected ${expected}, received ${actual}`);
  }
});
