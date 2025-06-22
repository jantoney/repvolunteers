import type { RouterContext } from "oak";
import { getPool } from "../models/db.ts";
import { getCurrentTimeAdelaide, getCurrentDateAdelaide } from "../utils/timezone.ts";
import { getAuth } from "../auth.ts";

// Import view functions from separated files
export {
  showLoginForm,
  showDashboard,
  showShowsPage,
  showNewShowForm,
  showEditShowForm,
  showVolunteersPage,
  showNewVolunteerForm,
  showEditVolunteerForm,
  showShiftsPage,
  showNewShiftForm,
  showEditShiftForm,
  showUnfilledShiftsPage,
} from "../views/admin/index.ts";

// Logout function
export async function logout(ctx: RouterContext<string>) {
  try {
    const auth = getAuth();
    
    // Create request object for Better Auth
    const request = new Request(ctx.request.url, {
      method: "POST",
      headers: ctx.request.headers,
    });
    
    // Call Better Auth's sign out API
    await auth.api.signOut({ 
      headers: request.headers 
    });
    
    // Clear the session cookie manually as well
    ctx.cookies.set("better-auth.session_token", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: "lax",
      path: "/"
    });
    
    // Redirect to login page
    ctx.response.redirect("/admin/login");
  } catch (error) {
    console.error("Logout error:", error);
    // Even if logout fails, clear cookie and redirect
    ctx.cookies.set("better-auth.session_token", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: false,
      sameSite: "lax", 
      path: "/"
    });
    ctx.response.redirect("/admin/login");
  }
}

// API Functions for Shows
export async function listShows(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    interface ShowRow {
      id: number;
      name: string;
      created_at: Date;
      show_date_count: bigint;
      first_date: Date | null;
      last_date: Date | null;
    }
    
    const result = await client.queryObject<ShowRow>(`
      SELECT s.id, s.name, s.created_at,
             COUNT(sd.id) as show_date_count,
             MIN(sd.date) as first_date,
             MAX(sd.date) as last_date
      FROM shows s
      LEFT JOIN show_dates sd ON sd.show_id = s.id
      GROUP BY s.id, s.name, s.created_at
      ORDER BY s.name
    `);
    
    // Convert BigInt count values to numbers for JSON serialization
    const shows = result.rows.map(show => ({
      ...show,
      show_date_count: Number(show.show_date_count)
    }));
    
    ctx.response.body = shows;
  } finally {
    client.release();
  }
}

export async function listShowDates(ctx: RouterContext<string>) {
  const showId = ctx.params.showId;
  const pool = getPool();
  const client = await pool.connect();
  try {
    interface ShowDateRow {
      id: number;
      show_id: number;
      date: string;
      start_time: string;
      end_time: string;
      show_name: string;
      total_shifts: bigint;
      filled_shifts: bigint;
    }
    
    const result = await client.queryObject<ShowDateRow>(`
      SELECT sd.*, s.name as show_name,
             COUNT(DISTINCT sh.id) as total_shifts,
             COUNT(DISTINCT CASE WHEN vs.participant_id IS NOT NULL THEN sh.id END) as filled_shifts
      FROM show_dates sd
      JOIN shows s ON s.id = sd.show_id
      LEFT JOIN shifts sh ON sh.show_date_id = sd.id
      LEFT JOIN participant_shifts vs ON vs.shift_id = sh.id
      WHERE sd.show_id = $1
      GROUP BY sd.id, sd.date, sd.start_time, sd.end_time, s.name
      ORDER BY sd.date, sd.start_time
    `, [showId]);
    
    // Convert BigInt count values to numbers for JSON serialization
    const showDates = result.rows.map(date => ({
      ...date,
      total_shifts: Number(date.total_shifts),
      filled_shifts: Number(date.filled_shifts)
    }));
    
    ctx.response.body = showDates;
  } finally {
    client.release();
  }
}

