import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.160.0/testing/asserts.ts";
import { Application, Router } from "oak";
import { getAuthPool, getPool, initDb } from "../src/models/db.ts";
import { setShiftNoShow } from "../src/controllers/shift-attendance.ts";
import {
  getShiftVolunteers,
  getVolunteerShifts,
} from "../src/controllers/admin.ts";
import { showEditVolunteerForm } from "../src/views/admin/edit-volunteer.ts";
import adminRouter from "../src/routes/admin.ts";

Deno.test({
  name:
    "admin no-shows are private, idempotent, reversible, and survive assignment changes",
  ignore: !Deno.env.get("TEST_DATABASE_URL"),
  async fn() {
    const url = Deno.env.get("TEST_DATABASE_URL")!;
    assert(new URL(url).pathname.endsWith("_test"));
    Deno.env.set("DATABASE_URL", url);
    Deno.env.set("MICROSOFT_CLIENT_ID", "attendance-test");
    Deno.env.set("MICROSOFT_CLIENT_SECRET", "attendance-test");
    Deno.env.set("MICROSOFT_TENANT_ID", "attendance-test");
    Deno.env.set(
      "BETTER_AUTH_SECRET",
      "attendance-test-secret-at-least-thirty-two-characters",
    );
    Deno.env.set("BETTER_AUTH_URL", "http://localhost");
    await initDb();
    const client = await getPool().connect();
    try {
      await client.queryArray(await Deno.readTextFile("db/schema.sql"));
      // Repeat baseline application to verify the additive schema is idempotent.
      await client.queryArray(await Deno.readTextFile("db/schema.sql"));
      const participants = (await client.queryObject<{ id: string }>(
        "INSERT INTO participants (name) VALUES ('Attendance Example'), ('Other Volunteer') RETURNING id",
      )).rows;
      const id = participants[0].id;
      const show = (await client.queryObject<{ id: number }>(
        "INSERT INTO shows (name) VALUES ('Attendance test production') RETURNING id",
      )).rows[0].id;
      const performance = (await client.queryObject<{ id: number }>(
        "INSERT INTO show_dates (show_id,start_time,end_time) VALUES ($1,NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days'+INTERVAL '2 hours') RETURNING id",
        [show],
      )).rows[0].id;
      const past = (await client.queryObject<{ id: number }>(
        "INSERT INTO shifts (show_date_id,role,arrive_time,depart_time) VALUES ($1,'Usher',NOW()-INTERVAL '3 days',NOW()-INTERVAL '2 days') RETURNING id",
        [performance],
      )).rows[0].id;
      const future = (await client.queryObject<{ id: number }>(
        "INSERT INTO shifts (show_date_id,role,arrive_time,depart_time,assigned_participant_id) VALUES ($1,'Door',NOW()+INTERVAL '3 days',NOW()+INTERVAL '4 days',$2) RETURNING id",
        [performance, id],
      )).rows[0].id;
      await client.queryArray("INSERT INTO participant_shifts VALUES ($1,$2)", [
        id,
        past,
      ]);
      const app = new Application();
      const router = new Router();
      router.use(async (ctx, next) => {
        ctx.state.user = {
          id: "test-admin",
          isAdmin: ctx.request.headers.get("x-test-admin") === "yes",
        };
        await next();
      });
      router.put(
        "/test/shifts/:shiftId/volunteers/:volunteerId/no-show",
        setShiftNoShow,
      );
      router.get("/test/shifts/:shiftId/volunteers", getShiftVolunteers);
      router.get("/test/volunteers/:volunteerId/shifts", getVolunteerShifts);
      router.get("/test/profile/:id", showEditVolunteerForm);
      app.use(router.routes());
      const mark = async (
        shift: number,
        participant: string,
        noShow: unknown,
        admin = true,
      ) => {
        const response = (await app.handle(
          new Request(
            `http://localhost/test/shifts/${shift}/volunteers/${participant}/no-show`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "x-test-admin": admin ? "yes" : "no",
              },
              body: JSON.stringify({ noShow }),
            },
          ),
        ))!;
        await response.json();
        return response.status;
      };
      assertEquals(await mark(past, id, true, false), 403);
      assertEquals(await mark(past, id, "true"), 400);
      assertEquals(await mark(past, "invalid", true), 400);
      assertEquals(await mark(999999, id, true), 404);
      assertEquals(await mark(future, id, true), 409);
      assertEquals(await mark(past, participants[1].id, true), 409);
      assertEquals(
        await Promise.all([mark(past, id, true), mark(past, id, true)]),
        [200, 200],
      );
      const count = async () =>
        (await client.queryObject<{ count: number }>(
          "SELECT count(*)::int AS count FROM participant_shift_no_shows WHERE participant_id=$1",
          [id],
        )).rows[0].count;
      assertEquals(await count(), 1);
      assertEquals(
        (await client.queryObject(
          "SELECT 1 FROM participant_shifts WHERE participant_id=$1 AND shift_id=$2",
          [id, past],
        )).rows.length,
        1,
      );
      let response = (await app.handle(
        new Request(`http://localhost/test/shifts/${past}/volunteers`),
      ))!;
      assertEquals((await response.json())[0].no_show, true);
      response = (await app.handle(
        new Request(`http://localhost/test/volunteers/${id}/shifts`),
      ))!;
      assert(!JSON.stringify(await response.json()).includes("no_show"));
      await client.queryArray(
        "DELETE FROM participant_shifts WHERE participant_id=$1 AND shift_id=$2",
        [id, past],
      );
      response =
        (await app.handle(new Request(`http://localhost/test/profile/${id}`)))!;
      const html = await response.text();
      assertStringIncludes(html, 'id="noShowCount">1</strong>');
      assertStringIncludes(html, 'class="no-show-badge">No-show');
      assert(!html.includes('class="profile-eyebrow">Volunteer profile'));
      assertEquals(await mark(past, id, false), 200);
      assertEquals(await mark(past, id, false), 200);
      assertEquals(await count(), 0);
      await client.queryArray(
        "UPDATE shifts SET assigned_participant_id=$1 WHERE id=$2",
        [id, past],
      );
      assertEquals(await mark(past, id, true), 200);
      response = (await app.handle(
        new Request(`http://localhost/test/shifts/${past}/volunteers`),
      ))!;
      assertEquals((await response.json())[0].id, id);
      assertEquals(await mark(past, id, false), 200);
      // Exercise the real admin route middleware without test authentication.
      const protectedApp = new Application();
      protectedApp.use(adminRouter.routes());
      response = (await protectedApp.handle(
        new Request(
          `http://localhost/api/shifts/${past}/volunteers/${id}/no-show`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ noShow: true }),
          },
        ),
      ))!;
      assertEquals(response.status, 403);
      await response.body?.cancel();
      assertEquals(await count(), 0);
      await client.queryArray("DELETE FROM shows WHERE id=$1", [show]);
      await client.queryArray("DELETE FROM participants WHERE id=ANY($1)", [
        participants.map((p) => p.id),
      ]);
    } finally {
      client.release();
      await getPool().end();
      await getAuthPool().end();
    }
  },
});
