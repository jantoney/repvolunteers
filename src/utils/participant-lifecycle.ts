import { getPool } from "../models/db.ts";

export const VOLUNTEER_OPT_OUT_NOTE = "Opted out of volunteering in the future";

interface MarkInactiveOptions {
  note?: string;
  createdByUserId?: string | null;
  createdByName?: string | null;
  createdByEmail?: string | null;
}

export interface MarkInactiveResult {
  removedParticipantShiftCount: number;
  removedDirectAssignmentCount: number;
}

export async function addInternalParticipantNote(
  participantId: string,
  note: string,
  options: Omit<MarkInactiveOptions, "note"> = {},
): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.queryObject(
      `INSERT INTO participant_notes (
         participant_id,
         note,
         visibility,
         created_by_user_id,
         created_by_name,
         created_by_email
       ) VALUES ($1, $2, 'internal', $3, $4, $5)`,
      [
        participantId,
        note,
        options.createdByUserId ?? null,
        options.createdByName ?? null,
        options.createdByEmail ?? null,
      ],
    );
  } finally {
    client.release();
  }
}

export async function markParticipantActive(
  participantId: string,
  options: MarkInactiveOptions = {},
): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.queryObject("BEGIN");

    const participantResult = await client.queryObject<{ id: string }>(
      "SELECT id FROM participants WHERE id = $1 FOR UPDATE",
      [participantId],
    );

    if (participantResult.rows.length === 0) {
      await client.queryObject("ROLLBACK");
      throw new Error("Volunteer not found");
    }

    await client.queryObject(
      "UPDATE participants SET status = 'active', approved = true WHERE id = $1",
      [participantId],
    );

    await client.queryObject(
      `INSERT INTO participant_notes (
         participant_id,
         note,
         visibility,
         created_by_user_id,
         created_by_name,
         created_by_email
       ) VALUES ($1, $2, 'internal', $3, $4, $5)`,
      [
        participantId,
        options.note ?? "Re-activated volunteer account",
        options.createdByUserId ?? null,
        options.createdByName ?? null,
        options.createdByEmail ?? null,
      ],
    );

    await client.queryObject("COMMIT");
  } catch (error) {
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function markParticipantInactive(
  participantId: string,
  options: MarkInactiveOptions = {},
): Promise<MarkInactiveResult> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.queryObject("BEGIN");

    const participantResult = await client.queryObject<{ id: string }>(
      "SELECT id FROM participants WHERE id = $1 FOR UPDATE",
      [participantId],
    );

    if (participantResult.rows.length === 0) {
      await client.queryObject("ROLLBACK");
      throw new Error("Volunteer not found");
    }

    await client.queryObject(
      "UPDATE participants SET status = 'inactive', approved = false WHERE id = $1",
      [participantId],
    );

    const removedParticipantShifts = await client.queryObject<
      { shift_id: number }
    >(
      `DELETE FROM participant_shifts ps
       USING shifts s
       WHERE ps.shift_id = s.id
         AND ps.participant_id = $1
         AND s.depart_time >= NOW() - INTERVAL '3 hours'
       RETURNING ps.shift_id`,
      [participantId],
    );

    const removedDirectAssignments = await client.queryObject<{ id: number }>(
      `UPDATE shifts
       SET assigned_participant_id = NULL
       WHERE assigned_participant_id = $1
         AND depart_time >= NOW() - INTERVAL '3 hours'
       RETURNING id`,
      [participantId],
    );

    await client.queryObject(
      `INSERT INTO participant_notes (
         participant_id,
         note,
         visibility,
         created_by_user_id,
         created_by_name,
         created_by_email
       ) VALUES ($1, $2, 'internal', $3, $4, $5)`,
      [
        participantId,
        options.note ?? VOLUNTEER_OPT_OUT_NOTE,
        options.createdByUserId ?? null,
        options.createdByName ?? null,
        options.createdByEmail ?? null,
      ],
    );

    await client.queryObject("COMMIT");

    return {
      removedParticipantShiftCount: removedParticipantShifts.rows.length,
      removedDirectAssignmentCount: removedDirectAssignments.rows.length,
    };
  } catch (error) {
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