export async function createShow(ctx: RouterContext<string>) {
  const value = await ctx.request.body.json();
  const { name, dates, existingShowId } = value; // Expecting show name, array of dates, and optional existing show ID
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.queryObject("BEGIN");
    
    let showId: number;
    
    if (existingShowId) {
      // Use existing show
      showId = existingShowId;
    } else {
      // Check if show already exists or create new one
      const existingShow = await client.queryObject(
        "SELECT id FROM shows WHERE name = $1",
        [name]
      );
      
      if (existingShow.rows.length > 0) {
        showId = (existingShow.rows[0] as { id: number }).id;
      } else {
        // Create new show
        const result = await client.queryObject<{ id: number }>(
          "INSERT INTO shows (name) VALUES ($1) RETURNING id",
          [name]
        );
        showId = result.rows[0].id;
      }
    }
    
    const results = [];
    
    for (const dateInfo of dates) {
      const { date, start_time, end_time } = dateInfo;
      
      try {
        // Check if show date already exists
        const existingDate = await client.queryObject(
          "SELECT id FROM show_dates WHERE show_id = $1 AND date = $2",
          [showId, date]
        );
        
        if (existingDate.rows.length > 0) {
          results.push({
            date,
            success: false,
            reason: "Show date already exists"
          });
          continue;
        }
        
        const result = await client.queryObject<{ id: number }>(
          "INSERT INTO show_dates (show_id, date, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING id",
          [showId, date, start_time, end_time]
        );
        
        results.push({
          date,
          id: result.rows[0].id,
          success: true
        });
      } catch (_error) {
        results.push({
          date,
          success: false,
          reason: "Database error"
        });
      }
    }
    
    await client.queryObject("COMMIT");
    
    ctx.response.status = 201;
    ctx.response.body = { showId, results };
  } catch (error) {
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateShow(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const value = await ctx.request.body.json();
  const { name } = value;
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.queryObject(
      "UPDATE shows SET name = $1 WHERE id = $2",
      [name, id]
    );
    ctx.response.status = 200;
  } finally {
    client.release();
  }
}

export async function deleteShow(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.queryObject("DELETE FROM shows WHERE id=$1", [id]);
    ctx.response.status = 204;
  } finally {
    client.release();
  }
}

// API Functions for Show Dates
export async function createShowDate(ctx: RouterContext<string>) {
  const value = await ctx.request.body.json();
  const { show_id, date, start_time, end_time } = value;
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.queryObject<{ id: number }>(
      "INSERT INTO show_dates (show_id, date, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING id",
      [show_id, date, start_time, end_time]
    );
    ctx.response.status = 201;
    ctx.response.body = { id: result.rows[0].id };
  } finally {
    client.release();
  }
}

export async function updateShowDate(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const value = await ctx.request.body.json();
  const { start_time, end_time } = value;
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.queryObject(
      "UPDATE show_dates SET start_time = $1, end_time = $2 WHERE id = $3",
      [start_time, end_time, id]
    );
    ctx.response.status = 200;
  } finally {
    client.release();
  }
}

export async function deleteShowDate(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.queryObject("DELETE FROM show_dates WHERE id=$1", [id]);
    ctx.response.status = 204;
  } finally {
    client.release();
  }
}

// API Functions for Volunteers
export async function listVolunteers(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.queryObject("SELECT id, name, email, phone FROM participants ORDER BY name");
    ctx.response.body = result.rows;
  } finally {
    client.release();
  }
}

export async function createVolunteer(ctx: RouterContext<string>) {
  const value = await ctx.request.body.json();
  const { name, email, phone } = value;
  const pool = getPool();
  const client = await pool.connect();  try {
    const result = await client.queryObject<{ id: number }>(
      "INSERT INTO participants (name, email, phone) VALUES ($1, $2, $3) RETURNING id",
      [name, email, phone]
    );
    const volunteerId = result.rows[0].id;
    ctx.response.status = 201;
    ctx.response.body = { 
      id: volunteerId,
      signupLink: `/volunteer/signup/${volunteerId}`
    };
  } finally {
    client.release();
  }
}

export async function getVolunteer(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const pool = getPool();
  const client = await pool.connect();  try {
    const result = await client.queryObject<{ id: number; name: string; email: string; phone: string }>("SELECT id, name, email, phone FROM participants WHERE id=$1", [id]);
    if (result.rows.length === 0) {
      ctx.throw(404, "Volunteer not found");
    }
    ctx.response.body = result.rows[0];
  } finally {
    client.release();
  }
}

export async function updateVolunteer(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const value = await ctx.request.body.json();
  const { name, email, phone } = value;
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.queryObject(
      "UPDATE participants SET name=$1, email=$2, phone=$3 WHERE id=$4",
      [name, email, phone, id]
    );
    ctx.response.status = 200;
  } finally {
    client.release();
  }
}

