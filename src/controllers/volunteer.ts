import type { RouterContext } from "oak";
import { getPool } from "../models/db.ts";
import { render } from "../utils/template.ts";

// ...existing code...
interface VolunteerRecord {
  id: string; // UUID
  name: string;
  email?: string;
  phone?: string;
}

export async function viewSignup(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const pool = getPool();
  const client = await pool.connect();
  try {
    const volunteerRes = await client.queryObject<VolunteerRecord>("SELECT * FROM participants WHERE id=$1", [id]);
    if (volunteerRes.rows.length === 0) {
      ctx.throw(404, "Volunteer not found");
    }

    // ...existing code...
    type ShiftRow = {
      id: string; // UUID
      show_id: string; // UUID
      show_name: string;
      show_date_id: string; // UUID
      role: string;
      arrive_time: string;
      depart_time: string;
      start_time: string;
      end_time: string;
    };

    // Get assigned shifts
    const assignedShiftsRes = await client.queryObject<ShiftRow>(
      `SELECT s.id, s.role,
              TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as arrive_time,
              TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as depart_time, 
              s.show_date_id,
              sh.name as show_name, sh.id as show_id,
              TO_CHAR(sd.start_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as start_time,
              TO_CHAR(sd.end_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as end_time
       FROM shifts s
       JOIN show_dates sd ON sd.id = s.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       JOIN participant_shifts vs ON vs.shift_id = s.id
       WHERE vs.participant_id = $1
       ORDER BY sh.name, sd.start_time, s.arrive_time`,
      [id]
    );

    // Get available shifts (not assigned to any participant)
    const shiftsRes = await client.queryObject<ShiftRow>(
      `SELECT s.id, s.role,
              TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as arrive_time,
              TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as depart_time,
              s.show_date_id,
              sh.name as show_name, sh.id as show_id,
              TO_CHAR(sd.start_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as start_time,
              TO_CHAR(sd.end_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as end_time
       FROM shifts s
       JOIN show_dates sd ON sd.id = s.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       LEFT JOIN participant_shifts vs ON vs.shift_id = s.id
       WHERE vs.participant_id IS NULL
       ORDER BY sh.name, sd.start_time, s.arrive_time`,
      [],
    );

    // Group assigned shifts by show, then by performance
    // ...existing code...
    const groupedAssigned: {
      [showId: string]: {
        show_id: string; // UUID
        show_name: string;
        performances: {
          [perfKey: string]: {
            start_time: string;
            end_time: string;
            shifts: ShiftRow[];
          }
        }
      }
    } = {};
    for (const row of assignedShiftsRes.rows) {
      // Add a 'date' field (YYYY-MM-DD) for frontend compatibility
      let startTimeStr: string;
      if (typeof row.start_time === 'string') {
        startTimeStr = row.start_time;
      } else {
        try {
          startTimeStr = new Date(row.start_time).toISOString();
        } catch {
          startTimeStr = '';
        }
      }
      const date = startTimeStr && typeof startTimeStr === 'string' ? startTimeStr.split('T')[0] : '';
      const rowWithDate = { ...row, date };
      const showKey = `${row.show_id}`;
      if (!groupedAssigned[showKey]) {
        groupedAssigned[showKey] = {
          show_id: row.show_id,
          show_name: row.show_name,
          performances: {}
        };
      }
      const perfKey = `${startTimeStr}`;
      if (!groupedAssigned[showKey].performances[perfKey]) {
        groupedAssigned[showKey].performances[perfKey] = {
          start_time: startTimeStr,
          end_time: row.end_time,
          shifts: []
        };
      }
      groupedAssigned[showKey].performances[perfKey].shifts.push(rowWithDate);
    }

    // Group available shifts by show, then by performance
    // ...existing code...
    const groupedAvailable: {
      [showId: string]: {
        show_id: string; // UUID
        show_name: string;
        performances: {
          [perfKey: string]: {
            start_time: string;
            end_time: string;
            shifts: ShiftRow[];
          }
        }
      }
    } = {};
    for (const row of shiftsRes.rows) {
      // Add a 'date' field (YYYY-MM-DD) for frontend compatibility
      let startTimeStr: string;
      if (typeof row.start_time === 'string') {
        startTimeStr = row.start_time;
      } else {
        try {
          startTimeStr = new Date(row.start_time).toISOString();
        } catch {
          startTimeStr = '';
        }
      }
      const date = startTimeStr && typeof startTimeStr === 'string' ? startTimeStr.split('T')[0] : '';
      const rowWithDate = { ...row, date };
      const showKey = `${row.show_id}`;
      if (!groupedAvailable[showKey]) {
        groupedAvailable[showKey] = {
          show_id: row.show_id,
          show_name: row.show_name,
          performances: {}
        };
      }
      const perfKey = `${startTimeStr}`;
      if (!groupedAvailable[showKey].performances[perfKey]) {
        groupedAvailable[showKey].performances[perfKey] = {
          start_time: startTimeStr,
          end_time: row.end_time,
          shifts: []
        };
      }
      groupedAvailable[showKey].performances[perfKey].shifts.push(rowWithDate);
    }

    // Convert to array structure
    const assignedShiftsGrouped = Object.values(groupedAssigned).map(show => ({
      show_id: show.show_id,
      show_name: show.show_name,
      performances: Object.values(show.performances)
    }));

    const availableShiftsGrouped = Object.values(groupedAvailable).map(show => ({
      show_id: show.show_id,
      show_name: show.show_name,
      performances: Object.values(show.performances)
    }));

    // Thoroughly sanitize JSON to prevent syntax errors
    // Convert objects to strings with built-in JSON.stringify which handles escaping correctly
    const assignedJSON = JSON.stringify(assignedShiftsGrouped);
    const availableJSON = JSON.stringify(availableShiftsGrouped);

    // Just use the JSON strings directly, no need for additional escaping
    // JSON.stringify already properly escapes special characters for JSON context
    const safeAssignedJSON = assignedJSON;
    const safeAvailableJSON = availableJSON;

    const html = await render(
      "views/signup.html", {
      name: volunteerRes.rows[0].name,
      volunteerId: id,
      assignedShiftsJson: safeAssignedJSON,
      shiftsJson: safeAvailableJSON,
    },
    );

    ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
    ctx.response.body = html;
  } finally {
    client.release();
  }
}

