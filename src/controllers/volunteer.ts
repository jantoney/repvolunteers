import { Context } from "https://deno.land/x/oak@12.6.1/mod.ts";
import { getPool } from "../models/db.ts";
import { render } from "../utils/template.ts";

export async function viewSignup(ctx: Context) {
  const id = ctx.params.id;
  const pool = getPool();
  const volunteerRes = await pool.queryObject("SELECT * FROM volunteers WHERE id=$1", [id]);
  if (volunteerRes.rows.length === 0) {
    ctx.throw(404, "Volunteer not found");
  }

  const shiftsRes = await pool.queryObject(
    `SELECT s.* FROM shifts s
     LEFT JOIN volunteer_shifts vs ON vs.shift_id = s.id AND vs.volunteer_id = $1
     WHERE vs.volunteer_id IS NULL`,
    [id],
  );

  const html = await render(
    "views/signup.html",
    {
      name: volunteerRes.rows[0].name,
      shifts: JSON.stringify(shiftsRes.rows),
    },
  );
  ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
  ctx.response.body = html;
}

export async function submitSignup(ctx: Context) {
  const id = ctx.params.id;
  const { value } = await ctx.request.body({ type: "json" });
  const { shiftIds } = await value;
  const pool = getPool();
  for (const shiftId of shiftIds) {
    await pool.queryObject(
      "INSERT INTO volunteer_shifts (volunteer_id, shift_id) VALUES ($1, $2)",
      [id, shiftId],
    );
  }
  ctx.response.status = 201;
}