export async function deleteVolunteer(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.queryObject("DELETE FROM participants WHERE id=$1", [id]);
    ctx.response.status = 204;
  } finally {
    client.release();
  }
}

// API Functions for Shifts
export async function getShiftCalendarData(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    // Get selected show IDs from query parameters
    const showIds = ctx.request.url.searchParams.get('shows');
    const showIdArray = showIds ? showIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
    
    // Build the WHERE clause for show filtering
    let showFilter = '';
    const queryParams = [];
    if (showIdArray.length > 0) {
      const placeholders = showIdArray.map((_, index) => `$${index + 1}`).join(',');
      showFilter = `AND sh.id IN (${placeholders})`;
      queryParams.push(...showIdArray);
    }
    
    // Get shift status by date - count total shifts and filled shifts per date
    const result = await client.queryObject<{
      date: string;
      total_shifts: number;
      filled_shifts: number;
      show_names: string;
    }>(`
      SELECT 
        sd.date::text as date,
        COALESCE(COUNT(s.id), 0)::int as total_shifts,
        COALESCE(COUNT(CASE WHEN shift_volunteers.volunteer_count > 0 THEN 1 END), 0)::int as filled_shifts,
        COALESCE(STRING_AGG(DISTINCT sh.name, ', '), '') as show_names
      FROM show_dates sd
      JOIN shows sh ON sh.id = sd.show_id
      LEFT JOIN shifts s ON s.show_date_id = sd.id
      LEFT JOIN (
        SELECT shift_id, COUNT(*)::int as volunteer_count
        FROM participant_shifts
        GROUP BY shift_id
      ) shift_volunteers ON shift_volunteers.shift_id = s.id
      WHERE sd.date >= CURRENT_DATE - INTERVAL '30 days'
        AND sd.date <= CURRENT_DATE + INTERVAL '90 days'
        ${showFilter}
      GROUP BY sd.date
      HAVING COUNT(s.id) > 0
      ORDER BY sd.date
    `, queryParams);
    
    ctx.response.body = result.rows;
  } finally {
    client.release();
  }
}

export async function getShowsForCalendar(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    // Get all shows that have shifts (with a broader date range or all shows)
    const result = await client.queryObject<{
      id: number;
      name: string;
      shift_count: number;
    }>(`
      SELECT s.id, s.name, COALESCE(COUNT(sh.id), 0)::int as shift_count
      FROM shows s
      LEFT JOIN show_dates sd ON sd.show_id = s.id
      LEFT JOIN shifts sh ON sh.show_date_id = sd.id
      GROUP BY s.id, s.name
      HAVING COUNT(sh.id) > 0
      ORDER BY s.name
    `);
    
    ctx.response.body = result.rows;
  } finally {
    client.release();
  }
}

export async function listShifts(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    type ShiftRow = {
      id: number;
      show_id: number;
      show_name: string;
      show_date_id: number;
      role: string;
      arrive_time: string;
      depart_time: string;
      date: string;
      show_start: string;
      show_end: string;
    };
    const result = await client.queryObject<ShiftRow>(
      `SELECT s.*, sd.date, sd.start_time as show_start, sd.end_time as show_end, 
              sh.name as show_name, sh.id as show_id
       FROM shifts s
       JOIN show_dates sd ON sd.id = s.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       ORDER BY sh.name, sd.date, sd.start_time, s.arrive_time`
    );
    // Group by show, then by performance (date/start_time)
    const grouped: {
      [showId: string]: {
        show_id: number;
        show_name: string;
        performances: {
          [perfKey: string]: {
            date: string;
            start_time: string;
            end_time: string;
            shifts: ShiftRow[];
          }
        }
      }
    } = {};
    for (const row of result.rows) {
      const showKey = `${row.show_id}`;
      if (!grouped[showKey]) {
        grouped[showKey] = {
          show_id: row.show_id,
          show_name: row.show_name,
          performances: {}
        };
      }
      const perfKey = `${row.date}T${row.show_start}`;
      if (!grouped[showKey].performances[perfKey]) {
        grouped[showKey].performances[perfKey] = {
          date: row.date,
          start_time: row.show_start,
          end_time: row.show_end,
          shifts: []
        };
      }
      grouped[showKey].performances[perfKey].shifts.push(row);
    }
    // Convert to array structure
    const resultArr = Object.values(grouped).map(show => ({
      show_id: show.show_id,
      show_name: show.show_name,
      performances: Object.values(show.performances)
    }));
    ctx.response.body = resultArr;
  } finally {
    client.release();
  }
}

