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
    const volunteerRes = await client.queryObject<VolunteerRecord>(
      "SELECT * FROM participants WHERE id=$1",
      [id]
    );
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
      []
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
          };
        };
      };
    } = {};
    for (const row of assignedShiftsRes.rows) {
      // Add a 'date' field (YYYY-MM-DD) for frontend compatibility
      let startTimeStr: string;
      if (typeof row.start_time === "string") {
        startTimeStr = row.start_time;
      } else {
        try {
          startTimeStr = new Date(row.start_time).toISOString();
        } catch {
          startTimeStr = "";
        }
      }
      const date =
        startTimeStr && typeof startTimeStr === "string"
          ? startTimeStr.split("T")[0]
          : "";
      const rowWithDate = { ...row, date };
      const showKey = `${row.show_id}`;
      if (!groupedAssigned[showKey]) {
        groupedAssigned[showKey] = {
          show_id: row.show_id,
          show_name: row.show_name,
          performances: {},
        };
      }
      const perfKey = `${startTimeStr}`;
      if (!groupedAssigned[showKey].performances[perfKey]) {
        groupedAssigned[showKey].performances[perfKey] = {
          start_time: startTimeStr,
          end_time: row.end_time,
          shifts: [],
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
          };
        };
      };
    } = {};
    for (const row of shiftsRes.rows) {
      // Add a 'date' field (YYYY-MM-DD) for frontend compatibility
      let startTimeStr: string;
      if (typeof row.start_time === "string") {
        startTimeStr = row.start_time;
      } else {
        try {
          startTimeStr = new Date(row.start_time).toISOString();
        } catch {
          startTimeStr = "";
        }
      }
      const date =
        startTimeStr && typeof startTimeStr === "string"
          ? startTimeStr.split("T")[0]
          : "";
      const rowWithDate = { ...row, date };
      const showKey = `${row.show_id}`;
      if (!groupedAvailable[showKey]) {
        groupedAvailable[showKey] = {
          show_id: row.show_id,
          show_name: row.show_name,
          performances: {},
        };
      }
      const perfKey = `${startTimeStr}`;
      if (!groupedAvailable[showKey].performances[perfKey]) {
        groupedAvailable[showKey].performances[perfKey] = {
          start_time: startTimeStr,
          end_time: row.end_time,
          shifts: [],
        };
      }
      groupedAvailable[showKey].performances[perfKey].shifts.push(rowWithDate);
    }

    // Convert to array structure
    const assignedShiftsGrouped = Object.values(groupedAssigned).map(
      (show) => ({
        show_id: show.show_id,
        show_name: show.show_name,
        performances: Object.values(show.performances),
      })
    );

    const availableShiftsGrouped = Object.values(groupedAvailable).map(
      (show) => ({
        show_id: show.show_id,
        show_name: show.show_name,
        performances: Object.values(show.performances),
      })
    );

    // Thoroughly sanitize JSON to prevent syntax errors
    // Convert objects to strings with built-in JSON.stringify which handles escaping correctly
    const assignedJSON = JSON.stringify(assignedShiftsGrouped);
    const availableJSON = JSON.stringify(availableShiftsGrouped);

    // Just use the JSON strings directly, no need for additional escaping
    // JSON.stringify already properly escapes special characters for JSON context
    const safeAssignedJSON = assignedJSON;
    const safeAvailableJSON = availableJSON;

    const html = await render("views/signup.html", {
      name: volunteerRes.rows[0].name,
      volunteerId: id,
      assignedShiftsJson: safeAssignedJSON,
      shiftsJson: safeAvailableJSON,
    });

    ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
    ctx.response.body = html;
  } finally {
    client.release();
  }
}

