import { Resend } from 'resend';

export interface EmailConfig {
  resendApiKey: string;
  fromEmail: string;
  fromName?: string;
}

/**
 * Gets email configuration from environment variables
 */
export function getEmailConfig(): EmailConfig {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('FROM_EMAIL') || 'theatre@yourtheatre.com';
  const fromName = Deno.env.get('FROM_NAME') || 'Theatre Shifts';

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY environment variable is required');
  }

  return {
    resendApiKey,
    fromEmail,
    fromName
  };
}

/**
 * Creates and configures a Resend client
 */
export function createResendClient(): Resend {
  const config = getEmailConfig();
  return new Resend(config.resendApiKey);
}

/**
 * Gets the from address in the format "Name <email@domain.com>"
 */
export function getFromAddress(): string {
  const config = getEmailConfig();
  return config.fromName 
    ? `${config.fromName} <${config.fromEmail}>`
    : config.fromEmail;
}
