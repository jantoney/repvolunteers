import type { RouterContext } from "oak";
import { getPool } from "../models/db.ts";

// Attendance is deliberately independent of assignment/fill status.
export async function setShiftNoShow(ctx: RouterContext<string>) {
  if (!ctx.state.user?.isAdmin) {
    ctx.response.status = 403;
    ctx.response.body = { error: "Admin access required" };
    return;
  }
  const shiftId = Number(ctx.params.shiftId);
  const participantId = ctx.params.volunteerId ?? "";
  let body: { noShow?: unknown };
  try {
    body = await ctx.request.body.json();
  } catch {
    ctx.response.status = 400;
    ctx.response.body = { error: "Provide a valid no-show status." };
    return;
  }
  if (
    !Number.isSafeInteger(shiftId) || shiftId < 1 ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      participantId,
    ) ||
    typeof body?.noShow !== "boolean"
  ) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: "Provide a valid shift, volunteer and no-show status.",
    };
    return;
  }
  const client = await getPool().connect();
  try {
    await client.queryArray("BEGIN");
    const result = await client.queryObject<
      { started: boolean; assigned_participant_id: string | null }
    >(
      `SELECT COALESCE(s.arrive_time, sd.start_time) <= NOW() AS started, s.assigned_participant_id
       FROM shifts s LEFT JOIN show_dates sd ON sd.id = s.show_date_id
       WHERE s.id = $1 FOR UPDATE OF s`,
      [shiftId],
    );
    if (!result.rows.length) {
      await client.queryArray("ROLLBACK");
      ctx.response.status = 404;
      ctx.response.body = { error: "Shift not found." };
      return;
    }
    if (body.noShow) {
      const assignment = await client.queryObject(
        "SELECT 1 FROM participant_shifts WHERE shift_id = $1 AND participant_id = $2 FOR UPDATE",
        [shiftId, participantId],
      );
      if (
        !result.rows[0].started ||
        (!assignment.rows.length &&
          result.rows[0].assigned_participant_id !== participantId)
      ) {
        await client.queryArray("ROLLBACK");
        ctx.response.status = 409;
        ctx.response.body = {
          error:
            "Only assigned volunteers can be marked as a no-show after their shift starts.",
        };
        return;
      }
      await client.queryArray(
        `INSERT INTO participant_shift_no_shows (participant_id, shift_id, recorded_by)
         VALUES ($1, $2, $3) ON CONFLICT (participant_id, shift_id) DO NOTHING`,
        [participantId, shiftId, ctx.state.user.id],
      );
    } else {
      await client.queryArray(
        "DELETE FROM participant_shift_no_shows WHERE participant_id = $1 AND shift_id = $2",
        [participantId, shiftId],
      );
    }
    await client.queryArray("COMMIT");
    ctx.response.body = { noShow: body.noShow };
  } catch (error) {
    await client.queryArray("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
