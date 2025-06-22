import type { RouterContext } from "oak";
import { getPool } from "../../models/db.ts";
import { renderUnfilledShiftsTemplate, type UnfilledShiftsPageData } from "./templates/unfilled-shifts-template.ts";

export async function showUnfilledShiftsPage(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.queryObject<{
      id: number;
      show_date_id: number;
      show_name: string;
      date: string;
      show_start: string;
      show_end: string;
      role: string;
      arrive_time: Date;
      depart_time: Date;
    }>(
      `SELECT s.id, s.show_date_id, sh.name as show_name, sd.date,
              sd.start_time as show_start, sd.end_time as show_end,
              s.role, s.arrive_time, s.depart_time
       FROM shifts s
       JOIN show_dates sd ON sd.id = s.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       LEFT JOIN participant_shifts vs ON vs.shift_id = s.id
       GROUP BY s.id, sh.name, sd.date, sd.start_time, sd.end_time, s.role, s.arrive_time, s.depart_time
       HAVING COUNT(vs.participant_id) = 0
       ORDER BY sd.date, s.arrive_time`
    );
    
    const data: UnfilledShiftsPageData = {
      shifts: result.rows
    };
    
    ctx.response.type = "text/html";
    ctx.response.body = renderUnfilledShiftsTemplate(data);
  } finally {
    client.release();
  }
}
