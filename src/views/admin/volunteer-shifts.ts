import type { RouterContext } from "oak";
import { getPool } from "../../models/db.ts";
import { renderVolunteerShiftsTemplate, type VolunteerShiftsPageData, type VolunteerShift } from "./templates/volunteer-shifts-template.ts";

export async function showVolunteerShiftsPage(ctx: RouterContext<string>) {
  const volunteerId = ctx.params.id;
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // Get volunteer details
    const volunteerResult = await client.queryObject(`
      SELECT id, name, email
      FROM participants 
      WHERE id = $1
    `, [volunteerId]);
    
    if (volunteerResult.rows.length === 0) {
      ctx.throw(404, "Volunteer not found");
    }
    
    const volunteer = volunteerResult.rows[0] as { id: number; name: string; email: string };
    
    // Get assigned shifts for this volunteer with proper timezone formatting
    const assignedShiftsResult = await client.queryObject(`
      SELECT 
        s.id,
        sd.show_id,
        sh.name as show_name,
        s.role,
        TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'DD/MM/YYYY') as date,
        CASE 
          WHEN s.arrive_time IS NOT NULL AND s.depart_time IS NOT NULL THEN
            'Arrive: ' || TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'FMHH12:MI AM') || 
            ' | Depart: ' || TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'FMHH12:MI AM') ||
            CASE 
              WHEN (s.arrive_time AT TIME ZONE 'Australia/Adelaide')::date != (s.depart_time AT TIME ZONE 'Australia/Adelaide')::date 
              THEN ' (+1 day)'
              ELSE ''
            END
          WHEN s.arrive_time IS NOT NULL THEN
            'Arrive: ' || TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'FMHH12:MI AM')
          WHEN s.depart_time IS NOT NULL THEN
            'Depart: ' || TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'FMHH12:MI AM')
          ELSE 'Time TBD'
        END as time,
        s.arrive_time,
        s.depart_time,
        sd.id as performance_id
      FROM shifts s
      JOIN participant_shifts ps ON ps.shift_id = s.id
      JOIN show_dates sd ON s.show_date_id = sd.id
      JOIN shows sh ON sd.show_id = sh.id
      WHERE ps.participant_id = $1
      ORDER BY sd.start_time, s.arrive_time
    `, [volunteerId]);
    
    const assignedShifts = assignedShiftsResult.rows as VolunteerShift[];
    
    const data: VolunteerShiftsPageData = {
      volunteer,
      assignedShifts
    };
    
    ctx.response.headers.set("Content-Type", "text/html");
    ctx.response.body = renderVolunteerShiftsTemplate(data);
    
  } finally {
    client.release();
  }
}
