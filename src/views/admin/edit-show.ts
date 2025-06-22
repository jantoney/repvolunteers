import type { RouterContext } from "oak";
import { getPool } from "../../models/db.ts";
import { renderEditShowTemplate, type EditShowPageData, type Show, type ShowDate } from "./templates/edit-show-template.ts";

export async function showEditShowForm(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // Get show details
    const showResult = await client.queryObject<Show>("SELECT id, name FROM shows WHERE id=$1", [id]);
    
    if (showResult.rows.length === 0) {
      ctx.throw(404, "Show not found");
    }
    
    // Get show dates for this show
    const datesResult = await client.queryObject<ShowDate>(
      "SELECT id, date, start_time, end_time FROM show_dates WHERE show_id = $1 ORDER BY date",
      [id]
    );
    
    const data: EditShowPageData = {
      show: showResult.rows[0],
      showDates: datesResult.rows
    };
    
    ctx.response.type = "text/html";
    ctx.response.body = renderEditShowTemplate(data);
  } finally {
    client.release();
  }
}
