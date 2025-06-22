import type { RouterContext } from "oak";
import { getPool } from "../../models/db.ts";
import { renderEditShiftTemplate, type EditShiftPageData, type Shift, type ShowDate } from "./templates/edit-shift-template.ts";

export async function showEditShiftForm(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const [shiftResult, showDatesResult] = await Promise.all([
      client.queryObject<Shift>("SELECT id, show_date_id, role, arrive_time, depart_time FROM shifts WHERE id=$1", [id]),
      client.queryObject<ShowDate>(
        `SELECT sd.id, s.name as show_name, sd.date, sd.start_time, sd.end_time 
         FROM show_dates sd 
         JOIN shows s ON s.id = sd.show_id 
         ORDER BY sd.date, s.name`
      )
    ]);
    
    if (shiftResult.rows.length === 0) {
      ctx.throw(404, "Shift not found");
    }
    
    const data: EditShiftPageData = {
      shift: shiftResult.rows[0],
      showDates: showDatesResult.rows
    };
    
    ctx.response.type = "text/html";
    ctx.response.body = renderEditShiftTemplate(data);
  } finally {
    client.release();
  }
}
