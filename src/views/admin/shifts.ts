import type { RouterContext } from "oak";
import { getPool } from "../../models/db.ts";
import { renderShiftsTemplate, type ShiftsPageData, type Shift } from "./templates/shifts-template.ts";

export async function showShiftsPage(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    // Get the selected show ID(s) and date from query params
    const selectedShowId = ctx.request.url.searchParams.get('show');
    const selectedShowIds = ctx.request.url.searchParams.get('shows');
    const selectedDate = ctx.request.url.searchParams.get('date');
    
    // Parse show IDs - handle both single 'show' and multiple 'shows' parameters
    let showIdArray: string[] = [];
    if (selectedShowIds) {
      showIdArray = selectedShowIds.split(',').filter(id => id.trim() !== '');
    } else if (selectedShowId) {
      showIdArray = [selectedShowId];
    }
    
    // Get all shows for the dropdown
    const showsResult = await client.queryObject<{
      id: number;
      name: string;
    }>("SELECT id, name FROM shows ORDER BY name");
    
    // Build the shifts query with optional show filter
    let shiftsQuery = `
      SELECT s.id, s.show_date_id, sh.id as show_id, sh.name as show_name, 
             DATE(sd.start_time AT TIME ZONE 'Australia/Adelaide') as date, 
             TO_CHAR(sd.start_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as show_start, 
             TO_CHAR(sd.end_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as show_end,
             s.role, 
             TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as arrive_time, 
             TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as depart_time,
             COUNT(vs.participant_id) as volunteer_count
      FROM shifts s
      JOIN show_dates sd ON sd.id = s.show_date_id
      JOIN shows sh ON sh.id = sd.show_id
      LEFT JOIN participant_shifts vs ON vs.shift_id = s.id
    `;
    
    const queryParams = [];
    const whereConditions = [];
    
    if (showIdArray.length > 0) {
      const placeholders = showIdArray.map((_, index) => `$${queryParams.length + index + 1}`).join(',');
      whereConditions.push(`sh.id IN (${placeholders})`);
      queryParams.push(...showIdArray);
    }
    
    if (selectedDate) {
      whereConditions.push(`DATE(sd.start_time AT TIME ZONE 'Australia/Adelaide') = $${queryParams.length + 1}`);
      queryParams.push(selectedDate);
    }
    
    if (whereConditions.length > 0) {
      shiftsQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    shiftsQuery += `
      GROUP BY s.id, sh.id, sh.name, DATE(sd.start_time AT TIME ZONE 'Australia/Adelaide'), sd.start_time, sd.end_time, s.arrive_time, s.depart_time
      ORDER BY DATE(sd.start_time AT TIME ZONE 'Australia/Adelaide'), s.arrive_time AT TIME ZONE 'Australia/Adelaide'
    `;
    
    const shiftsResult = await client.queryObject<{
      id: number;
      show_date_id: number;
      show_id: number;
      show_name: string;
      date: string;
      show_start: string;
      show_end: string;
      role: string;
      arrive_time: string;
      depart_time: string;
      volunteer_count: number;
    }>(shiftsQuery, queryParams);
    
    // Group shifts by performance (show date)
    const groupedShifts = new Map<string, Shift[]>();
    for (const shift of shiftsResult.rows) {
      const key = `${shift.show_name} - ${shift.date}`;
      if (!groupedShifts.has(key)) {
        groupedShifts.set(key, []);
      }
      
      // Pass the formatted string timestamps as received from the database (already in Adelaide time)
      const formattedShift: Shift = {
        ...shift,
        show_start: shift.show_start,
        show_end: shift.show_end,
        arrive_time: shift.arrive_time,
        depart_time: shift.depart_time
      };
      
      groupedShifts.get(key)!.push(formattedShift);
    }
    
    const data: ShiftsPageData = {
      shows: showsResult.rows,
      groupedShifts,
      selectedShowIds: showIdArray,
      selectedDate
    };
    
    ctx.response.type = "text/html";
    ctx.response.body = renderShiftsTemplate(data);
  } finally {
    client.release();
  }
}