export async function submitSignup(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const body = await ctx.request.body.json();
  const { shiftIds } = body as { shiftIds: string[] };
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.queryObject("BEGIN");

    // Check for conflicts before inserting any shifts
    for (const shiftId of shiftIds) {
      // Get the show_date_id for the shift being added
      const shiftResult = await client.queryObject<{ show_date_id: number }>(
        "SELECT show_date_id FROM shifts WHERE id = $1",
        [shiftId]
      );

      if (shiftResult.rows.length === 0) {
        await client.queryObject("ROLLBACK");
        ctx.response.status = 400;
        ctx.response.body = {
          error: "Invalid shift ID",
          conflictType: "invalid_shift",
          shiftId
        };
        return;
      }

      const showDateId = shiftResult.rows[0].show_date_id;

      // Check if volunteer already has a shift for this show_date_id
      const existingShift = await client.queryObject<{ shift_id: number; role: string }>(
        `SELECT s.id as shift_id, s.role 
         FROM shifts s
         JOIN participant_shifts vs ON vs.shift_id = s.id
         WHERE vs.participant_id = $1 AND s.show_date_id = $2`,
        [id, showDateId]
      );

      if (existingShift.rows.length > 0) {
        // Get performance details for the error response
        const performanceResult = await client.queryObject<{
          date: string;
          start_time: string;
          end_time: string;
          show_name: string;
        }>(
          `SELECT DATE(sd.start_time) as date, sd.start_time, sd.end_time, sh.name as show_name
           FROM show_dates sd
           JOIN shows sh ON sh.id = sd.show_id
           WHERE sd.id = $1`,
          [showDateId]
        );

        await client.queryObject("ROLLBACK");
        ctx.response.status = 409;
        ctx.response.body = {
          error: "Already assigned to a shift for this performance",
          conflictType: "performance_conflict",
          existingShift: {
            id: existingShift.rows[0].shift_id,
            role: existingShift.rows[0].role
          },
          performance: performanceResult.rows[0],
          requestedShiftId: shiftId
        };
        return;
      }
    }

    // If no conflicts, insert all shifts
    for (const shiftId of shiftIds) {
      await client.queryObject(
        "INSERT INTO participant_shifts (participant_id, shift_id) VALUES ($1, $2)",
        [id, shiftId],
      );
    }

    await client.queryObject("COMMIT");
    ctx.response.status = 201;
    ctx.response.body = { success: true, message: `Successfully signed up for ${shiftIds.length} shift(s)` };
  } catch (error) {
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function removeFromShift(ctx: RouterContext<string>) {
  const volunteerId = ctx.params.id;
  const body = await ctx.request.body.json();
  const { shiftId } = body as { shiftId: string };
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.queryObject(
      "DELETE FROM participant_shifts WHERE participant_id = $1 AND shift_id = $2",
      [volunteerId, shiftId]
    );
    ctx.response.status = 200;
    ctx.response.body = { success: true };
  } finally {
    client.release();
  }
}

