import { getAuthPool } from "../models/db.ts";

const MICROSOFT_PROVIDER_ID = "microsoft";

type MicrosoftAccountRow = {
  id_token: string | null;
};

export type MicrosoftAdminAccess = {
  isAdmin: boolean;
  hasMicrosoftAccount: boolean;
};

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - normalized.length % 4) % 4),
    "=",
  );
  return atob(padded);
}

function decodeJwtPayload(idToken: string): Record<string, unknown> | null {
  const parts = idToken.split(".");
  if (parts.length < 2) return null;

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getMicrosoftAdminGroupId(): string | undefined {
  return Deno.env.get("MICROSOFT_ADMIN_GROUP_ID")?.trim() || undefined;
}

export function getMicrosoftGroupsFromIdToken(
  idToken: string | null,
): string[] {
  if (!idToken) return [];

  const payload = decodeJwtPayload(idToken);
  const groups = payload?.groups;
  if (!Array.isArray(groups)) return [];

  return groups.filter((group): group is string => typeof group === "string");
}

export function hasMicrosoftAdminGroup(idToken: string | null): boolean {
  const adminGroupId = getMicrosoftAdminGroupId();
  if (!adminGroupId) return false;

  return getMicrosoftGroupsFromIdToken(idToken).some((groupId) =>
    groupId.toLowerCase() === adminGroupId.toLowerCase()
  );
}

export async function getMicrosoftAdminAccessForUser(
  userId: string,
): Promise<MicrosoftAdminAccess> {
  const pool = getAuthPool();
  const result = await pool.query<MicrosoftAccountRow>(
    `SELECT id_token
       FROM account
      WHERE user_id = $1
        AND provider_id = $2
      ORDER BY updated_at DESC
      LIMIT 1`,
    [userId, MICROSOFT_PROVIDER_ID],
  );

  const account = result.rows[0];
  if (!account) {
    return { isAdmin: false, hasMicrosoftAccount: false };
  }

  return {
    isAdmin: hasMicrosoftAdminGroup(account.id_token),
    hasMicrosoftAccount: true,
  };
}
