import type { RouterContext } from "oak";
import { getPool } from "../models/db.ts";
import {
  getAdelaideTimeParameterSQL
} from "../utils/timezone.ts";
import { getAuth } from "../auth.ts";
import { generateShiftRemovalPDF as generatePDF, getMimeType, getFileExtension, type ShiftData, type VolunteerData } from "../utils/pdf-generator.ts";


// Import view functions from separated files
export {
  showLoginForm,
  showDashboard,
  showShowsPage,
  showNewShowForm,
  showEditShowForm,
  showVolunteersPage,
  showVolunteerShiftsPage,
  showNewVolunteerForm,
  showEditVolunteerForm,
  showShiftsPage,
  showNewShiftForm,
  showEditShiftForm,
  showUnfilledShiftsPage,
  showBulkEmailPage,
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

// Generate and download running sheet PDF for a show/date
export async function downloadRunSheetPDF(ctx: RouterContext<string>) {
  const showId = ctx.params.showId;
  const date = ctx.params.date;
  const pool = getPool();
  const client = await pool.connect();
  try {
    // Get show and performance info
    const showRes = await client.queryObject<{ name: string }>("SELECT name FROM shows WHERE id = $1", [showId]);
    if (showRes.rows.length === 0) {
      ctx.throw(404, "Show not found");
    }
    const showName = showRes.rows[0].name;

    // Get show date info (with Adelaide timezone conversion)
    const perfRes = await client.queryObject<{ 
      id: number; 
      start_time: string; 
      end_time: string;
      performance_start: string;
      performance_end: string;
    }>(
      `SELECT id, start_time, end_time,
              TO_CHAR(start_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as performance_start,
              TO_CHAR(end_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as performance_end
       FROM show_dates 
       WHERE show_id = $1 AND TO_CHAR(start_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD') = $2`,
      [showId, date]
    );
    if (perfRes.rows.length === 0) {
      ctx.throw(404, "Performance date not found");
    }
    const perf = perfRes.rows[0];
    const performanceTime = `${perf.performance_start} - ${perf.performance_end}`;

    // Get all shifts for this performance (with Adelaide timezone conversion)
    const shiftsRes = await client.queryObject<{
      id: number;
      role: string;
      arrive_time: string;
      depart_time: string;
    }>(
      `SELECT id, role, 
              TO_CHAR(arrive_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as arrive_time,
              TO_CHAR(depart_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as depart_time
       FROM shifts 
       WHERE show_date_id = $1 
       ORDER BY arrive_time, role`,
      [perf.id]
    );

    // Get all participants assigned to shifts for this performance (with Adelaide timezone conversion)
    const participantsRes = await client.queryObject<{
      name: string;
      role: string;
      arrive_time: string;
      depart_time: string;
    }>(
      `SELECT p.name, s.role, 
              TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as arrive_time,
              TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as depart_time
       FROM participant_shifts vs
       JOIN participants p ON p.id = vs.participant_id
       JOIN shifts s ON s.id = vs.shift_id
       WHERE s.show_date_id = $1
       ORDER BY p.name, s.arrive_time, s.role`,
      [perf.id]
    );

    // Find unfilled shifts for current performance (not used anymore, but kept for potential future use)
    const _unfilledShifts = shiftsRes.rows.filter(shift => {
      // If no participant assigned to this role/arrive/depart combination
      return !participantsRes.rows.some(p => 
        p.role === shift.role && 
        p.arrive_time === shift.arrive_time && 
        p.depart_time === shift.depart_time
      );
    });

    // Format participants (times are already in Adelaide timezone from SQL)
    const participants = participantsRes.rows.map(p => ({
      name: p.name,
      role: p.role,
      arriveTime: p.arrive_time,
      departTime: p.depart_time
    }));

    // Get unfilled shifts for the next 3 weeks for this show (including current performance)
    const unfilledShiftsRes = await client.queryObject<{
      date: string;
      role: string;
      arrive_time: string;
      depart_time: string;
    }>(
      `SELECT TO_CHAR(sd.start_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD') as date,
              s.role,
              TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as arrive_time,
              TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as depart_time
       FROM shifts s
       JOIN show_dates sd ON sd.id = s.show_date_id
       LEFT JOIN participant_shifts ps ON ps.shift_id = s.id
       WHERE sd.show_id = $1 
         AND sd.start_time AT TIME ZONE 'Australia/Adelaide' >= $2::date
         AND sd.start_time AT TIME ZONE 'Australia/Adelaide' <= $2::date + INTERVAL '3 weeks'
       GROUP BY sd.start_time, s.role, s.arrive_time, s.depart_time
       HAVING COUNT(ps.participant_id) = 0
       ORDER BY sd.start_time, s.arrive_time`,
      [showId, date]
    );

    // Format unfilled shifts (times are already in Adelaide timezone from SQL)
    const unfilled = unfilledShiftsRes.rows.map(s => ({
      date: s.date,
      role: s.role,
      arriveTime: s.arrive_time,
      departTime: s.depart_time
    }));

    // Get intervals for this show
    const intervalsRes = await client.queryObject<{
      start_minutes: number;
      duration_minutes: number;
    }>(
      `SELECT start_minutes, duration_minutes FROM show_intervals WHERE show_id = $1 ORDER BY start_minutes`,
      [showId]
    );

    const intervals = intervalsRes.rows;

    // Generate PDF using the updated PDF generator
    const { generateRunSheetPDF } = await import("../utils/run-sheet-pdf-generator.ts");
    const pdfBuffer = generateRunSheetPDF({
      showName,
      date,
      performanceTime,
      participants,
      unfilledShifts: unfilled,
      intervals
    });

    const filename = `run-sheet-${showId}-${date}.pdf`;

    ctx.response.status = 200;
    ctx.response.headers.set("Content-Type", "application/pdf");
    ctx.response.headers.set("Content-Disposition", `inline; filename="${filename}"`);
    ctx.response.body = pdfBuffer;
  } finally {
    client.release();
  }
}

// Generate and download running sheet PDF for a specific show date (performance)
export async function downloadRunSheetPDFByShowDate(ctx: RouterContext<string>) {
  const showDateId = ctx.params.showDateId;
  const pool = getPool();
  const client = await pool.connect();
  try {
    // Get show date and show info in one query
    const showDateRes = await client.queryObject<{ 
      show_id: number;
      show_name: string;
      date: string;
      performance_start: string;
      performance_end: string;
    }>(
      `SELECT sd.show_id, s.name as show_name,
              TO_CHAR(sd.start_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD') as date,
              TO_CHAR(sd.start_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as performance_start,
              TO_CHAR(sd.end_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as performance_end
       FROM show_dates sd
       JOIN shows s ON s.id = sd.show_id
       WHERE sd.id = $1`,
      [showDateId]
    );
    
    if (showDateRes.rows.length === 0) {
      ctx.throw(404, "Performance not found");
    }
    
    const showDate = showDateRes.rows[0];
    const performanceTime = `${showDate.performance_start} - ${showDate.performance_end}`;

    // Get all shifts for this specific performance (for reference, but not directly used)
    const _shiftsRes = await client.queryObject<{
      id: number;
      role: string;
      arrive_time: string;
      depart_time: string;
    }>(
      `SELECT id, role, 
              TO_CHAR(arrive_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as arrive_time,
              TO_CHAR(depart_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as depart_time
       FROM shifts 
       WHERE show_date_id = $1 
       ORDER BY arrive_time, role`,
      [showDateId]
    );

    // Get all participants assigned to shifts for this specific performance
    const participantsRes = await client.queryObject<{
      name: string;
      role: string;
      arrive_time: string;
      depart_time: string;
    }>(
      `SELECT p.name, s.role, 
              TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as arrive_time,
              TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as depart_time
       FROM participant_shifts vs
       JOIN participants p ON p.id = vs.participant_id
       JOIN shifts s ON s.id = vs.shift_id
       WHERE s.show_date_id = $1
       ORDER BY p.name, s.arrive_time, s.role`,
      [showDateId]
    );

    // Format participants (times are already in Adelaide timezone from SQL)
    const participants = participantsRes.rows.map(p => ({
      name: p.name,
      role: p.role,
      arriveTime: p.arrive_time,
      departTime: p.depart_time
    }));

    // Get unfilled shifts for the next 3 weeks from this performance date onwards
    const unfilledShiftsRes = await client.queryObject<{
      date: string;
      role: string;
      arrive_time: string;
      depart_time: string;
    }>(
      `SELECT TO_CHAR(sd.start_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD') as date,
              s.role,
              TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as arrive_time,
              TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as depart_time
       FROM shifts s
       JOIN show_dates sd ON sd.id = s.show_date_id
       LEFT JOIN participant_shifts ps ON ps.shift_id = s.id
       WHERE sd.show_id = $1 
         AND sd.start_time AT TIME ZONE 'Australia/Adelaide' >= $2::date
         AND sd.start_time AT TIME ZONE 'Australia/Adelaide' <= $2::date + INTERVAL '3 weeks'
       GROUP BY sd.start_time, s.role, s.arrive_time, s.depart_time
       HAVING COUNT(ps.participant_id) = 0
       ORDER BY sd.start_time, s.arrive_time`,
      [showDate.show_id, showDate.date]
    );

    // Format unfilled shifts (times are already in Adelaide timezone from SQL)
    const unfilled = unfilledShiftsRes.rows.map(s => ({
      date: s.date,
      role: s.role,
      arriveTime: s.arrive_time,
      departTime: s.depart_time
    }));

    // Get intervals for this show
    const intervalsRes = await client.queryObject<{
      start_minutes: number;
      duration_minutes: number;
    }>(
      `SELECT start_minutes, duration_minutes FROM show_intervals WHERE show_id = $1 ORDER BY start_minutes`,
      [showDate.show_id]
    );

    const intervals = intervalsRes.rows;

    // Generate PDF using the updated PDF generator
    const { generateRunSheetPDF } = await import("../utils/run-sheet-pdf-generator.ts");
    const pdfBuffer = generateRunSheetPDF({
      showName: showDate.show_name,
      date: showDate.date,
      performanceTime,
      participants,
      unfilledShifts: unfilled,
      intervals
    });

    const filename = `run-sheet-${showDate.show_id}-${showDateId}-${showDate.date}.pdf`;

    ctx.response.status = 200;
    ctx.response.headers.set("Content-Type", "application/pdf");
    ctx.response.headers.set("Content-Disposition", `inline; filename="${filename}"`);
    ctx.response.body = pdfBuffer;
  } finally {
    client.release();
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
      SELECT s.id, s.name, s.created_at AT TIME ZONE 'Australia/Adelaide' as created_at,
             COUNT(sd.id) as show_date_count,
             MIN(sd.start_time AT TIME ZONE 'Australia/Adelaide') as first_date,
             MAX(sd.start_time AT TIME ZONE 'Australia/Adelaide') as last_date
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
      start_time: string;
      end_time: string;
      show_name: string;
      total_shifts: bigint;
      filled_shifts: bigint;
    }

    const result = await client.queryObject<ShowDateRow>(`
      SELECT sd.id, sd.show_id, 
             TO_CHAR(sd.start_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as start_time, 
             TO_CHAR(sd.end_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as end_time, 
             s.name as show_name,
             COUNT(DISTINCT sh.id) as total_shifts,
             COUNT(DISTINCT CASE WHEN vs.participant_id IS NOT NULL THEN sh.id END) as filled_shifts
      FROM show_dates sd
      JOIN shows s ON s.id = sd.show_id
      LEFT JOIN shifts sh ON sh.show_date_id = sd.id
      LEFT JOIN participant_shifts vs ON vs.shift_id = sh.id
      WHERE sd.show_id = $1
      GROUP BY sd.id, s.name, sd.start_time, sd.end_time
      ORDER BY sd.start_time
    `, [showId]);

    // Convert BigInt count values to numbers for JSON serialization and add formatted date field
    const showDates = result.rows.map(date => ({
      ...date,
      total_shifts: Number(date.total_shifts),
      filled_shifts: Number(date.filled_shifts),
      date: date.start_time // Add the date field that the frontend expects
    }));  

    ctx.response.body = showDates;
  } finally {
    client.release();
  }
}

