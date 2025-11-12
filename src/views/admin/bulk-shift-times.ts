import type { RouterContext } from "oak";
import { getPool } from "../../models/db.ts";
import {
  type BulkShiftTimesPageData,
  renderBulkShiftTimesTemplate,
} from "./templates/bulk-shift-times-template.ts";

export async function showBulkShiftTimesPage(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const showsResult = await client.queryObject<{ id: number; name: string }>(
      "SELECT id, name FROM shows ORDER BY name"
    );

    const data: BulkShiftTimesPageData = {
      shows: showsResult.rows,
    };

    ctx.response.type = "text/html";
    ctx.response.body = renderBulkShiftTimesTemplate(data);
  } finally {
    client.release();
  }
}
