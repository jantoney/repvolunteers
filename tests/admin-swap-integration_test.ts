import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.160.0/testing/asserts.ts";
import { Application, Router } from "oak";
import { getAuthPool, getPool, initDb } from "../src/models/db.ts";
import { swapVolunteerAssignment } from "../src/controllers/admin.ts";

Deno.test({
  name: "admin swaps are atomic and reject stale or inactive replacements",
  ignore: !Deno.env.get("TEST_DATABASE_URL"),
  async fn() {
    const url = Deno.env.get("TEST_DATABASE_URL")!;
    assert(new URL(url).pathname.endsWith("_test"));
    Deno.env.set("DATABASE_URL", url);
    await initDb();
    const client = await getPool().connect();
    try {
      await client.queryArray(await Deno.readTextFile("db/schema.sql"));
      const ids = (await client.queryObject<{ id: string }>(
        "INSERT INTO participants (name,status) VALUES ('Original','active'),('Replacement','active'),('Inactive','inactive') RETURNING id",
      )).rows.map((r) => r.id);
      const shiftId = (await client.queryObject<{ id: number }>(
        "INSERT INTO shifts (role,arrive_time,depart_time) VALUES ('Test', NOW(), NOW()+INTERVAL '1 hour') RETURNING id",
      )).rows[0].id;
      await client.queryArray("INSERT INTO participant_shifts VALUES ($1,$2)", [
        ids[0],
        shiftId,
      ]);
      const app = new Application();
      const router = new Router();
      router.post("/swap", swapVolunteerAssignment);
      app.use(router.routes());
      const swap = async (previousVolunteerId: string, volunteerId: string) => {
        const response = (await app.handle(
          new Request("http://localhost/swap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              shiftId,
              previousVolunteerId,
              volunteerId,
            }),
          }),
        ))!;
        await response.json();
        return response.status;
      };
      const assigned = async () =>
        (await client.queryObject<{ participant_id: string }>(
          "SELECT participant_id FROM participant_shifts WHERE shift_id=$1",
          [shiftId],
        )).rows.map((r) => r.participant_id);
      assertEquals(await swap(ids[0], ids[2]), 409);
      assertEquals(await assigned(), [ids[0]]);
      assertEquals(await swap(ids[0], ids[1]), 200);
      assertEquals(await assigned(), [ids[1]]);
      assertEquals(await swap(ids[0], ids[1]), 409);
      assertEquals(await assigned(), [ids[1]]);
      assertEquals(await swap(ids[1], ids[1]), 400);
      await client.queryArray(
        "DELETE FROM participant_shifts WHERE shift_id=$1",
        [shiftId],
      );
      await client.queryArray(
        "UPDATE shifts SET assigned_participant_id=$1 WHERE id=$2",
        [ids[0], shiftId],
      );
      assertEquals(await swap(ids[0], ids[1]), 200);
      assertEquals(
        (await client.queryObject<{ assigned_participant_id: string }>(
          "SELECT assigned_participant_id FROM shifts WHERE id=$1",
          [shiftId],
        )).rows[0].assigned_participant_id,
        ids[1],
      );
      await client.queryArray("DELETE FROM shifts WHERE id=$1", [shiftId]);
      await client.queryArray("DELETE FROM participants WHERE id=ANY($1)", [
        ids,
      ]);
    } finally {
      client.release();
      await getPool().end();
      await getAuthPool().end();
    }
  },
});