// Define default roles
const DEFAULT_ROLES = [
  "FOH Manager",
  "FOH 2IC", 
  "Usher #1 (Remain FOH)",
  "Usher #2 (Can watch show)",
  "Usher #3 (Can watch show)",
  "Usher #4 (Can watch show)",
  "Usher #5 (Can watch show)",
  "Tea & Coffee #1",
  "Tea & Coffee #2",
  "Raffle",
  "Box Office"
];

export function getDefaultRoles(ctx: RouterContext<string>) {
  ctx.response.body = { roles: DEFAULT_ROLES };
}

export async function createShift(ctx: RouterContext<string>) {
  const value = await ctx.request.body.json();
  const { showDateIds, roles, arriveTime, departTime } = value;
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.queryObject("BEGIN");
    
    const results = [];
    
    for (const dateId of showDateIds) {
      for (const role of roles) {
        try {
          // Parse times and handle day rollover
          const arriveDateTime = new Date(`1970-01-01T${arriveTime}`);
          const departDateTime = new Date(`1970-01-01T${departTime}`);
          
          // Get the show date
          const showDateResult = await client.queryObject<{ date: string }>(
            "SELECT date FROM show_dates WHERE id = $1",
            [dateId]
          );
          
          if (showDateResult.rows.length === 0) {
            results.push({
              dateId,
              role,
              success: false,
              reason: "Show date not found"
            });
            continue;
          }
          
          const showDate = new Date(showDateResult.rows[0].date);
          
          // Create arrive timestamp
          const arriveTimestamp = new Date(showDate);
          arriveTimestamp.setHours(arriveDateTime.getHours(), arriveDateTime.getMinutes());
          
          // Create depart timestamp (handle next day if end time is before start time)
          const departTimestamp = new Date(showDate);
          departTimestamp.setHours(departDateTime.getHours(), departDateTime.getMinutes());
          
          if (departTimestamp <= arriveTimestamp) {
            // Next day
            departTimestamp.setDate(departTimestamp.getDate() + 1);
          }
          
          const result = await client.queryObject<{ id: number }>(
            "INSERT INTO shifts (show_date_id, role, arrive_time, depart_time) VALUES ($1, $2, $3, $4) RETURNING id",
            [dateId, role, arriveTimestamp.toISOString(), departTimestamp.toISOString()]
          );
          
          results.push({
            dateId,
            role,
            id: result.rows[0].id,
            success: true,
            nextDay: departTimestamp.getDate() !== arriveTimestamp.getDate()
          });
        } catch (_error) {
          results.push({
            dateId,
            role,
            success: false,
            reason: "Database error"
          });
        }
      }
    }
    
    await client.queryObject("COMMIT");
    
    ctx.response.status = 201;
    ctx.response.body = { results };
  } catch (error) {
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateShift(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const value = await ctx.request.body.json();
  const { role, arrive_time, depart_time } = value;
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.queryObject(
      "UPDATE shifts SET role=$1, arrive_time=$2, depart_time=$3 WHERE id=$4",
      [role, arrive_time, depart_time, id]
    );
    ctx.response.status = 200;
  } finally {
    client.release();
  }
}

export async function deleteShift(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.queryObject("DELETE FROM shifts WHERE id=$1", [id]);
    ctx.response.status = 204;
  } finally {
    client.release();
  }
}

