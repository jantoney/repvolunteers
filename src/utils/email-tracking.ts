import { getPool } from "../models/db.ts";

export interface EmailRecord {
  id: number;
  to_email: string;
  to_participant_id: string | null;
  to_user_id: string | null;
  from_email: string;
  subject: string;
  email_type: string;
  html_content: string;
  sent_at: Date;
  sent_by_user_id: string | null;
  resend_email_id: string | null;
  delivery_status: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  id: number;
  sent_email_id: number;
  filename: string;
  content_type: string;
  file_size: number;
  file_data: Uint8Array;
  created_at: Date;
}

export interface CreateEmailRecord {
  to_email: string;
  to_participant_id?: string;
  to_user_id?: string;
  from_email: string;
  subject: string;
  email_type: string;
  html_content: string;
  sent_by_user_id?: string;
  resend_email_id?: string;
  delivery_status?: string;
}

export interface CreateEmailAttachment {
  filename: string;
  content_type?: string;
  file_data: Uint8Array;
}

/**
 * Records an email that was sent, including any attachments
 */
export async function recordSentEmail(
  emailData: CreateEmailRecord, 
  attachments?: CreateEmailAttachment[]
): Promise<number> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.queryObject("BEGIN");
    
    // Insert the email record
    const emailResult = await client.queryObject<{ id: number }>(
      `INSERT INTO sent_emails (
        to_email, to_participant_id, to_user_id, from_email, 
        subject, email_type, html_content, sent_by_user_id, 
        resend_email_id, delivery_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING id`,
      [
        emailData.to_email,
        emailData.to_participant_id || null,
        emailData.to_user_id || null,
        emailData.from_email,
        emailData.subject,
        emailData.email_type,
        emailData.html_content,
        emailData.sent_by_user_id || null,
        emailData.resend_email_id || null,
        emailData.delivery_status || 'sent'
      ]
    );
    
    const emailId = emailResult.rows[0].id;
    
    // Insert attachments if any
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        await client.queryObject(
          `INSERT INTO email_attachments (
            sent_email_id, filename, content_type, file_size, file_data
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            emailId,
            attachment.filename,
            attachment.content_type || 'application/pdf',
            attachment.file_data.length,
            attachment.file_data
          ]
        );
      }
    }
    
    await client.queryObject("COMMIT");
    return emailId;
    
  } catch (error) {
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Gets all emails sent to a specific participant
 */
export async function getEmailsForParticipant(participantId: string): Promise<EmailRecord[]> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const result = await client.queryObject<EmailRecord>(
      `SELECT 
        id, to_email, to_participant_id, to_user_id, from_email, 
        subject, email_type, html_content, sent_at, sent_by_user_id, 
        resend_email_id, delivery_status
      FROM sent_emails 
      WHERE to_participant_id = $1 
      ORDER BY sent_at DESC`,
      [participantId]
    );
    
    // Get attachments for each email
    const emails = result.rows;
    for (const email of emails) {
      const attachmentResult = await client.queryObject<EmailAttachment>(
        `SELECT id, sent_email_id, filename, content_type, file_size, file_data, created_at
        FROM email_attachments 
        WHERE sent_email_id = $1`,
        [email.id]
      );
      email.attachments = attachmentResult.rows;
    }
    
    return emails;
    
  } finally {
    client.release();
  }
}

/**
 * Gets all emails sent to a specific user
 */
export async function getEmailsForUser(userId: string): Promise<EmailRecord[]> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const result = await client.queryObject<EmailRecord>(
      `SELECT 
        id, to_email, to_participant_id, to_user_id, from_email, 
        subject, email_type, html_content, sent_at, sent_by_user_id, 
        resend_email_id, delivery_status
      FROM sent_emails 
      WHERE to_user_id = $1 
      ORDER BY sent_at DESC`,
      [userId]
    );
    
    return result.rows;
    
  } finally {
    client.release();
  }
}

/**
 * Gets a specific email attachment
 */
export async function getEmailAttachment(attachmentId: number): Promise<EmailAttachment | null> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const result = await client.queryObject<EmailAttachment>(
      `SELECT id, sent_email_id, filename, content_type, file_size, file_data, created_at
      FROM email_attachments 
      WHERE id = $1`,
      [attachmentId]
    );
    
    return result.rows[0] || null;
    
  } finally {
    client.release();
  }
}

/**
 * Updates the delivery status of an email (for webhook integration)
 */
export async function updateEmailDeliveryStatus(
  emailId: number, 
  status: string
): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.queryObject(
      `UPDATE sent_emails SET delivery_status = $1 WHERE id = $2`,
      [status, emailId]
    );
  } finally {
    client.release();
  }
}
