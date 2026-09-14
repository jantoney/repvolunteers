import type { Context } from "oak";
import { getPool } from "../models/db.ts";

/** Stop old personal links and admin actions from reviving deleted records. */
export async function rejectDeletedVolunteer(
  ctx: Context,
  id: string,
): Promise<boolean> {
  const client = await getPool().connect();
  try {
    const result = await client.queryObject<{ deleted: boolean }>(
      "SELECT deleted_at IS NOT NULL AS deleted FROM participants WHERE id = $1",
      [id],
    );
    if (!result.rows[0]?.deleted) return false;
    ctx.response.status = 404;
    ctx.response.body = { error: "Volunteer not found" };
    return true;
  } finally {
    client.release();
  }
}
