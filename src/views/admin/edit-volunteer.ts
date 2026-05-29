import type { RouterContext } from "oak";
import { getPool } from "../../models/db.ts";
import {
  type EditVolunteerPageData,
  renderEditVolunteerTemplate,
  type Volunteer,
  type VolunteerNote,
  type VolunteerShift,
} from "./templates/edit-volunteer-template.ts";

export async function showEditVolunteerForm(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.queryObject<Volunteer>(
      "SELECT id, name, email, phone, status FROM participants WHERE id=$1",
      [id],
    );

    if (result.rows.length === 0) {
      ctx.throw(404, "Volunteer not found");
    }

    const assignedShiftsResult = await client.queryObject<VolunteerShift>(
      `
      SELECT
        s.id,
        sd.show_id,
        sh.name as show_name,
        s.role,
        CASE
          WHEN s.arrive_time IS NOT NULL THEN
            TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'DD/MM/YYYY at FMHH12:MI AM')
          ELSE 'Time TBD'
        END as start_time,
        CASE
          WHEN s.depart_time IS NOT NULL THEN
            TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'DD/MM/YYYY at FMHH12:MI AM') ||
            CASE
              WHEN s.arrive_time IS NOT NULL AND (s.arrive_time AT TIME ZONE 'Australia/Adelaide')::date != (s.depart_time AT TIME ZONE 'Australia/Adelaide')::date
              THEN ' (+1 day)'
              ELSE ''
            END
          ELSE 'Time TBD'
        END as end_time,
        TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as arrive_time,
        TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as depart_time,
        sd.id as performance_id
      FROM shifts s
      JOIN participant_shifts ps ON ps.shift_id = s.id
      JOIN show_dates sd ON s.show_date_id = sd.id
      JOIN shows sh ON sd.show_id = sh.id
      WHERE ps.participant_id = $1
        AND s.depart_time >= NOW()
      ORDER BY sd.start_time, s.arrive_time
    `,
      [id],
    );

    const pastShiftsResult = await client.queryObject<VolunteerShift>(
      `
      SELECT
        s.id,
        sd.show_id,
        sh.name as show_name,
        s.role,
        CASE
          WHEN s.arrive_time IS NOT NULL THEN
            TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'DD/MM/YYYY at FMHH12:MI AM')
          ELSE 'Time TBD'
        END as start_time,
        CASE
          WHEN s.depart_time IS NOT NULL THEN
            TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'DD/MM/YYYY at FMHH12:MI AM') ||
            CASE
              WHEN s.arrive_time IS NOT NULL AND (s.arrive_time AT TIME ZONE 'Australia/Adelaide')::date != (s.depart_time AT TIME ZONE 'Australia/Adelaide')::date
              THEN ' (+1 day)'
              ELSE ''
            END
          ELSE 'Time TBD'
        END as end_time,
        TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as arrive_time,
        TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as depart_time,
        sd.id as performance_id
      FROM shifts s
      JOIN participant_shifts ps ON ps.shift_id = s.id
      JOIN show_dates sd ON s.show_date_id = sd.id
      JOIN shows sh ON sd.show_id = sh.id
      WHERE ps.participant_id = $1
        AND COALESCE(s.depart_time, sd.end_time, sd.start_time) < NOW()
      ORDER BY sd.start_time DESC, s.arrive_time DESC
    `,
      [id],
    );

    const notesResult = await client.queryObject<VolunteerNote>(
      `
      SELECT
        id,
        note,
        created_by_name,
        created_by_email,
        TO_CHAR(created_at AT TIME ZONE 'Australia/Adelaide', 'DD/MM/YYYY at FMHH12:MI AM') as created_at
      FROM participant_notes
      WHERE participant_id = $1
        AND visibility = 'internal'
      ORDER BY created_at DESC
    `,
      [id],
    );

    const data: EditVolunteerPageData = {
      volunteer: result.rows[0],
      assignedShifts: assignedShiftsResult.rows,
      pastShifts: pastShiftsResult.rows,
      notes: notesResult.rows,
    };

    ctx.response.type = "text/html";
    ctx.response.body = renderEditVolunteerTemplate(data);
  } finally {
    client.release();
  }
}