export async function viewWizard(ctx: RouterContext<string>) {
  const volunteerId = ctx.params.id;
  const showIdParam = ctx.request.url.searchParams.get("showId");
  const showId = showIdParam ? Number(showIdParam) : NaN;

  if (!volunteerId || Number.isNaN(showId)) {
    ctx.throw(400, "Missing or invalid parameters");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    const volunteerRes = await client.queryObject<{
      id: string;
      name: string;
      email: string | null;
    }>("SELECT id, name, email FROM participants WHERE id = $1", [volunteerId]);

    if (volunteerRes.rows.length === 0) {
      ctx.throw(404, "Volunteer not found");
    }

    const showRes = await client.queryObject<{ id: number; name: string }>(
      "SELECT id, name FROM shows WHERE id = $1",
      [showId]
    );

    if (showRes.rows.length === 0) {
      ctx.throw(404, "Show not found");
    }

    const showDatesRes = await client.queryObject<{
      id: number;
      start_time: string;
      end_time: string;
    }>(
      `SELECT id,
              TO_CHAR(start_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') AS start_time,
              TO_CHAR(end_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') AS end_time
         FROM show_dates
        WHERE show_id = $1
        ORDER BY start_time`,
      [showId]
    );

    const showDateIds = showDatesRes.rows.map((row) => row.id);

    const availableShiftsRes =
      showDateIds.length > 0
        ? await client.queryObject<{
            id: number;
            role: string;
            show_date_id: number;
            arrive_time: string;
            depart_time: string;
          }>(
            `SELECT s.id,
                s.role,
                s.show_date_id,
                TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') AS arrive_time,
                TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') AS depart_time
           FROM shifts s
           LEFT JOIN participant_shifts ps ON ps.shift_id = s.id
          WHERE s.show_date_id = ANY($1::int[])
            AND ps.shift_id IS NULL
          ORDER BY s.show_date_id, s.arrive_time`,
            [showDateIds]
          )
        : { rows: [] };

    const assignedRes =
      showDateIds.length > 0
        ? await client.queryObject<{
            shift_id: number;
            show_date_id: number;
            role: string;
            arrive_time: string;
            depart_time: string;
          }>(
            `SELECT s.id AS shift_id,
                s.show_date_id,
                s.role,
                TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') AS arrive_time,
                TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') AS depart_time
           FROM participant_shifts ps
           JOIN shifts s ON s.id = ps.shift_id
          WHERE ps.participant_id = $1
            AND s.show_date_id = ANY($2::int[])
          ORDER BY s.show_date_id, s.arrive_time`,
            [volunteerId, showDateIds]
          )
        : { rows: [] };

    const availableByShowDate = new Map<
      number,
      Array<{
        id: number;
        role: string;
        arriveTime: string;
        departTime: string;
      }>
    >();
    for (const shift of availableShiftsRes.rows) {
      if (!availableByShowDate.has(shift.show_date_id)) {
        availableByShowDate.set(shift.show_date_id, []);
      }
      availableByShowDate.get(shift.show_date_id)!.push({
        id: shift.id,
        role: shift.role,
        arriveTime: shift.arrive_time,
        departTime: shift.depart_time,
      });
    }

    const assignedByShowDate = new Map<
      number,
      { shiftId: number; role: string; arriveTime: string; departTime: string }
    >();
    for (const row of assignedRes.rows) {
      assignedByShowDate.set(row.show_date_id, {
        shiftId: row.shift_id,
        role: row.role,
        arriveTime: row.arrive_time,
        departTime: row.depart_time,
      });
    }

    const distinctRoles = new Set<string>();
    for (const shift of availableShiftsRes.rows) {
      distinctRoles.add(shift.role);
    }

    const wizardData = {
      volunteer: {
        id: volunteerRes.rows[0].id,
        name: volunteerRes.rows[0].name,
        email: volunteerRes.rows[0].email ?? undefined,
      },
      show: {
        id: showRes.rows[0].id,
        name: showRes.rows[0].name,
      },
      roles: Array.from(distinctRoles).sort((a, b) => a.localeCompare(b)),
      performances: showDatesRes.rows.map((row) => ({
        showDateId: row.id,
        startTime: row.start_time,
        endTime: row.end_time,
        availableShifts: availableByShowDate.get(row.id) ?? [],
        existingAssignment: assignedByShowDate.get(row.id) ?? null,
      })),
      timezone: "Australia/Adelaide",
    };

    const html = await render("views/wizard.html", {
      volunteerName: volunteerRes.rows[0].name,
      showName: showRes.rows[0].name,
      volunteerId,
      volunteerIdJson: JSON.stringify(volunteerId),
      showId,
      showIdJson: JSON.stringify(showId),
      wizardDataJson: JSON.stringify(wizardData),
    });

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
          shiftId,
        };
        return;
      }

      const showDateId = shiftResult.rows[0].show_date_id;

      // Check if volunteer already has a shift for this show_date_id
      const existingShift = await client.queryObject<{
        shift_id: number;
        role: string;
      }>(
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
            role: existingShift.rows[0].role,
          },
          performance: performanceResult.rows[0],
          requestedShiftId: shiftId,
        };
        return;
      }
    }

    // If no conflicts, insert all shifts
    for (const shiftId of shiftIds) {
      await client.queryObject(
        "INSERT INTO participant_shifts (participant_id, shift_id) VALUES ($1, $2)",
        [id, shiftId]
      );
    }

    await client.queryObject("COMMIT");
    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      message: `Successfully signed up for ${shiftIds.length} shift(s)`,
    };
  } catch (error) {
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function submitWizard(ctx: RouterContext<string>) {
  const volunteerId = ctx.params.id;
  const body = await ctx.request.body.json();
  const { showId, selections } = body as {
    showId?: number;
    selections?: Array<{ showDateId: number; shiftId: number }>;
  };

  if (
    !volunteerId ||
    typeof showId !== "number" ||
    !Array.isArray(selections)
  ) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid request payload" };
    return;
  }

  const pool = getPool();
  const client = await pool.connect();

  const assigned: Array<{
    shiftId: number;
    showDateId: number;
    role: string;
    arriveTime: string;
    departTime: string;
  }> = [];
  const conflicts: Array<{
    shiftId: number;
    showDateId: number;
    reason: "invalid_shift" | "show_mismatch" | "already_assigned" | "taken";
    details?: string;
  }> = [];
  const conflictShowDateIds = new Set<number>();
  let inTransaction = false;

  try {
    const volunteerRes = await client.queryObject<{
      id: string;
      name: string;
      email: string | null;
    }>("SELECT id, name, email FROM participants WHERE id = $1", [volunteerId]);

    if (volunteerRes.rows.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Volunteer not found" };
      return;
    }

    const showRes = await client.queryObject<{ id: number; name: string }>(
      "SELECT id, name FROM shows WHERE id = $1",
      [showId]
    );

    if (showRes.rows.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Show not found" };
      return;
    }

    await client.queryObject("BEGIN");
    inTransaction = true;

    for (const selection of selections) {
      const shiftId = selection.shiftId;
      const showDateId = selection.showDateId;

      try {
        const shiftRes = await client.queryObject<{
          id: number;
          show_date_id: number;
          role: string;
          show_id: number;
          arrive_time: string;
          depart_time: string;
        }>(
          `SELECT s.id,
                  s.show_date_id,
                  s.role,
                  sd.show_id,
                  TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') AS arrive_time,
                  TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') AS depart_time
             FROM shifts s
             JOIN show_dates sd ON sd.id = s.show_date_id
            WHERE s.id = $1`,
          [shiftId]
        );

        if (shiftRes.rows.length === 0) {
          conflicts.push({ shiftId, showDateId, reason: "invalid_shift" });
          conflictShowDateIds.add(showDateId);
          continue;
        }

        const shiftData = shiftRes.rows[0];

        if (shiftData.show_id !== showId) {
          conflicts.push({ shiftId, showDateId, reason: "show_mismatch" });
          conflictShowDateIds.add(shiftData.show_date_id);
          continue;
        }

        if (shiftData.show_date_id !== showDateId) {
          conflicts.push({
            shiftId,
            showDateId,
            reason: "invalid_shift",
            details: "Shift does not belong to the selected performance",
          });
          conflictShowDateIds.add(shiftData.show_date_id);
          continue;
        }

        const existingForPerformance = await client.queryObject<{
          shift_id: number;
          role: string;
        }>(
          `SELECT s.id AS shift_id, s.role
             FROM participant_shifts ps
             JOIN shifts s ON s.id = ps.shift_id
            WHERE ps.participant_id = $1
              AND s.show_date_id = $2
            LIMIT 1`,
          [volunteerId, shiftData.show_date_id]
        );

        if (existingForPerformance.rows.length > 0) {
          conflicts.push({ shiftId, showDateId, reason: "already_assigned" });
          conflictShowDateIds.add(shiftData.show_date_id);
          continue;
        }

        const shiftTakenRes = await client.queryObject<{
          participant_id: string;
        }>(
          "SELECT participant_id FROM participant_shifts WHERE shift_id = $1 LIMIT 1",
          [shiftId]
        );

        if (shiftTakenRes.rows.length > 0) {
          conflicts.push({ shiftId, showDateId, reason: "taken" });
          conflictShowDateIds.add(shiftData.show_date_id);
          continue;
        }

        const insertRes = await client.queryObject<{ shift_id: number }>(
          "INSERT INTO participant_shifts (participant_id, shift_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING shift_id",
          [volunteerId, shiftId]
        );

        if (insertRes.rows.length === 0) {
          conflicts.push({ shiftId, showDateId, reason: "taken" });
          conflictShowDateIds.add(shiftData.show_date_id);
          continue;
        }

        assigned.push({
          shiftId,
          showDateId: shiftData.show_date_id,
          role: shiftData.role,
          arriveTime: shiftData.arrive_time,
          departTime: shiftData.depart_time,
        });
      } catch (error) {
        console.error(`Error processing shift ${selection.shiftId}:`, error);
        conflicts.push({
          shiftId: selection.shiftId,
          showDateId: selection.showDateId,
          reason: "invalid_shift",
        });
        conflictShowDateIds.add(selection.showDateId);
      }
    }

    await client.queryObject("COMMIT");
    inTransaction = false;

    const assignedForShow = await client.queryObject<{
      shift_id: number;
      show_date_id: number;
      role: string;
      arrive_time: string;
      depart_time: string;
      start_time: string;
      end_time: string;
    }>(
      `SELECT s.id AS shift_id,
              s.show_date_id,
              s.role,
              TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') AS arrive_time,
              TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') AS depart_time,
              TO_CHAR(sd.start_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') AS start_time,
              TO_CHAR(sd.end_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') AS end_time
         FROM participant_shifts ps
         JOIN shifts s ON s.id = ps.shift_id
         JOIN show_dates sd ON sd.id = s.show_date_id
        WHERE ps.participant_id = $1
          AND sd.show_id = $2
        ORDER BY sd.start_time, s.arrive_time`,
      [volunteerId, showId]
    );

    const conflictFallback =
      conflictShowDateIds.size > 0
        ? await client.queryObject<{
            show_date_id: number;
            shift_id: number;
            role: string;
            arrive_time: string;
            depart_time: string;
            start_time: string;
            end_time: string;
          }>(
            `SELECT s.show_date_id,
                s.id AS shift_id,
                s.role,
                TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') AS arrive_time,
                TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') AS depart_time,
                TO_CHAR(sd.start_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') AS start_time,
                TO_CHAR(sd.end_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') AS end_time
           FROM shifts s
           JOIN show_dates sd ON sd.id = s.show_date_id
           LEFT JOIN participant_shifts ps ON ps.shift_id = s.id
          WHERE s.show_date_id = ANY($1::int[])
            AND ps.shift_id IS NULL
          ORDER BY sd.start_time, s.arrive_time`,
            [Array.from(conflictShowDateIds)]
          )
        : { rows: [] };

    const fallbackByShowDate = new Map<
      number,
      Array<{
        shiftId: number;
        role: string;
        arriveTime: string;
        departTime: string;
        startTime: string;
        endTime: string;
      }>
    >();

    for (const row of conflictFallback.rows) {
      if (!fallbackByShowDate.has(row.show_date_id)) {
        fallbackByShowDate.set(row.show_date_id, []);
      }
      fallbackByShowDate.get(row.show_date_id)!.push({
        shiftId: row.shift_id,
        role: row.role,
        arriveTime: row.arrive_time,
        departTime: row.depart_time,
        startTime: row.start_time,
        endTime: row.end_time,
      });
    }

    if (assignedForShow.rows.length > 0 && volunteerRes.rows[0].email) {
      try {
        const { generateVolunteerPDFData } = await import(
          "../utils/pdf-generator.ts"
        );
        const { generateServerSidePDF } = await import(
          "../utils/server-pdf-generator.ts"
        );
        const {
          sendWizardConfirmationEmail,
          createVolunteerLoginUrl,
          createTheatreContactInfo,
        } = await import("../utils/email.ts");

        const pdfData = await generateVolunteerPDFData(volunteerId);
        const pdfBuffer = await generateServerSidePDF(pdfData);
        const filename = `wizard-confirmation-${pdfData.volunteer.name.replace(
          /[^a-zA-Z0-9]/g,
          "-"
        )}-${new Date().toISOString().split("T")[0]}.pdf`;

        const emailShifts = assignedForShow.rows.map((row) => {
          const startDate = new Date(row.start_time);
          const dateLabel = startDate.toLocaleDateString("en-AU", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
          const arriveLabel = new Date(row.arrive_time).toLocaleTimeString(
            "en-AU",
            {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }
          );
          const departLabel = new Date(row.depart_time).toLocaleTimeString(
            "en-AU",
            {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }
          );

          const arriveDate = new Date(row.arrive_time);
          const departDate = new Date(row.depart_time);
          const crossesDay =
            arriveDate.getDate() !== departDate.getDate() ||
            arriveDate.getMonth() !== departDate.getMonth() ||
            arriveDate.getFullYear() !== departDate.getFullYear();

          return {
            date: dateLabel,
            startTime: arriveLabel,
            endTime: `${departLabel}${crossesDay ? " (+1 day)" : ""}`,
            role: row.role,
          };
        });

        const baseUrl = Deno.env.get("BASE_URL") || ctx.request.url.origin;
        const wizardUrl = `${createVolunteerLoginUrl(
          baseUrl,
          volunteerId
        )}/wizard?showId=${showId}`;

        await sendWizardConfirmationEmail(
          {
            volunteerName: volunteerRes.rows[0].name,
            volunteerEmail: volunteerRes.rows[0].email,
            loginUrl: wizardUrl,
            showName: showRes.rows[0].name,
            selectedShifts: emailShifts,
            contactInfo: createTheatreContactInfo(),
          },
          {
            content: pdfBuffer,
            filename,
          }
        );
      } catch (emailError) {
        console.error("Failed to send wizard confirmation email:", emailError);
      }
    }

    ctx.response.status = conflicts.length === 0 ? 201 : 207;
    ctx.response.body = {
      success: conflicts.length === 0,
      assigned,
      conflicts,
      fallbackOptions: Array.from(fallbackByShowDate.entries()).map(
        ([showDateId, shifts]) => ({
          showDateId,
          shifts,
        })
      ),
      assignedForShow: assignedForShow.rows,
    };
  } catch (error) {
    if (inTransaction) {
      try {
        await client.queryObject("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }
    console.error("Wizard submission failed:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to save wizard selections" };
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
  const { oldShiftId, newShiftId } = body as {
    oldShiftId: string;
    newShiftId: string;
  };
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
    ctx.response.body = {
      success: true,
      message: "Shift swapped successfully",
    };
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
    const { generateVolunteerPDFData } = await import(
      "../utils/pdf-generator.ts"
    );
    const { generateServerSidePDF } = await import(
      "../utils/server-pdf-generator.ts"
    );

    const pdfData = await generateVolunteerPDFData(id);
    const pdfBuffer = await generateServerSidePDF(pdfData);

    const filename = `theatre-shifts-${pdfData.volunteer.name.replace(
      /[^a-zA-Z0-9]/g,
      "-"
    )}-${new Date().toISOString().split("T")[0]}.pdf`;

    ctx.response.headers.set("Content-Type", "application/pdf");
    ctx.response.headers.set(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
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
    const { generateVolunteerPDFData } = await import(
      "../utils/pdf-generator.ts"
    );
    const { generateServerSidePDF } = await import(
      "../utils/server-pdf-generator.ts"
    );

    const pdfData = await generateVolunteerPDFData(id);
    const pdfBuffer = await generateServerSidePDF(pdfData);

    const filename = `theatre-shifts-${pdfData.volunteer.name.replace(
      /[^a-zA-Z0-9]/g,
      "-"
    )}-${new Date().toISOString().split("T")[0]}.pdf`;

    ctx.response.headers.set("Content-Type", "application/pdf");
    ctx.response.headers.set(
      "Content-Disposition",
      `inline; filename="${filename}"`
    );
    ctx.response.body = pdfBuffer;
  } catch (error) {
    console.error("Error generating volunteer schedule PDF:", error);
    ctx.response.status = 500;
    ctx.response.body = "Failed to generate PDF";
  }
}