export async function unfilledShifts(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    type ShiftRow = {
      id: number;
      show_id: number;
      show_name: string;
      show_date_id: number;
      role: string;
      arrive_time: string;
      depart_time: string;
      date: string;
      show_start: string;
      show_end: string;
    };
    const result = await client.queryObject<ShiftRow>(
      `SELECT s.*, sd.date, sd.start_time as show_start, sd.end_time as show_end,
              sh.name as show_name, sh.id as show_id
       FROM shifts s
       JOIN show_dates sd ON sd.id = s.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       LEFT JOIN participant_shifts vs ON vs.shift_id = s.id
       GROUP BY s.id, sd.date, sd.start_time, sd.end_time, sh.name, sh.id
       HAVING COUNT(vs.participant_id) = 0
       ORDER BY sh.name, sd.date, sd.start_time, s.arrive_time`
    );
    // Group by show, then by performance (date/start_time)
    const grouped: {
      [showId: string]: {
        show_id: number;
        show_name: string;
        performances: {
          [perfKey: string]: {
            date: string;
            start_time: string;
            end_time: string;
            shifts: ShiftRow[];
          }
        }
      }
    } = {};
    for (const row of result.rows) {
      const showKey = `${row.show_id}`;
      if (!grouped[showKey]) {
        grouped[showKey] = {
          show_id: row.show_id,
          show_name: row.show_name,
          performances: {}
        };
      }
      const perfKey = `${row.date}T${row.show_start}`;
      if (!grouped[showKey].performances[perfKey]) {
        grouped[showKey].performances[perfKey] = {
          date: row.date,
          start_time: row.show_start,
          end_time: row.show_end,
          shifts: []
        };
      }
      grouped[showKey].performances[perfKey].shifts.push(row);
    }
    // Convert to array structure
    const resultArr = Object.values(grouped).map(show => ({
      show_id: show.show_id,
      show_name: show.show_name,
      performances: Object.values(show.performances)
    }));
    ctx.response.body = resultArr;
  } finally {
    client.release();
  }
}

// API Functions for Volunteer-Shift Assignments
export async function getShiftVolunteers(ctx: RouterContext<string>) {
  const shiftId = ctx.params.shiftId;
  const pool = getPool();
  const client = await pool.connect();
  try {    const result = await client.queryObject(
      `SELECT v.id, v.name, v.email, v.phone
       FROM participants v
       JOIN participant_shifts vs ON vs.participant_id = v.id
       WHERE vs.shift_id = $1
       ORDER BY v.name`,
      [shiftId]
    );
    ctx.response.body = result.rows;
  } finally {
    client.release();
  }
}

export async function getVolunteerShifts(ctx: RouterContext<string>) {
  const volunteerId = ctx.params.volunteerId;
  const pool = getPool();
  const client = await pool.connect();
  try {
    type ShiftRow = {
      id: number;
      show_id: number;
      show_name: string;
      show_date_id: number;
      role: string;
      arrive_time: string;
      depart_time: string;
      date: string;
      show_start: string;
      show_end: string;
    };
    const result = await client.queryObject<ShiftRow>(
      `SELECT s.id, s.role, s.arrive_time, s.depart_time, s.show_date_id,
              sd.date, sd.start_time as show_start, sd.end_time as show_end,
              sh.name as show_name, sh.id as show_id
       FROM shifts s
       JOIN participant_shifts vs ON vs.shift_id = s.id
       JOIN show_dates sd ON sd.id = s.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       WHERE vs.participant_id = $1
       ORDER BY sh.name, sd.date, sd.start_time, s.arrive_time`,
      [volunteerId]
    );
    // Group by show, then by performance (date/start_time)
    const grouped: {
      [showId: string]: {
        show_id: number;
        show_name: string;
        performances: {
          [perfKey: string]: {
            date: string;
            start_time: string;
            end_time: string;
            shifts: ShiftRow[];
          }
        }
      }
    } = {};
    for (const row of result.rows) {
      const showKey = `${row.show_id}`;
      if (!grouped[showKey]) {
        grouped[showKey] = {
          show_id: row.show_id,
          show_name: row.show_name,
          performances: {}
        };
      }
      const perfKey = `${row.date}T${row.show_start}`;
      if (!grouped[showKey].performances[perfKey]) {
        grouped[showKey].performances[perfKey] = {
          date: row.date,
          start_time: row.show_start,
          end_time: row.show_end,
          shifts: []
        };
      }
      grouped[showKey].performances[perfKey].shifts.push(row);
    }
    // Convert to array structure
    const resultArr = Object.values(grouped).map(show => ({
      show_id: show.show_id,
      show_name: show.show_name,
      performances: Object.values(show.performances)
    }));
    ctx.response.body = resultArr;
  } finally {
    client.release();
  }
}

export async function assignVolunteerToShift(ctx: RouterContext<string>) {
  const value = await ctx.request.body.json();
  const { volunteerId, shiftId } = value;
  const pool = getPool();
  const client = await pool.connect();
  try {
    // Check if assignment already exists
    const existing = await client.queryObject(
      "SELECT 1 FROM participant_shifts WHERE participant_id = $1 AND shift_id = $2",
      [volunteerId, shiftId]
    );
    
    if (existing.rows.length > 0) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Volunteer is already assigned to this shift" };
      return;
    }

    await client.queryObject(
      "INSERT INTO participant_shifts (participant_id, shift_id) VALUES ($1, $2)",
      [volunteerId, shiftId]
    );
    ctx.response.body = { success: true };
  } finally {
    client.release();
  }
}