export async function createShow(ctx: RouterContext<string>) {
  const value = await ctx.request.body.json();
  const { name, performances, existingShowId } = value; // Expecting show name, array of performances, and optional existing show ID

  console.log("🎭 CREATE SHOW DEBUG - Request received:");
  console.log("  Name:", name);
  console.log("  Existing Show ID:", existingShowId);
  console.log("  Performances count:", performances?.length);
  console.log("  Performances:", JSON.stringify(performances, null, 2));

  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log("🔗 Database connection established");
    await client.queryObject("BEGIN");
    console.log("📝 Transaction begun");

    let showId: number;

    if (existingShowId) {
      // Use existing show
      console.log("🔄 Using existing show ID:", existingShowId);
      showId = existingShowId;
    } else {
      // Check if show already exists or create new one
      console.log("🔍 Checking if show exists:", name);
      const existingShow = await client.queryObject(
        "SELECT id FROM shows WHERE name = $1",
        [name]
      );

      if (existingShow.rows.length > 0) {
        showId = (existingShow.rows[0] as { id: number }).id;
        console.log("✅ Found existing show with ID:", showId);
      } else {
        // Create new show
        console.log("➕ Creating new show:", name);
        const result = await client.queryObject<{ id: number }>(
          "INSERT INTO shows (name) VALUES ($1) RETURNING id",
          [name]
        );
        showId = result.rows[0].id;
        console.log("✅ Created new show with ID:", showId);
      }
    }

    const results = [];

    console.log("🎯 Processing", performances.length, "performances for show ID:", showId);

    for (const performance of performances) {
      const { start_time, end_time } = performance;

      console.log("📅 Processing performance:");
      console.log("  Start time (raw):", start_time);
      console.log("  End time (raw):", end_time);

      try {
        // Check if show date already exists (check for same start time)
        console.log("🔍 Checking for existing performance...");
        const existingDate = await client.queryObject(
          "SELECT id FROM show_dates WHERE show_id = $1 AND start_time = ($2::timestamp AT TIME ZONE 'Australia/Adelaide')",
          [showId, start_time]
        );

        if (existingDate.rows.length > 0) {
          console.log("⚠️ Performance already exists");
          results.push({
            start_time,
            success: false,
            reason: "Performance already exists"
          });
          continue;
        }

        console.log("💾 Inserting new show date...");
        const result = await client.queryObject<{ id: number }>(
          "INSERT INTO show_dates (show_id, start_time, end_time) VALUES ($1, $2::timestamp AT TIME ZONE 'Australia/Adelaide', $3::timestamp AT TIME ZONE 'Australia/Adelaide') RETURNING id",
          [showId, start_time, end_time]
        );

        console.log("✅ Successfully created show date with ID:", result.rows[0].id);
        results.push({
          start_time,
          id: result.rows[0].id,
          success: true
        });
      } catch (error) {
        console.error("❌ Error processing performance:", error);
        console.error("  Error details:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : 'Unknown'
        });
        results.push({
          start_time,
          success: false,
          reason: "Database error"
        });
      }
    }

    console.log("✅ Committing transaction...");
    await client.queryObject("COMMIT");

    console.log("🎉 CREATE SHOW COMPLETE - Results:");
    console.log("  Show ID:", showId);
    console.log("  Results:", JSON.stringify(results, null, 2));

    ctx.response.status = 201;
    ctx.response.body = { showId, results };
  } catch (error) {
    console.error("💥 TRANSACTION ERROR:", error);
    await client.queryObject("ROLLBACK");
    console.log("⏪ Transaction rolled back");
    throw error;
  } finally {
    console.log("🔚 Releasing database connection");
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
  const { show_id, start_time, end_time } = value;
  const pool = getPool();
  const client = await pool.connect();
  try {
    // Parse the incoming datetime strings
    const startDate = start_time.split('T')[0];
    const startTimeOnly = start_time.split('T')[1];
    const endDate = end_time.split('T')[0];
    const endTimeOnly = end_time.split('T')[1];

    // Use SQL AT TIME ZONE to ensure dates are treated as Adelaide time
    const result = await client.queryObject<{ id: number }>(
      `INSERT INTO show_dates (show_id, start_time, end_time) 
       VALUES ($1, ${getAdelaideTimeParameterSQL('$2')}, ${getAdelaideTimeParameterSQL('$3')}) 
       RETURNING id`,
      [show_id, `${startDate} ${startTimeOnly}`, `${endDate} ${endTimeOnly}`]
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
    // Parse the incoming datetime strings
    const startDate = start_time.split('T')[0];
    const startTimeOnly = start_time.split('T')[1];
    const endDate = end_time.split('T')[0];
    const endTimeOnly = end_time.split('T')[1];

    // Use SQL AT TIME ZONE to ensure dates are treated as Adelaide time
    await client.queryObject(
      `UPDATE show_dates 
       SET start_time = ${getAdelaideTimeParameterSQL('$1')}, 
           end_time = ${getAdelaideTimeParameterSQL('$2')} 
       WHERE id = $3`,
      [`${startDate} ${startTimeOnly}`, `${endDate} ${endTimeOnly}`, id]
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

// API Functions for Show Intervals
export async function listShowIntervals(ctx: RouterContext<string>) {
  const showId = ctx.params.showId;
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.queryObject(
      "SELECT id, start_minutes, duration_minutes FROM show_intervals WHERE show_id = $1 ORDER BY start_minutes",
      [showId]
    );
    ctx.response.body = result.rows;
  } finally {
    client.release();
  }
}

export async function createShowInterval(ctx: RouterContext<string>) {
  const showId = ctx.params.showId;
  const value = await ctx.request.body.json();
  const { start_minutes, duration_minutes } = value;
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.queryObject<{ id: number }>(
      "INSERT INTO show_intervals (show_id, start_minutes, duration_minutes) VALUES ($1, $2, $3) RETURNING id",
      [showId, start_minutes, duration_minutes]
    );
    ctx.response.status = 201;
    ctx.response.body = { id: result.rows[0].id };
  } finally {
    client.release();
  }
}

export async function updateShowInterval(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const value = await ctx.request.body.json();
  const { start_minutes, duration_minutes } = value;
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.queryObject(
      "UPDATE show_intervals SET start_minutes = $1, duration_minutes = $2 WHERE id = $3",
      [start_minutes, duration_minutes, id]
    );
    ctx.response.status = 200;
  } finally {
    client.release();
  }
}

export async function deleteShowInterval(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.queryObject("DELETE FROM show_intervals WHERE id = $1", [id]);
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
  const client = await pool.connect(); try {
    const result = await client.queryObject<{ id: string }>(
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
  const client = await pool.connect(); try {
    const result = await client.queryObject<{ id: string; name: string; email: string; phone: string }>("SELECT id, name, email, phone FROM participants WHERE id=$1", [id]);
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
        DATE(sd.start_time)::text as date,
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
      WHERE DATE(sd.start_time) >= CURRENT_DATE - INTERVAL '30 days'
        AND DATE(sd.start_time) <= CURRENT_DATE + INTERVAL '90 days'
        ${showFilter}
      GROUP BY DATE(sd.start_time)
      HAVING COUNT(s.id) > 0
      ORDER BY DATE(sd.start_time)
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
      `SELECT s.*, DATE(sd.start_time) as date, sd.start_time as show_start, sd.end_time as show_end, 
              sh.name as show_name, sh.id as show_id
       FROM shifts s
       JOIN show_dates sd ON sd.id = s.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       ORDER BY sh.name, DATE(sd.start_time), sd.start_time, s.arrive_time`
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
  "Usher 1 (Can see show)",
  "Usher 2 (Can see show)",
  "Usher 3 (Can see show)",
  "Tea and Coffee 1 (Can see show)",
  "Tea and Coffee 2 (Can see show)",
  "Raffle Ticket Selling",
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
          // Get the show date (extract date from start_time)
          const showDateResult = await client.queryObject<{ date: string }>(
            "SELECT DATE(start_time)::text as date FROM show_dates WHERE id = $1",
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

          const showDate = showDateResult.rows[0].date;

          console.log("🔍 Creating shift debug:");
          console.log("  Date ID:", dateId);
          console.log("  Role:", role);
          console.log("  Show Date:", showDate);
          console.log("  Arrive Time:", arriveTime);
          console.log("  Depart Time:", departTime);

          // Create arrive and depart timestamps 
          const arriveTimestamp = `${showDate}T${arriveTime}:00`;
          let departTimestamp = `${showDate}T${departTime}:00`;

          console.log("  Arrive Timestamp:", arriveTimestamp);
          console.log("  Initial Depart Timestamp:", departTimestamp);

          // Handle next day if depart time is before arrive time
          const arriveTime24 = parseInt(arriveTime.split(':')[0]) * 60 + parseInt(arriveTime.split(':')[1]);
          const departTime24 = parseInt(departTime.split(':')[0]) * 60 + parseInt(departTime.split(':')[1]);
          
          let isNextDay = false;
          if (departTime24 <= arriveTime24) {
            // Add one day to depart timestamp for next day
            const nextDay = new Date(showDate + 'T00:00:00');
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().split('T')[0];
            departTimestamp = `${nextDayStr}T${departTime}:00`;
            isNextDay = true;
            console.log("  Adjusted Depart Timestamp (next day):", departTimestamp);
          }

          const result = await client.queryObject<{ id: number }>(
            "INSERT INTO shifts (show_date_id, role, arrive_time, depart_time) VALUES ($1, $2, $3::timestamp AT TIME ZONE 'Australia/Adelaide', $4::timestamp AT TIME ZONE 'Australia/Adelaide') RETURNING id",
            [dateId, role, arriveTimestamp, departTimestamp]
          );

          results.push({
            dateId,
            role,
            id: result.rows[0].id,
            success: true,
            nextDay: isNextDay
          });
        } catch (error) {
          console.error("❌ Error creating shift:", error);
          console.error("  Error details:", {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            dateId,
            role,
            arriveTime,
            departTime
          });
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
    // The inputs are in format YYYY-MM-DDTHH:MM and represent Adelaide time

    await client.queryObject(
      "UPDATE shifts SET role=$1, arrive_time=$2::timestamp AT TIME ZONE 'Australia/Adelaide', depart_time=$3::timestamp AT TIME ZONE 'Australia/Adelaide' WHERE id=$4",
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
      `SELECT s.id, s.show_date_id, s.role, 
              s.arrive_time AT TIME ZONE 'Australia/Adelaide' as arrive_time,
              s.depart_time AT TIME ZONE 'Australia/Adelaide' as depart_time,
              DATE(sd.start_time) as date, sd.start_time as show_start, sd.end_time as show_end,
              sh.name as show_name, sh.id as show_id
       FROM shifts s
       JOIN show_dates sd ON sd.id = s.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       LEFT JOIN participant_shifts vs ON vs.shift_id = s.id
       GROUP BY s.id, s.show_date_id, s.role, s.arrive_time, s.depart_time, 
                DATE(sd.start_time), sd.start_time, sd.end_time, sh.name, sh.id
       HAVING COUNT(vs.participant_id) = 0
       ORDER BY sh.name, DATE(sd.start_time), sd.start_time, s.arrive_time`
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
  try {
    const result = await client.queryObject(
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
      `SELECT s.id, s.role, s.arrive_time AT TIME ZONE 'Australia/Adelaide' as arrive_time, 
              s.depart_time AT TIME ZONE 'Australia/Adelaide' as depart_time, s.show_date_id,
              DATE(sd.start_time AT TIME ZONE 'Australia/Adelaide') as date, 
              sd.start_time AT TIME ZONE 'Australia/Adelaide' as show_start, 
              sd.end_time AT TIME ZONE 'Australia/Adelaide' as show_end,
              sh.name as show_name, sh.id as show_id
       FROM shifts s
       JOIN participant_shifts vs ON vs.shift_id = s.id
       JOIN show_dates sd ON sd.id = s.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       WHERE vs.participant_id = $1
       ORDER BY sh.name, DATE(sd.start_time AT TIME ZONE 'Australia/Adelaide'), sd.start_time, s.arrive_time`,
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

export async function getVolunteerShiftsSimple(ctx: RouterContext<string>) {
  const volunteerId = ctx.params.volunteerId;
  const pool = getPool();
  const client = await pool.connect();
  try {
    type SimpleShiftRow = {
      id: number;
      show_name: string;
      role: string;
      date: string;
      arrive_time: string;
      depart_time: string;
      show_date: string;
    };

    // Only get future shifts (where depart_time is in the future)
    const result = await client.queryObject<SimpleShiftRow>(
      `SELECT s.id, sh.name as show_name, s.role, 
              DATE(sd.start_time)::text as show_date,
              TO_CHAR(s.arrive_time, 'HH24:MI') as arrive_time,
              TO_CHAR(s.depart_time, 'HH24:MI') as depart_time,
              DATE(sd.start_time)::text as date
       FROM shifts s
       JOIN participant_shifts vs ON vs.shift_id = s.id
       JOIN show_dates sd ON sd.id = s.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       WHERE vs.participant_id = $1 
         AND s.depart_time > NOW()
       ORDER BY DATE(sd.start_time), s.arrive_time`,
      [volunteerId]
    );

    // Format the data for easy display in modal
    const shifts = result.rows.map(row => {
      const arriveTime = row.arrive_time;
      const departTime = row.depart_time;

      // Check if depart time is next day (arrive time > depart time)
      const isNextDay = arriveTime > departTime;
      const timeDisplay = isNextDay ?
        `${arriveTime} - ${departTime} (+1 day)` :
        `${arriveTime} - ${departTime}`;

      return {
        id: row.id,
        show_name: row.show_name,
        role: row.role,
        date: row.date,
        time: timeDisplay
      };
    });

    ctx.response.body = shifts;
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
      `SELECT s.id, s.role, s.arrive_time AT TIME ZONE 'Australia/Adelaide' as arrive_time, 
              s.depart_time AT TIME ZONE 'Australia/Adelaide' as depart_time, s.show_date_id,
              DATE(sd.start_time AT TIME ZONE 'Australia/Adelaide') as date, 
              sd.start_time AT TIME ZONE 'Australia/Adelaide' as show_start, 
              sd.end_time AT TIME ZONE 'Australia/Adelaide' as show_end,
              sh.name as show_name, sh.id as show_id
       FROM shifts s
       JOIN show_dates sd ON sd.id = s.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       WHERE s.id NOT IN (
         SELECT vs.shift_id 
         FROM participant_shifts vs 
         WHERE vs.participant_id = $1
       )
       ORDER BY sh.name, DATE(sd.start_time AT TIME ZONE 'Australia/Adelaide'), sd.start_time, s.arrive_time`,
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

export async function getServerTime(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    // Get current time in Adelaide timezone from the database
    const result = await client.queryObject<{ 
      current_time: string, 
      current_date: string 
    }>(
      `SELECT 
        TO_CHAR(NOW() AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as current_time,
        TO_CHAR(NOW() AT TIME ZONE 'Australia/Adelaide', 'DD/MM/YYYY') as current_date`
    );
    
    ctx.response.body = result.rows[0];
  } finally {
    client.release();
  }
}

// API Functions for Volunteer Approval
export async function toggleVolunteerApproval(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const { approved, removeShifts = true } = await ctx.request.body.json();
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.queryObject("BEGIN");

    // Update approval status
    await client.queryObject(
      "UPDATE participants SET approved = $1 WHERE id = $2",
      [approved, id]
    );

    // If disabling and removeShifts is true, remove from all shifts
    if (!approved && removeShifts) {
      await client.queryObject(
        "DELETE FROM participant_shifts WHERE participant_id = $1",
        [id]
      );
    }

    await client.queryObject("COMMIT");
    ctx.response.body = { success: true };
  } catch (error) {
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function generateShiftRemovalPDF(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const { shifts } = await ctx.request.body.json();

  // Get volunteer details
  const pool = getPool();
  const client = await pool.connect();

  try {
    const volunteerResult = await client.queryObject(
      "SELECT name, email FROM participants WHERE id = $1",
      [id]
    );

    if (volunteerResult.rows.length === 0) {
      ctx.throw(404, "Volunteer not found");
    }

    const volunteer = volunteerResult.rows[0] as VolunteerData;
    const shiftData: ShiftData[] = shifts;

    // Generate PDF content using the utility
    const pdfBuffer = generatePDF(volunteer, shiftData);

    // Set response headers for download
    const filename = `shift-removal-${volunteer.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.${getFileExtension()}`;

    ctx.response.headers.set("Content-Type", getMimeType());
    ctx.response.headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    ctx.response.body = pdfBuffer;
  } finally {
    client.release();
  }
}

export async function getAvailableRolesForShift(ctx: RouterContext<string>) {
  const shiftId = ctx.params.shiftId;
  const pool = getPool();
  const client = await pool.connect();

  try {
    // Get the show_date_id for this shift
    const shiftResult = await client.queryObject(
      "SELECT show_date_id FROM shifts WHERE id = $1",
      [shiftId]
    );

    if (shiftResult.rows.length === 0) {
      ctx.throw(404, "Shift not found");
    }

    const showDateId = (shiftResult.rows[0] as { show_date_id: number }).show_date_id;

    // Get all available roles for the same performance (show_date_id) that are not assigned
    const availableRolesResult = await client.queryObject(`
      SELECT 
        s.id,
        s.role
      FROM shifts s
      LEFT JOIN participant_shifts ps ON ps.shift_id = s.id
      WHERE s.show_date_id = $1 
        AND ps.participant_id IS NULL
        AND s.id != $2
      ORDER BY s.role
    `, [showDateId, shiftId]);

    ctx.response.body = availableRolesResult.rows;
  } finally {
    client.release();
  }
}

/**
 * Downloads a volunteer's schedule as PDF - can be called by volunteer or admin
 */
export async function downloadVolunteerSchedulePDF(ctx: RouterContext<string>) {
  const volunteerId = ctx.params.id;

  try {
    const { generateVolunteerPDFData, generateVolunteerSchedulePDF, getVolunteerScheduleMimeType, getVolunteerScheduleFileExtension } = await import("../utils/pdf-generator.ts");

    const pdfData = await generateVolunteerPDFData(volunteerId);
    const pdfBuffer = generateVolunteerSchedulePDF(pdfData);

    const filename = `theatre-shifts-${pdfData.volunteer.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.${getVolunteerScheduleFileExtension()}`;

    ctx.response.headers.set("Content-Type", getVolunteerScheduleMimeType());
    ctx.response.headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    ctx.response.body = pdfBuffer;
  } catch (error) {
    console.error("Error generating volunteer schedule PDF:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to generate PDF" };
  }
}

/**
 * Sends a volunteer's schedule PDF via email - admin only
 */
export async function emailVolunteerSchedulePDF(ctx: RouterContext<string>) {
  const volunteerId = ctx.params.id;

  try {
    const { generateVolunteerPDFData, filterCurrentAndFutureShifts } = await import("../utils/pdf-generator.ts");
    const { generateServerSidePDF } = await import("../utils/server-pdf-generator.ts");
    const { sendVolunteerScheduleEmail, createVolunteerLoginUrl } = await import("../utils/email.ts");

    // Generate PDF data (pass volunteerId as string, not Number)
    const pdfData = await generateVolunteerPDFData(volunteerId);

    // Check if volunteer has email
    if (!pdfData.volunteer.email) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Volunteer does not have an email address" };
      return;
    }

    // Generate PDF buffer (real PDF)
    const pdfBuffer = await generateServerSidePDF(pdfData);
    const filename = `theatre-shifts-${pdfData.volunteer.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;

    // Prepare email data
    const currentAndFutureShifts = filterCurrentAndFutureShifts(pdfData.assignedShifts);
    const hasShifts = currentAndFutureShifts.length > 0;
    // Improved shift preview formatting: date/time on first line, show/role on second, indented
    const shifts = currentAndFutureShifts.slice(0, 5).map(shift => {
      const date = new Date(shift.show_date).toLocaleDateString('en-AU', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
      });
      const arriveTime = new Date(shift.arrive_time).toLocaleTimeString('en-AU', {
        hour: '2-digit', minute: '2-digit', hour12: true
      });
      // Second line indented
      return `${date} ${arriveTime}<br><span style="margin-left:1.5em;display:inline-block;">${shift.show_name} (${shift.role})</span>`;
    });

    const baseUrl = Deno.env.get('BASE_URL') || `${ctx.request.url.protocol}//${ctx.request.url.host}`;
    const loginUrl = createVolunteerLoginUrl(baseUrl, pdfData.volunteer.id);

    const emailData = {
      volunteerName: pdfData.volunteer.name,
      volunteerEmail: pdfData.volunteer.email,
      loginUrl,
      hasShifts,
      shifts
    };

    // Send email with PDF attachment
    const currentUserId = ctx.state?.user?.id;
    const forceProduction = ctx.request.url.searchParams.get('force') === 'true';
    const emailSent = await sendVolunteerScheduleEmail(emailData, {
      content: pdfBuffer,
      filename
    }, currentUserId, forceProduction);

    if (emailSent) {
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: `Schedule PDF sent to ${pdfData.volunteer.email}`,
        hasShifts,
        shiftsCount: currentAndFutureShifts.length
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to send email" };
    }
  } catch (error) {
    console.error("Error sending volunteer schedule PDF:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to send schedule PDF" };
  }
}

/**
 * Sends a "It's Show Week" email to a volunteer with their schedule PDF attached - admin only
 */
export async function emailShowWeekPDF(ctx: RouterContext<string>) {
  const volunteerId = ctx.params.id;

  try {
    const { generateVolunteerPDFData, filterCurrentAndFutureShifts } = await import("../utils/pdf-generator.ts");
    const { generateServerSidePDF } = await import("../utils/server-pdf-generator.ts");
    const { sendShowWeekEmail, createVolunteerLoginUrl } = await import("../utils/email.ts");

    // Generate PDF data (pass volunteerId as string, not Number)
    const pdfData = await generateVolunteerPDFData(volunteerId);

    // Check if volunteer has email
    if (!pdfData.volunteer.email) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Volunteer does not have an email address" };
      return;
    }

    // Generate PDF buffer (real PDF)
    const pdfBuffer = await generateServerSidePDF(pdfData);
    const filename = `show-week-shifts-${pdfData.volunteer.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;

    // Prepare email data
    const currentAndFutureShifts = filterCurrentAndFutureShifts(pdfData.assignedShifts);
    const hasShifts = currentAndFutureShifts.length > 0;
    // Improved shift preview formatting: date/time on first line, show/role on second, indented
    const shifts = currentAndFutureShifts.slice(0, 5).map(shift => {
      const date = new Date(shift.show_date).toLocaleDateString('en-AU', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
      });
      const arriveTime = new Date(shift.arrive_time).toLocaleTimeString('en-AU', {
        hour: '2-digit', minute: '2-digit', hour12: true
      });
      // Second line indented
      return `${date} ${arriveTime}<br><span style="margin-left:1.5em;display:inline-block;">${shift.show_name} (${shift.role})</span>`;
    });

    const baseUrl = Deno.env.get('BASE_URL') || `${ctx.request.url.protocol}//${ctx.request.url.host}`;
    const loginUrl = createVolunteerLoginUrl(baseUrl, pdfData.volunteer.id);

    const emailData = {
      volunteerName: pdfData.volunteer.name,
      volunteerEmail: pdfData.volunteer.email,
      loginUrl,
      hasShifts,
      shifts
    };

    // Send email with PDF attachment
    const currentUserId = ctx.state?.user?.id;
    const forceProduction = ctx.request.url.searchParams.get('force') === 'true';
    const emailSent = await sendShowWeekEmail(emailData, {
      content: pdfBuffer,
      filename
    }, currentUserId, forceProduction);

    if (emailSent) {
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: `Show Week email sent to ${pdfData.volunteer.email}`,
        hasShifts,
        shiftsCount: currentAndFutureShifts.length
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to send email" };
    }
  } catch (error) {
    console.error("Error sending Show Week email:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to send Show Week email" };
  }
}

/**
 * Sends a "Last Minute Shifts" email to a volunteer with outstanding shifts PDF attached - admin only
 */
export async function emailLastMinuteShifts(ctx: RouterContext<string>) {
  const volunteerId = ctx.params.id;

  try {
    const { generateOutstandingShiftsPDF } = await import("../utils/unfilled-shifts-pdf-generator.ts");
    const { sendLastMinuteShiftsEmail } = await import("../utils/email.ts");

    // Get volunteer data
    const pool = getPool();
    const client = await pool.connect();
    let volunteer;
    
    try {
      const volunteerResult = await client.queryObject<{ id: number; name: string; email: string }>(
        "SELECT id, name, email FROM participants WHERE id = $1",
        [volunteerId]
      );
      
      if (volunteerResult.rows.length === 0) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Volunteer not found" };
        return;
      }
      
      volunteer = volunteerResult.rows[0];
    } finally {
      client.release();
    }

    // Check if volunteer has email
    if (!volunteer.email) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Volunteer does not have an email address" };
      return;
    }

    // Generate PDF of next 10 outstanding shifts
    const pdfBuffer = await generateOutstandingShiftsPDF(10);
    const filename = `last-minute-shifts-${new Date().toISOString().split('T')[0]}.pdf`;

    // Get the next 10 unfilled shifts for email preview
    const unfilledShifts = await getNext10UnfilledShifts();
    const hasShifts = unfilledShifts.length > 0;
    
    // Format shifts for email preview (similar to existing email formats)
    const shifts = unfilledShifts.map(shift => {
      const date = new Date(shift.show_start).toLocaleDateString('en-AU', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
      });
      const arriveTime = new Date(shift.arrive_time).toLocaleTimeString('en-AU', {
        hour: '2-digit', minute: '2-digit', hour12: true
      });
      return `${date} ${arriveTime}<br><span style="margin-left:1.5em;display:inline-block;">${shift.show_name} (${shift.role})</span>`;
    });

    const emailData = {
      volunteerName: volunteer.name,
      volunteerEmail: volunteer.email,
      volunteerId: volunteerId, // Add the volunteer ID for tracking
      hasShifts,
      shifts
    };

    // Send email with PDF attachment
    const currentUserId = ctx.state?.user?.id;
    const forceProduction = ctx.request.url.searchParams.get('force') === 'true';
    const emailSent = await sendLastMinuteShiftsEmail(emailData, {
      content: pdfBuffer,
      filename
    }, currentUserId, forceProduction);

    if (emailSent) {
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: `Last Minute Shifts email sent to ${volunteer.email}`,
        hasShifts,
        shiftsCount: unfilledShifts.length
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to send email" };
    }
  } catch (error) {
    console.error("Error sending Last Minute Shifts email:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to send Last Minute Shifts email" };
  }
}

// Helper function to get next 10 unfilled shifts
async function getNext10UnfilledShifts() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    type ShiftRow = {
      id: number;
      show_name: string;
      date: string;
      show_start: string;
      role: string;
      arrive_time: string;
    };
    
    const result = await client.queryObject<ShiftRow>(
      `SELECT s.id, sh.name as show_name, 
              DATE(sd.start_time) as date, 
              sd.start_time as show_start,
              s.role, 
              s.arrive_time AT TIME ZONE 'Australia/Adelaide' as arrive_time
       FROM shifts s
       JOIN show_dates sd ON sd.id = s.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       LEFT JOIN participant_shifts vs ON vs.shift_id = s.id
       WHERE sd.start_time >= NOW()
       GROUP BY s.id, sh.name, DATE(sd.start_time), sd.start_time, s.role, s.arrive_time
       HAVING COUNT(vs.participant_id) = 0
       ORDER BY sd.start_time, s.arrive_time
       LIMIT 10`
    );
    
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Get unfilled shifts that don't overlap with a volunteer's existing shifts
 */
async function getUnfilledShiftsForVolunteer(volunteerId: string, limit = 10) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    type ShiftRow = {
      id: number;
      show_name: string;
      date: string;
      show_start: string;
      role: string;
      arrive_time: string;
      depart_time: string;
    };
    
    const result = await client.queryObject<ShiftRow>(
      `SELECT s.id, sh.name as show_name, 
              DATE(sd.start_time) as date, 
              sd.start_time as show_start,
              s.role, 
              s.arrive_time AT TIME ZONE 'Australia/Adelaide' as arrive_time,
              s.depart_time AT TIME ZONE 'Australia/Adelaide' as depart_time
       FROM shifts s
       JOIN show_dates sd ON sd.id = s.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       LEFT JOIN participant_shifts vs ON vs.shift_id = s.id
       WHERE sd.start_time >= NOW()
         AND s.id NOT IN (
           -- Exclude shifts that overlap with volunteer's existing shifts
           SELECT DISTINCT unfilled.id
           FROM shifts unfilled
           JOIN show_dates unfilled_sd ON unfilled_sd.id = unfilled.show_date_id
           JOIN shifts existing ON existing.id IN (
             SELECT ps.shift_id 
             FROM participant_shifts ps 
             WHERE ps.participant_id = $1
           )
           JOIN show_dates existing_sd ON existing_sd.id = existing.show_date_id
           WHERE unfilled_sd.start_time >= NOW()
             AND (
               -- Check for time overlap: shifts overlap if one starts before the other ends
               (unfilled.arrive_time < existing.depart_time AND unfilled.depart_time > existing.arrive_time)
               OR 
               -- Also check show date overlap as backup
               (unfilled_sd.start_time < existing_sd.end_time AND unfilled_sd.end_time > existing_sd.start_time)
             )
         )
       GROUP BY s.id, sh.name, DATE(sd.start_time), sd.start_time, s.role, s.arrive_time, s.depart_time
       HAVING COUNT(vs.participant_id) = 0
       ORDER BY sd.start_time, s.arrive_time
       LIMIT $2`,
      [volunteerId, limit]
    );
    
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Generates and downloads unfilled shifts PDF - admin only
 */
export async function downloadUnfilledShiftsPDF(ctx: RouterContext<string>) {
  try {
    const { generateUnfilledShiftsPDF } = await import("../utils/unfilled-shifts-pdf-generator.ts");

    // Generate PDF buffer
    const pdfBuffer = await generateUnfilledShiftsPDF();

    const filename = `unfilled-shifts-${new Date().toISOString().split('T')[0]}.pdf`;

    ctx.response.headers.set("Content-Type", "application/pdf");
    ctx.response.headers.set("Content-Disposition", `inline; filename="${filename}"`);
    ctx.response.body = pdfBuffer;
  } catch (error) {
    console.error("Error generating unfilled shifts PDF:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to generate PDF" };
  }
}

/**
 * Gets email history for a participant - admin only
 */
export async function getParticipantEmailHistory(ctx: RouterContext<string>) {
  const participantId = ctx.params.id;

  try {
    const { getEmailsForParticipant } = await import("../utils/email-tracking.ts");
    const emails = await getEmailsForParticipant(participantId);

    // Format the response with safe data (don't expose full HTML content in list)
    const formattedEmails = emails.map(email => ({
      id: email.id,
      to_email: email.to_email,
      from_email: email.from_email,
      subject: email.subject,
      email_type: email.email_type,
      sent_at: email.sent_at,
      delivery_status: email.delivery_status,
      attachment_count: email.attachments?.length || 0,
      attachments: email.attachments?.map(att => ({
        id: att.id,
        filename: att.filename,
        content_type: att.content_type,
        file_size: att.file_size
      }))
    }));

    ctx.response.body = { emails: formattedEmails };
  } catch (error) {
    console.error("Error getting participant email history:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get email history" };
  }
}

/**
 * Gets a specific email's full content - admin only
 */
export async function getEmailContent(ctx: RouterContext<string>) {
  const emailId = parseInt(ctx.params.emailId);

  try {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Get email details with sender/recipient information
      const emailResult = await client.queryObject<{
        id: number;
        html_content: string;
        subject: string;
        email_type: string;
        sent_at: Date;
        to_email: string;
        from_email: string;
        to_participant_id: string;
        delivery_status: string;
      }>(
        `SELECT id, html_content, subject, email_type, sent_at, to_email, from_email, 
                to_participant_id, delivery_status
        FROM sent_emails WHERE id = $1`,
        [emailId]
      );

      if (emailResult.rows.length === 0) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Email not found" };
        return;
      }

      const email = emailResult.rows[0];

      // Get participant name if available
      let recipientName = 'Unknown';
      if (email.to_participant_id) {
        const participantResult = await client.queryObject<{ name: string }>(
          `SELECT name FROM participants WHERE id = $1`,
          [email.to_participant_id]
        );
        if (participantResult.rows.length > 0) {
          recipientName = participantResult.rows[0].name;
        }
      }

      // Get attachments
      const attachmentResult = await client.queryObject<{
        id: number;
        filename: string;
        content_type: string;
        file_size: number;
      }>(
        `SELECT id, filename, content_type, file_size
        FROM email_attachments WHERE sent_email_id = $1`,
        [emailId]
      );

      // Build response with all necessary information
      ctx.response.body = {
        id: email.id,
        html_content: email.html_content,
        subject: email.subject,
        email_type: email.email_type,
        sent_at: email.sent_at,
        sender_name: 'Theatre Shifts Admin',
        sender_email: email.from_email,
        recipient_name: recipientName,
        recipient_email: email.to_email,
        delivery_status: email.delivery_status,
        attachments: attachmentResult.rows
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error getting email content:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get email content" };
  }
}

/**
 * Downloads an email attachment - admin only
 */
export async function downloadEmailAttachment(ctx: RouterContext<string>) {
  const attachmentId = parseInt(ctx.params.attachmentId);

  try {
    const { getEmailAttachment } = await import("../utils/email-tracking.ts");
    const attachment = await getEmailAttachment(attachmentId);

    if (!attachment) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Attachment not found" };
      return;
    }

    ctx.response.headers.set("Content-Type", attachment.content_type);
    
    // For PDFs, use inline to open in browser; for other files, force download
    if (attachment.content_type === 'application/pdf') {
      ctx.response.headers.set("Content-Disposition", `inline; filename="${attachment.filename}"`);
    } else {
      ctx.response.headers.set("Content-Disposition", `attachment; filename="${attachment.filename}"`);
    }
    
    ctx.response.body = attachment.file_data;
  } catch (error) {
    console.error("Error downloading email attachment:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to download attachment" };
  }
}

/**
 * Gets shows that can be used for bulk email filtering - admin only
 */
export async function getShowsForBulkEmail(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    // Get shows that have upcoming performances with volunteers
    const result = await client.queryObject<{
      id: number;
      name: string;
      upcoming_performances: number;
      volunteers_with_shifts: number;
    }>(
      `SELECT s.id, s.name,
              COUNT(DISTINCT sd.id) as upcoming_performances,
              COUNT(DISTINCT vs.participant_id) as volunteers_with_shifts
       FROM shows s
       JOIN show_dates sd ON sd.show_id = s.id
       JOIN shifts sh ON sh.show_date_id = sd.id
       LEFT JOIN participant_shifts vs ON vs.shift_id = sh.id
       WHERE sd.start_time >= NOW() - INTERVAL '1 week'
       GROUP BY s.id, s.name
       HAVING COUNT(DISTINCT sd.id) > 0
       ORDER BY MIN(sd.start_time), s.name`
    );

    ctx.response.body = result.rows.map(show => ({
      ...show,
      upcoming_performances: Number(show.upcoming_performances),
      volunteers_with_shifts: Number(show.volunteers_with_shifts)
    }));
  } finally {
    client.release();
  }
}

/**
 * Gets volunteers with shifts for a specific show - admin only
 */
export async function getVolunteersForShow(ctx: RouterContext<string>) {
  const showId = ctx.params.showId;
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.queryObject<{
      id: string;
      name: string;
      email: string;
      shift_count: number;
      next_shift_date: string | null;
    }>(
      `SELECT p.id, p.name, p.email,
              COUNT(DISTINCT vs.shift_id) as shift_count,
              MIN(sd.start_time)::date::text as next_shift_date
       FROM participants p
       JOIN participant_shifts vs ON vs.participant_id = p.id
       JOIN shifts s ON s.id = vs.shift_id
       JOIN show_dates sd ON sd.id = s.show_date_id
       WHERE sd.show_id = $1
         AND sd.start_time >= NOW() - INTERVAL '1 week'
         AND p.email IS NOT NULL
         AND p.email != ''
       GROUP BY p.id, p.name, p.email
       ORDER BY p.name`,
      [showId]
    );

    ctx.response.body = result.rows.map(volunteer => ({
      ...volunteer,
      shift_count: Number(volunteer.shift_count)
    }));
  } finally {
    client.release();
  }
}

/**
 * Gets all volunteers who are available for unfilled shifts - admin only
 */
export async function getVolunteersForUnfilledShifts(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    // Get all approved volunteers with email addresses
    const result = await client.queryObject<{
      id: string;
      name: string;
      email: string;
      total_shifts: number;
      upcoming_shifts: number;
    }>(
      `SELECT p.id, p.name, p.email,
              COUNT(DISTINCT vs.shift_id) as total_shifts,
              COUNT(DISTINCT CASE WHEN sd.start_time >= NOW() THEN vs.shift_id END) as upcoming_shifts
       FROM participants p
       LEFT JOIN participant_shifts vs ON vs.participant_id = p.id
       LEFT JOIN shifts s ON s.id = vs.shift_id
       LEFT JOIN show_dates sd ON sd.id = s.show_date_id
       WHERE p.approved = true
         AND p.email IS NOT NULL
         AND p.email != ''
       GROUP BY p.id, p.name, p.email
       ORDER BY p.name`
    );

    ctx.response.body = result.rows.map(volunteer => ({
      ...volunteer,
      total_shifts: Number(volunteer.total_shifts),
      upcoming_shifts: Number(volunteer.upcoming_shifts)
    }));
  } finally {
    client.release();
  }
}

/**
 * Sends bulk show week emails to volunteers with shifts for a specific show - admin only
 */
export async function sendBulkShowWeekEmails(ctx: RouterContext<string>) {
  const { showId, volunteerIds } = await ctx.request.body.json();
  
  if (!showId || !volunteerIds || !Array.isArray(volunteerIds)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Show ID and volunteer IDs are required" };
    return;
  }

  const pool = getPool();
  const client = await pool.connect();
  const currentUserId = ctx.state?.user?.id;
  const forceProduction = ctx.request.url.searchParams.get('force') === 'true';
  
  const results = [];
  let successCount = 0;
  let errorCount = 0;

  try {
    const { generateVolunteerPDFData, filterCurrentAndFutureShifts } = await import("../utils/pdf-generator.ts");
    const { generateServerSidePDF } = await import("../utils/server-pdf-generator.ts");
    const { sendShowWeekEmail, createVolunteerLoginUrl } = await import("../utils/email.ts");

    const baseUrl = Deno.env.get('BASE_URL') || `${ctx.request.url.protocol}//${ctx.request.url.host}`;

    for (const volunteerId of volunteerIds) {
      try {
        // Generate PDF data for this volunteer
        const pdfData = await generateVolunteerPDFData(volunteerId);

        // Check if volunteer has email
        if (!pdfData.volunteer.email) {
          results.push({
            volunteerId,
            volunteerName: pdfData.volunteer.name,
            success: false,
            error: "No email address"
          });
          errorCount++;
          continue;
        }

        // Generate PDF buffer
        const pdfBuffer = await generateServerSidePDF(pdfData);
        const filename = `show-week-shifts-${pdfData.volunteer.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;

        // Prepare email data
        const currentAndFutureShifts = filterCurrentAndFutureShifts(pdfData.assignedShifts);
        const hasShifts = currentAndFutureShifts.length > 0;
        
        // Format shifts for email preview
        const shifts = currentAndFutureShifts.slice(0, 5).map(shift => {
          const date = new Date(shift.show_date).toLocaleDateString('en-AU', {
            weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
          });
          const arriveTime = new Date(shift.arrive_time).toLocaleTimeString('en-AU', {
            hour: '2-digit', minute: '2-digit', hour12: true
          });
          return `${date} ${arriveTime}<br><span style="margin-left:1.5em;display:inline-block;">${shift.show_name} (${shift.role})</span>`;
        });

        const loginUrl = createVolunteerLoginUrl(baseUrl, pdfData.volunteer.id);

        const emailData = {
          volunteerName: pdfData.volunteer.name,
          volunteerEmail: pdfData.volunteer.email,
          loginUrl,
          hasShifts,
          shifts
        };

        // Send email
        const emailSent = await sendShowWeekEmail(emailData, {
          content: pdfBuffer,
          filename
        }, currentUserId, forceProduction);

        if (emailSent) {
          results.push({
            volunteerId,
            volunteerName: pdfData.volunteer.name,
            volunteerEmail: pdfData.volunteer.email,
            success: true,
            shiftsCount: currentAndFutureShifts.length
          });
          successCount++;
        } else {
          results.push({
            volunteerId,
            volunteerName: pdfData.volunteer.name,
            volunteerEmail: pdfData.volunteer.email,
            success: false,
            error: "Failed to send email"
          });
          errorCount++;
        }

        // Add a small delay between emails to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error sending show week email to volunteer ${volunteerId}:`, error);
        results.push({
          volunteerId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        errorCount++;
      }
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: `Bulk show week emails completed: ${successCount} sent, ${errorCount} failed`,
      successCount,
      errorCount,
      results
    };

  } catch (error) {
    console.error("Error in bulk show week email operation:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to send bulk show week emails" };
  } finally {
    client.release();
  }
}

/**
 * Sends bulk unfilled shifts emails to selected volunteers - admin only
 */
export async function sendBulkUnfilledShiftsEmails(ctx: RouterContext<string>) {
  const { volunteerIds } = await ctx.request.body.json();
  
  if (!volunteerIds || !Array.isArray(volunteerIds)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Volunteer IDs are required" };
    return;
  }

  const pool = getPool();
  const client = await pool.connect();
  const currentUserId = ctx.state?.user?.id;
  const forceProduction = ctx.request.url.searchParams.get('force') === 'true';
  
  const results = [];
  let successCount = 0;
  let errorCount = 0;

  try {
    const { generateOutstandingShiftsPDFForVolunteer } = await import("../utils/unfilled-shifts-pdf-generator.ts");
    const { sendLastMinuteShiftsEmail } = await import("../utils/email.ts");

    for (const volunteerId of volunteerIds) {
      try {
        // Get volunteer data
        const volunteerResult = await client.queryObject<{ id: string; name: string; email: string }>(
          "SELECT id, name, email FROM participants WHERE id = $1",
          [volunteerId]
        );
        
        if (volunteerResult.rows.length === 0) {
          results.push({
            volunteerId,
            success: false,
            error: "Volunteer not found"
          });
          errorCount++;
          continue;
        }
        
        const volunteer = volunteerResult.rows[0];

        // Check if volunteer has email
        if (!volunteer.email) {
          results.push({
            volunteerId,
            volunteerName: volunteer.name,
            success: false,
            error: "No email address"
          });
          errorCount++;
          continue;
        }


        // Get unfilled shifts that don't overlap with this volunteer's existing shifts
        const unfilledShifts = await getUnfilledShiftsForVolunteer(volunteerId, 10);
        if (unfilledShifts.length === 0) {
          results.push({
            volunteerId,
            volunteerName: volunteer.name,
            volunteerEmail: volunteer.email,
            success: true,
            info: "No available shifts for this volunteer, email not sent"
          });
          // Do not increment errorCount, this is an expected case
          continue;
        }

        // Format shifts for email preview
        const shifts = unfilledShifts.map(shift => {
          const date = new Date(shift.show_start).toLocaleDateString('en-AU', {
            weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
          });
          const arriveTime = new Date(shift.arrive_time).toLocaleTimeString('en-AU', {
            hour: '2-digit', minute: '2-digit', hour12: true
          });
          return `${date} ${arriveTime}<br><span style="margin-left:1.5em;display:inline-block;">${shift.show_name} (${shift.role})</span>`;
        });

        // Generate volunteer-specific PDF with non-overlapping shifts
        const pdfBuffer = await generateOutstandingShiftsPDFForVolunteer(volunteerId, 10);
        const filename = `last-minute-shifts-${volunteer.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;

        const emailData = {
          volunteerName: volunteer.name,
          volunteerEmail: volunteer.email,
          volunteerId: volunteerId,
          hasShifts: true,
          shifts
        };

        // Send email
        const emailSent = await sendLastMinuteShiftsEmail(emailData, {
          content: pdfBuffer,
          filename
        }, currentUserId, forceProduction);

        if (emailSent) {
          results.push({
            volunteerId,
            volunteerName: volunteer.name,
            volunteerEmail: volunteer.email,
            success: true,
            shiftsCount: unfilledShifts.length
          });
          successCount++;
        } else {
          results.push({
            volunteerId,
            volunteerName: volunteer.name,
            volunteerEmail: volunteer.email,
            success: false,
            error: "Failed to send email"
          });
          errorCount++;
        }

        // Add a small delay between emails to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error sending unfilled shifts email to volunteer ${volunteerId}:`, error);
        results.push({
          volunteerId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        errorCount++;
      }
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: `Bulk unfilled shifts emails completed: ${successCount} sent, ${errorCount} failed`,
      successCount,
      errorCount,
      results
    };

  } catch (error) {
    console.error("Error in bulk unfilled shifts email operation:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to send bulk unfilled shifts emails" };
  } finally {
    client.release();
  }
}
