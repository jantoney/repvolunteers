import {
  assert,
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.160.0/testing/asserts.ts";
import { Application, Router } from "oak";
import { getAuthPool, getPool, initDb } from "../src/models/db.ts";
import authRouter from "../src/routes/auth.ts";
import volunteerRouter from "../src/routes/volunteer.ts";
import { deleteVolunteer, listVolunteers } from "../src/controllers/admin.ts";
import { markParticipantActive } from "../src/utils/participant-lifecycle.ts";
import { renderEditVolunteerTemplate } from "../src/views/admin/templates/edit-volunteer-template.ts";

// Run only against an explicitly provided disposable database.
Deno.test({
  name:
    "registration email and soft deletion preserve history and revoke access",
  ignore: !Deno.env.get("TEST_DATABASE_URL"),
  async fn() {
    const databaseUrl = Deno.env.get("TEST_DATABASE_URL")!;
    assert(new URL(databaseUrl).pathname.endsWith("_test"));
    Deno.env.set("DATABASE_URL", databaseUrl);
    Deno.env.set("DENO_ENV", "production");
    Deno.env.set("RESEND_API_KEY", "test-only-no-real-delivery");
    Deno.env.set("BASE_URL", "https://example.com");
    await initDb();
    const client = await getPool().connect();
    const originalFetch = globalThis.fetch;
    let rejectEmail = false;
    const sent: Array<{ html: string; to: string[] }> = [];
    globalThis.fetch = (input, init) => {
      assert(String(input).startsWith("https://api.resend.com/"));
      sent.push(JSON.parse(String(init?.body)));
      return Promise.resolve(
        new Response(
          JSON.stringify(
            rejectEmail
              ? { name: "validation_error", message: "Test rejection" }
              : { id: "test-email-id" },
          ),
          {
            status: rejectEmail ? 422 : 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    };
    try {
      await client.queryArray(await Deno.readTextFile("db/schema.sql"));
      const app = new Application();
      app.use(authRouter.routes());
      app.use(volunteerRouter.routes());
      // Controller integration; production admin routes separately require authentication.
      const admin = new Router();
      admin.delete("/test/volunteers/:id", deleteVolunteer);
      admin.get("/test/volunteers", listVolunteers);
      app.use(admin.routes());
      const email = `${crypto.randomUUID()}@example.com`;
      const register = () =>
        app.handle(
          new Request("http://localhost/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "Test Volunteer",
              email,
              phone: "0400000000",
            }),
          }),
        );
      let response = (await register())!;
      assertEquals(response.status, 200);
      const registration = await response.json();
      const id = registration.id;
      assert(registration.loginEmailSent);
      assert(
        sent[0].html.includes(
          `href="https://example.com/volunteer/signup/${id}"`,
        ),
      );
      const history = await client.queryObject(
        "SELECT id FROM sent_emails WHERE to_participant_id = $1",
        [id],
      );
      assertEquals(history.rows.length, 1);
      response = (await register())!;
      assertEquals(response.status, 409);
      await response.body?.cancel();
      assertEquals(sent.length, 1);

      const production = await client.queryObject<{ id: number }>(
        "INSERT INTO shows (name) VALUES ($1) RETURNING id",
        [crypto.randomUUID()],
      );
      const performance = await client.queryObject<{ id: number }>(
        "INSERT INTO show_dates (show_id, start_time, end_time) VALUES ($1, NOW(), NOW() + INTERVAL '2 hours') RETURNING id",
        [production.rows[0].id],
      );
      for (const offset of ["-2 days", "2 days"]) {
        const shift = await client.queryObject<{ id: number }>(
          "INSERT INTO shifts (show_date_id, role, arrive_time, depart_time, assigned_participant_id) VALUES ($1, 'Test', NOW() + $2::interval, NOW() + $2::interval + INTERVAL '2 hours', $3) RETURNING id",
          [performance.rows[0].id, offset, id],
        );
        await client.queryArray(
          "INSERT INTO participant_shifts (participant_id, shift_id) VALUES ($1, $2)",
          [id, shift.rows[0].id],
        );
      }
      response = (await app.handle(
        new Request(`http://localhost/test/volunteers/${id}`, {
          method: "DELETE",
        }),
      ))!;
      assertEquals(response.status, 200);
      assertEquals((await response.json()).removedShiftCount, 2);
      const record = await client.queryObject<
        { deleted: boolean; approved: boolean; status: string }
      >(
        "SELECT deleted_at IS NOT NULL AS deleted, approved, status FROM participants WHERE id=$1",
        [id],
      );
      assertEquals(record.rows[0], {
        deleted: true,
        approved: false,
        status: "inactive",
      });
      assertEquals(
        (await client.queryObject(
          "SELECT shift_id FROM participant_shifts WHERE participant_id=$1",
          [id],
        )).rows.length,
        1,
      );
      assertEquals(
        (await client.queryObject(
          "SELECT id FROM shifts WHERE assigned_participant_id=$1",
          [id],
        )).rows.length,
        1,
      );
      assertEquals(
        (await client.queryObject(
          "SELECT id FROM participant_notes WHERE participant_id=$1",
          [id],
        )).rows.length,
        1,
      );
      assertEquals(
        (await client.queryObject(
          "SELECT id FROM sent_emails WHERE to_participant_id=$1",
          [id],
        )).rows.length,
        1,
      );
      await assertRejects(
        () => markParticipantActive(id),
        Error,
        "Volunteer not found",
      );
      for (
        const [path, method] of [
          ["", "GET"],
          ["/pdf", "GET"],
          ["/opt-in", "POST"],
          ["", "POST"],
          ["/shift", "DELETE"],
        ]
      ) {
        response = (await app.handle(
          new Request(`http://localhost/signup/${id}${path}`, { method }),
        ))!;
        assertEquals(response.status, 404);
        await response.body?.cancel();
      }
      response =
        (await app.handle(new Request("http://localhost/test/volunteers")))!;
      assert(
        !(await response.json()).some((row: { id: string }) => row.id === id),
      );

      // A deleted duplicate no longer blocks registration; delivery rejection is honest.
      rejectEmail = true;
      response = (await register())!;
      assertEquals(response.status, 200);
      const failedDelivery = await response.json();
      assertEquals(failedDelivery.loginEmailSent, false);
      assert(failedDelivery.id !== id);
      assert(failedDelivery.message.includes("do not need to register again"));
      const html = renderEditVolunteerTemplate({
        volunteer: {
          id,
          name: "Test",
          email,
          phone: "0400000000",
          status: "active",
        },
        assignedShifts: [],
        pastShifts: [],
        notes: [],
      });
      assert(html.includes('id="deleteVolunteerBtn"'));
    } finally {
      globalThis.fetch = originalFetch;
      client.release();
      await getPool().end();
      await getAuthPool().end();
    }
  },
});
