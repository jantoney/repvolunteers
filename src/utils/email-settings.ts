import { getPool } from "../models/db.ts";
import type { ContactInfo } from "./email.ts";

export const DEFAULT_EMAIL_CONTACT_NAME = "Jay";
export const DEFAULT_EMAIL_CONTACT_PHONE = "0434 586 878";

export const DEFAULT_SHOW_WEEK_MESSAGE =
  "How exciting! We're so close to showtime and we couldn't do it without amazing volunteers like you. Your shift details are attached as a PDF for easy reference.\n\nQuick reminder: Uniform is still neat casual - black, white & navy are all perfectly fine. Any other questions, don't hesitate to contact me. Feel free to save my number in your phone just in case you're running late or something pops up.";

export const DEFAULT_LAST_MINUTE_SHIFTS_MESSAGE =
  "We understand that people get sick last minute, or have to pull out of a shift every now and then. If you can, we would love any assistance you can provide in filling a shift.";

export const DEFAULT_AVAILABILITY_REQUEST_MESSAGE =
  "Hello everyone and thank you very much for being part of our wonderful Adelaide Rep FOH volunteer team\n\nThe time has come once again to ask for your help as we prepare for our next production.\n\nGenerally, call times for all FOH volunteers would be around 60 minutes before the start of the show, just so we can have a quick intro with the team before we open the doors around 40 minutes before curtain call.\n\nAs a reminder: 2IC and ushers need to stay all night. We need you for interval and to be able to sit in to watch the show.\n\nDoor shifts are short, so you'll be free 15 minutes after audience members are in. Tea and coffee volunteers are able to leave after interval.\n\nUniform is still neat casual. Black, white and navy are all ok. Any other questions, don't hesitate to contact me. Feel free to save my number in your phone just in case you're running late or something pops up.\n\nLast one: if you no longer wish to be contacted regarding FOH volunteering, please click the button below and select remove me from the list.\n\nCan't wait to see everyone on the night";

export interface EmailDefaults {
  contactName: string;
  contactPhone: string;
  messages: {
    showWeek: string;
    lastMinuteShifts: string;
    availabilityRequest: string;
  };
}

export interface EmailSendOverrides {
  message?: string;
  contactName?: string;
  contactPhone?: string;
}

const SETTING_KEYS = {
  contactName: "email_contact_name",
  contactPhone: "email_contact_phone",
} as const;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizePhoneForTel(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return digits.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
  }
  return phone.trim();
}

export function buildContactInfo(
  contactName: string,
  contactPhone: string,
): ContactInfo {
  const name = clean(contactName) || DEFAULT_EMAIL_CONTACT_NAME;
  const displayPhone = formatPhoneForDisplay(
    clean(contactPhone) || DEFAULT_EMAIL_CONTACT_PHONE,
  );
  return {
    name,
    phone: normalizePhoneForTel(displayPhone),
    organization: "Adelaide Repertory Theatre",
    displayFormat: displayPhone,
  };
}

export async function getEmailDefaults(): Promise<EmailDefaults> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.queryObject<{ key: string; value: string }>(
      "SELECT key, value FROM app_settings WHERE key = ANY($1)",
      [[SETTING_KEYS.contactName, SETTING_KEYS.contactPhone]],
    );
    const values = new Map(result.rows.map((row) => [row.key, row.value]));
    return {
      contactName: clean(values.get(SETTING_KEYS.contactName)) ||
        DEFAULT_EMAIL_CONTACT_NAME,
      contactPhone: clean(values.get(SETTING_KEYS.contactPhone)) ||
        DEFAULT_EMAIL_CONTACT_PHONE,
      messages: {
        showWeek: DEFAULT_SHOW_WEEK_MESSAGE,
        lastMinuteShifts: DEFAULT_LAST_MINUTE_SHIFTS_MESSAGE,
        availabilityRequest: DEFAULT_AVAILABILITY_REQUEST_MESSAGE,
      },
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("app_settings")
    ) {
      return {
        contactName: DEFAULT_EMAIL_CONTACT_NAME,
        contactPhone: DEFAULT_EMAIL_CONTACT_PHONE,
        messages: {
          showWeek: DEFAULT_SHOW_WEEK_MESSAGE,
          lastMinuteShifts: DEFAULT_LAST_MINUTE_SHIFTS_MESSAGE,
          availabilityRequest: DEFAULT_AVAILABILITY_REQUEST_MESSAGE,
        },
      };
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function updateEmailContactDefaults(
  contactName: string,
  contactPhone: string,
): Promise<EmailDefaults> {
  const name = clean(contactName);
  const phone = clean(contactPhone);
  if (!name || !phone) {
    throw new Error("Contact name and phone number are required");
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.queryObject("BEGIN");
    await client.queryObject(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ($1, $2, NOW()), ($3, $4, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [SETTING_KEYS.contactName, name, SETTING_KEYS.contactPhone, phone],
    );
    await client.queryObject("COMMIT");
    return {
      contactName: name,
      contactPhone: phone,
      messages: {
        showWeek: DEFAULT_SHOW_WEEK_MESSAGE,
        lastMinuteShifts: DEFAULT_LAST_MINUTE_SHIFTS_MESSAGE,
        availabilityRequest: DEFAULT_AVAILABILITY_REQUEST_MESSAGE,
      },
    };
  } catch (error) {
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function resolveEmailOverrides(
  defaults: EmailDefaults,
  overrides: EmailSendOverrides,
): { message?: string; contactInfo: ContactInfo } {
  const contactName = clean(overrides.contactName) || defaults.contactName;
  const contactPhone = clean(overrides.contactPhone) || defaults.contactPhone;
  return {
    message: clean(overrides.message) || undefined,
    contactInfo: buildContactInfo(contactName, contactPhone),
  };
}