export async function swapShift(ctx: RouterContext<string>) {
  const volunteerId = ctx.params.id;
  const body = await ctx.request.body.json();
  const { oldShiftId, newShiftId } = body as { oldShiftId: string; newShiftId: string };
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.queryObject("BEGIN");

    // Verify both shifts exist and are for the same performance
    const shiftsResult = await client.queryObject<{
      shift_id: number;
      show_date_id: number;
      role: string;
    }>(
      `SELECT id as shift_id, show_date_id, role 
       FROM shifts 
       WHERE id IN ($1, $2)`,
      [oldShiftId, newShiftId]
    );

    if (shiftsResult.rows.length !== 2) {
      await client.queryObject("ROLLBACK");
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid shift IDs" };
      return;
    }

    const [shift1, shift2] = shiftsResult.rows;
    if (shift1.show_date_id !== shift2.show_date_id) {
      await client.queryObject("ROLLBACK");
      ctx.response.status = 400;
      ctx.response.body = { error: "Shifts must be for the same performance" };
      return;
    }

    // Remove old assignment
    await client.queryObject(
      "DELETE FROM participant_shifts WHERE participant_id = $1 AND shift_id = $2",
      [volunteerId, oldShiftId]
    );

    // Add new assignment
    await client.queryObject(
      "INSERT INTO participant_shifts (participant_id, shift_id) VALUES ($1, $2)",
      [volunteerId, newShiftId]
    );

    await client.queryObject("COMMIT");
    ctx.response.status = 200;
    ctx.response.body = { success: true, message: "Shift swapped successfully" };
  } catch (error) {
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function downloadPDF(ctx: RouterContext<string>) {
  const id = ctx.params.id;

  try {
    const { generateVolunteerPDFData } = await import("../utils/pdf-generator.ts");
    const { generateServerSidePDF } = await import("../utils/server-pdf-generator.ts");

    const pdfData = await generateVolunteerPDFData(id);
    const pdfBuffer = await generateServerSidePDF(pdfData);

    const filename = `theatre-shifts-${pdfData.volunteer.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;

    ctx.response.headers.set("Content-Type", "application/pdf");
    ctx.response.headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    ctx.response.body = pdfBuffer;
  } catch (error) {
    console.error("Error generating PDF:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to generate PDF" };
  }
}

export async function downloadSchedulePDF(ctx: RouterContext<string>) {
  const id = ctx.params.id;

  try {
    const { generateVolunteerPDFData } = await import("../utils/pdf-generator.ts");
    const { generateServerSidePDF } = await import("../utils/server-pdf-generator.ts");

    const pdfData = await generateVolunteerPDFData(id);
    const pdfBuffer = await generateServerSidePDF(pdfData);

    const filename = `theatre-shifts-${pdfData.volunteer.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;

    ctx.response.headers.set("Content-Type", "application/pdf");
    ctx.response.headers.set("Content-Disposition", `inline; filename="${filename}"`);
    ctx.response.body = pdfBuffer;
  } catch (error) {
    console.error("Error generating volunteer schedule PDF:", error);
    ctx.response.status = 500;
    ctx.response.body = "Failed to generate PDF";
  }
}
