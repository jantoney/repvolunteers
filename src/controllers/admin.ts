import { Context } from "https://deno.land/x/oak@12.6.1/mod.ts";
import { getPool } from "../models/db.ts";
import { hash } from "https://deno.land/x/bcrypt@0.4.1/mod.ts";

export async function login(ctx: Context) {
  const { value } = await ctx.request.body({ type: "json" });
  const { username, password } = await value;
  // TODO: replace with real authentication check
  if (username === Deno.env.get("ADMIN_USER") && password === Deno.env.get("ADMIN_PASS")) {
    ctx.response.status = 200;
    ctx.response.body = { success: true };
  } else {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
  }
}

export async function listShows(ctx: Context) {
  const pool = getPool();
  const result = await pool.queryObject("SELECT * FROM shows ORDER BY date");
  ctx.response.body = result.rows;
}

export async function createShow(ctx: Context) {
  const { value } = await ctx.request.body({ type: "json" });
  const { name, date } = await value;
  const pool = getPool();
  await pool.queryObject("INSERT INTO shows (name, date) VALUES ($1, $2)", [name, date]);
  ctx.response.status = 201;
}

export async function updateShow(ctx: Context) {
  const id = ctx.params.id;
  const { value } = await ctx.request.body({ type: "json" });
  const { name, date } = await value;
  const pool = getPool();
  await pool.queryObject("UPDATE shows SET name=$1, date=$2 WHERE id=$3", [name, date, id]);
  ctx.response.status = 204;
}

export async function deleteShow(ctx: Context) {
  const id = ctx.params.id;
  const pool = getPool();
  await pool.queryObject("DELETE FROM shows WHERE id=$1", [id]);
  ctx.response.status = 204;
}

export async function listVolunteers(ctx: Context) {
  const pool = getPool();
  const result = await pool.queryObject("SELECT * FROM volunteers ORDER BY name");
  ctx.response.body = result.rows;
}

export async function createVolunteer(ctx: Context) {
  const { value } = await ctx.request.body({ type: "json" });
  const { name, email, phone } = await value;
  const pool = getPool();
  const res = await pool.queryObject<{ id: number }>(
    "INSERT INTO volunteers (name, email, phone) VALUES ($1, $2, $3) RETURNING id",
    [name, email, phone],
  );
  const id = res.rows[0].id;
  ctx.response.status = 201;
  ctx.response.body = { id, signupLink: `${Deno.env.get("BASE_URL")}/volunteer/signup/${id}` };
}

export async function getVolunteer(ctx: Context) {
  const id = ctx.params.id;
  const pool = getPool();
  const result = await pool.queryObject("SELECT * FROM volunteers WHERE id=$1", [id]);
  if (result.rows.length === 0) {
    ctx.throw(404, "Volunteer not found");
  }
  ctx.response.body = result.rows[0];
}

export async function updateVolunteer(ctx: Context) {
  const id = ctx.params.id;
  const { value } = await ctx.request.body({ type: "json" });
  const { name, email, phone } = await value;
  const pool = getPool();
  await pool.queryObject("UPDATE volunteers SET name=$1, email=$2, phone=$3 WHERE id=$4", [name, email, phone, id]);
  ctx.response.status = 204;
}

export async function deleteVolunteer(ctx: Context) {
  const id = ctx.params.id;
  const pool = getPool();
  await pool.queryObject("DELETE FROM volunteers WHERE id=$1", [id]);
  ctx.response.status = 204;
}

export async function listShifts(ctx: Context) {
  const pool = getPool();
  const result = await pool.queryObject("SELECT * FROM shifts ORDER BY start_time");
  ctx.response.body = result.rows;
}

export async function createShift(ctx: Context) {
  const { value } = await ctx.request.body({ type: "json" });
  const { show_id, role, start_time, end_time } = await value;
  const pool = getPool();
  await pool.queryObject(
    "INSERT INTO shifts (show_id, role, start_time, end_time) VALUES ($1, $2, $3, $4)",
    [show_id, role, start_time, end_time],
  );
  ctx.response.status = 201;
}

export async function updateShift(ctx: Context) {
  const id = ctx.params.id;
  const { value } = await ctx.request.body({ type: "json" });
  const { role, start_time, end_time } = await value;
  const pool = getPool();
  await pool.queryObject(
    "UPDATE shifts SET role=$1, start_time=$2, end_time=$3 WHERE id=$4",
    [role, start_time, end_time, id],
  );
  ctx.response.status = 204;
}

export async function deleteShift(ctx: Context) {
  const id = ctx.params.id;
  const pool = getPool();
  await pool.queryObject("DELETE FROM shifts WHERE id=$1", [id]);
  ctx.response.status = 204;
}

export async function unfilledShifts(ctx: Context) {
  const pool = getPool();
  const result = await pool.queryObject(
    `SELECT s.*, COUNT(vs.volunteer_id) as filled
     FROM shifts s
     LEFT JOIN volunteer_shifts vs ON vs.shift_id = s.id
     GROUP BY s.id
     HAVING COUNT(vs.volunteer_id) = 0`
  );
  ctx.response.body = result.rows;
}