export async function removeVolunteerFromShift(ctx: RouterContext<string>) {
  const volunteerId = ctx.params.volunteerId;
  const shiftId = ctx.params.shiftId;
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.queryObject(
      "DELETE FROM participant_shifts WHERE participant_id = $1 AND shift_id = $2",
      [volunteerId, shiftId]
    );
    ctx.response.body = { success: true };
  } finally {
    client.release();
  }
}

export async function getAvailableVolunteersForShift(ctx: RouterContext<string>) {
  const shiftId = ctx.params.shiftId;
  const pool = getPool();
  const client = await pool.connect();
  try {    // Get volunteers not already assigned to this shift
    const result = await client.queryObject(
      `SELECT v.id, v.name, v.email, v.phone
       FROM participants v
       WHERE v.id NOT IN (
         SELECT vs.participant_id 
         FROM participant_shifts vs 
         WHERE vs.shift_id = $1
       )
       ORDER BY v.name`,
      [shiftId]
    );
    ctx.response.body = result.rows;
  } finally {
    client.release();
  }
}

export async function getAvailableShiftsForVolunteer(ctx: RouterContext<string>) {
  const volunteerId = ctx.params.volunteerId;
  const pool = getPool();
  const client = await pool.connect();
  try {
    type ShiftRow = {
      id: number;
      show_id: number;
      show_name: string;
      show_date_id: number;
      role: string;
      arrive_time: string;
      depart_time: string;
      date: string;
      show_start: string;
      show_end: string;
    };
    // Get shifts not already assigned to this volunteer
    const result = await client.queryObject<ShiftRow>(
      `SELECT s.id, s.role, s.arrive_time, s.depart_time, s.show_date_id,
              sd.date, sd.start_time as show_start, sd.end_time as show_end,
              sh.name as show_name, sh.id as show_id
       FROM shifts s
       JOIN show_dates sd ON sd.id = s.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       WHERE s.id NOT IN (
         SELECT vs.shift_id 
         FROM participant_shifts vs 
         WHERE vs.participant_id = $1
       )
       ORDER BY sh.name, sd.date, sd.start_time, s.arrive_time`,
      [volunteerId]
    );
    // Group by show, then by performance (date/start_time)
    const grouped: {
      [showId: string]: {
        show_id: number;
        show_name: string;
        performances: {
          [perfKey: string]: {
            date: string;
            start_time: string;
            end_time: string;
            shifts: ShiftRow[];
          }
        }
      }
    } = {};
    for (const row of result.rows) {
      const showKey = `${row.show_id}`;
      if (!grouped[showKey]) {
        grouped[showKey] = {
          show_id: row.show_id,
          show_name: row.show_name,
          performances: {}
        };
      }
      const perfKey = `${row.date}T${row.show_start}`;
      if (!grouped[showKey].performances[perfKey]) {
        grouped[showKey].performances[perfKey] = {
          date: row.date,
          start_time: row.show_start,
          end_time: row.show_end,
          shifts: []
        };
      }
      grouped[showKey].performances[perfKey].shifts.push(row);
    }
    // Convert to array structure
    const resultArr = Object.values(grouped).map(show => ({
      show_id: show.show_id,
      show_name: show.show_name,
      performances: Object.values(show.performances)
    }));
    ctx.response.body = resultArr;
  } finally {
    client.release();
  }
}

export async function getUnfilledShiftsCount(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.queryObject<{ count: string }>(
      `SELECT COUNT(DISTINCT s.id) as count
       FROM shifts s
       LEFT JOIN participant_shifts vs ON vs.shift_id = s.id
       WHERE vs.participant_id IS NULL`
    );
    
    const count = parseInt(result.rows[0]?.count || '0');
    ctx.response.body = { count };
  } finally {
    client.release();
  }
}

export async function getPerformancesWithoutShiftsCount(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.queryObject<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM show_dates sd
       LEFT JOIN shifts s ON s.show_date_id = sd.id
       WHERE s.id IS NULL`
    );
    
    const count = parseInt(result.rows[0]?.count || '0');
    ctx.response.body = { count };
  } finally {
    client.release();
  }
}
