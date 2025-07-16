import { createResendClient, getFromAddress } from './resend-config.ts';
import { recordSentEmail, CreateEmailRecord } from './email-tracking.ts';

export interface AdminPasswordResetEmailData {
  adminName: string;
  adminEmail: string;
  resetUrl: string;
}

/**
 * Renders the admin password reset email template with provided data
 */
export function renderAdminPasswordResetEmail(data: AdminPasswordResetEmailData): string {
  // Load the template as a string (in production, use a template engine or fs.readFileSync)
  // For now, inline the template and replace placeholders
  const template = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <!--$-->
  </head>
  <body style="background-color:#fff;color:#212121">
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0" data-skip-in-text="true">
      Admin Password Reset Request
      <div> ... </div>
    </div>
    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:37.5em;padding:20px;margin:0 auto;background-color:#eee">
      <tbody>
        <tr style="width:100%">
          <td>
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#fff">
              <tbody>
                <tr>
                  <td>
                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#007bff;display:flex;padding:20px 0;align-items:center;justify-content:center">
                      <tbody>
                        <tr>
                          <td style="text-align:center;">
                            <h2 style="color:#fff;margin:0;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;font-size:24px;font-weight:bold;">
                              🔒 Admin Password Reset
                            </h2>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding:25px 35px">
                      <tbody>
                        <tr>
                          <td>
                            <h1 style="color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;font-size:20px;font-weight:bold;margin-bottom:15px">
                              Hi {{adminName}},
                            </h1>
                            <p style="font-size:14px;line-height:24px;color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;margin:24px 0;margin-bottom:14px;margin-top:24px;margin-right:0;margin-left:0">
                              We received a request to reset your admin password for the Theatre Shifts system. If you did not request this, you can safely ignore this email.
                            </p>
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="display:flex;align-items:center;justify-content:center;margin:30px 0;">
                              <tbody>
                                <tr>
                                  <td>
                                    <a href="{{resetUrl}}" target="_blank" style="display:inline-block;padding:15px 30px;background-color:#007bff;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;font-size:16px;">
                                      Reset My Password
                                    </a>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <p style="font-size:14px;line-height:24px;color:#666;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;margin:20px 0;text-align:center;">
                              Or copy and paste this link:<br>
                              <span style="font-family:monospace;background:#f8f9fa;padding:8px;border-radius:4px;word-break:break-all;color:#007bff;">{{resetUrl}}</span>
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <hr style="width:100%;border:none;border-top:1px solid #eaeaea" />
                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding:25px 35px">
                      <tbody>
                        <tr>
                          <td>
                            <h3 style="color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;font-size:16px;font-weight:bold;margin-bottom:10px;">
                              Need help?
                            </h3>
                            <p style="color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;font-size:14px;line-height:24px;margin:0;">
                              If you have any questions or did not request a password reset, please contact the theatre administration immediately.
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <p style="font-size:12px;line-height:24px;color:#666;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;margin:24px 0;padding:0 20px;margin-top:24px;margin-right:0;margin-bottom:24px;margin-left:0;text-align:center;">
              This email was sent by Theatre Shifts admin system. 
              If you did not request a password reset, you can ignore this email.
            </p>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>`;

  // Replace placeholders with actual data
  return template
    .replace(/\{\{adminName\}\}/g, escapeHtml(data.adminName))
    .replace(/\{\{resetUrl\}\}/g, data.resetUrl);
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Sends an admin password reset email using Resend
 */
export async function sendAdminPasswordResetEmail(data: AdminPasswordResetEmailData, sentByUserId?: string): Promise<boolean> {
  try {
    const htmlContent = renderAdminPasswordResetEmail(data);
    const fromAddress = getFromAddress();
    const isDevelopment = Deno.env.get('DENO_ENV') === 'development' || !Deno.env.get('RESEND_API_KEY');
    
    let resendEmailId: string | undefined;
    
    if (isDevelopment) {
      console.log(`\n=== ADMIN PASSWORD RESET EMAIL (Development Mode) ===\nTo: ${data.adminEmail}\nSubject: Admin Password Reset Request\nHTML Content Length: ${htmlContent.length} characters\nReset URL: ${data.resetUrl}\n====================================\n`);
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      const resend = createResendClient();
      
      const emailResult = await resend.emails.send({
        from: fromAddress,
        to: [data.adminEmail],
        subject: 'Admin Password Reset Request',
        html: htmlContent,
      });
      
      resendEmailId = emailResult.data?.id;
      console.log(`✅ Admin password reset email sent via Resend. ID: ${resendEmailId}`);
    }

    // Record the email in our tracking system
    try {
      const emailRecord: CreateEmailRecord = {
        to_email: data.adminEmail,
        from_email: fromAddress,
        subject: 'Admin Password Reset Request',
        email_type: 'admin_password_reset',
        html_content: htmlContent,
        sent_by_user_id: sentByUserId,
        resend_email_id: resendEmailId,
        delivery_status: isDevelopment ? 'simulated' : 'sent'
      };
      
      await recordSentEmail(emailRecord);
      console.log('📧 Admin password reset email recorded in tracking system');
      
    } catch (trackingError) {
      console.error('⚠️ Failed to record admin email in tracking system:', trackingError);
      // Don't fail the email send if tracking fails
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to send admin password reset email:', error);
    return false;
  }
}
