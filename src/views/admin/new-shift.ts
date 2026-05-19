import type { RouterContext } from "oak";
import { getPool } from "../../models/db.ts";
import {
  type NewShiftPageData,
  renderNewShiftTemplate,
  type Show,
} from "./templates/new-shift-template.ts";

export async function showNewShiftForm(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const showsResult = await client.queryObject<Show>(`
      SELECT s.id, s.name
      FROM shows s
      WHERE EXISTS (
        SELECT 1
        FROM show_dates sd
        WHERE sd.show_id = s.id
          AND sd.end_time >= NOW() - INTERVAL '3 hours'
      )
      ORDER BY s.name
    `);

    const data: NewShiftPageData = {
      shows: showsResult.rows,
    };

    ctx.response.type = "text/html";
    ctx.response.body = renderNewShiftTemplate(data);
  } finally {
    client.release();
  }
}
