import { getPool } from "../models/db.ts";

export interface VolunteerUnavailablePerformance {
  id: number;
  show_name: string;
  date: string;
  start_time: string;
  end_time: string;
  label: string;
}

function formatPerformanceLabel(
  row: Omit<VolunteerUnavailablePerformance, "label">,
): string {
  return `${row.show_name} - ${row.date} ${row.start_time}-${row.end_time}`;
}

export function normalizeUnavailablePerformanceIds(value: unknown): number[] {
  if (!Array.isArray(value)) {
    throw new Error("Unavailable performances must be an array");
  }

  const performanceIds = value.map((id) => {
    const parsed = typeof id === "number" ? id : Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error("Unavailable performances must be valid performance IDs");
    }
    return parsed;
  });

  return [...new Set(performanceIds)].sort((a, b) => a - b);
}

export async function getVolunteerUnavailablePerformances(
  volunteerId: string,
): Promise<VolunteerUnavailablePerformance[]> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.queryObject<
      Omit<VolunteerUnavailablePerformance, "label">
    >(
      `SELECT sd.id,
              sh.name as show_name,
              TO_CHAR(sd.start_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD') as date,
              TO_CHAR(sd.start_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as start_time,
              TO_CHAR(sd.end_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as end_time
       FROM volunteer_unavailable_performances vup
       JOIN show_dates sd ON sd.id = vup.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       WHERE vup.participant_id = $1
       ORDER BY sd.start_time, sh.name`,
      [volunteerId],
    );

    return result.rows.map((row) => ({
      ...row,
      label: formatPerformanceLabel(row),
    }));
  } finally {
    client.release();
  }
}

export async function getFuturePerformanceOptions(): Promise<
  VolunteerUnavailablePerformance[]
> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.queryObject<
      Omit<VolunteerUnavailablePerformance, "label">
    >(
      `SELECT sd.id,
              sh.name as show_name,
              TO_CHAR(sd.start_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD') as date,
              TO_CHAR(sd.start_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as start_time,
              TO_CHAR(sd.end_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as end_time
       FROM show_dates sd
       JOIN shows sh ON sh.id = sd.show_id
       WHERE sd.end_time >= NOW() - INTERVAL '3 hours'
       ORDER BY sd.start_time, sh.name`,
    );

    return result.rows.map((row) => ({
      ...row,
      label: formatPerformanceLabel(row),
    }));
  } finally {
    client.release();
  }
}

export async function setVolunteerUnavailablePerformances(
  volunteerId: string,
  performanceIds: number[],
): Promise<void> {
  const normalizedPerformanceIds =
    normalizeUnavailablePerformanceIds(performanceIds);
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.queryObject("BEGIN");
    await client.queryObject(
      "DELETE FROM volunteer_unavailable_performances WHERE participant_id = $1",
      [volunteerId],
    );

    for (const performanceId of normalizedPerformanceIds) {
      await client.queryObject(
        `INSERT INTO volunteer_unavailable_performances (participant_id, show_date_id)
         SELECT $1, sd.id
         FROM show_dates sd
         WHERE sd.id = $2
         ON CONFLICT DO NOTHING`,
        [volunteerId, performanceId],
      );
    }

    await client.queryObject("COMMIT");
  } catch (error) {
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
