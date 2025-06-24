# Resend Email Integration Setup

The Theatre Shifts application now uses Resend for sending volunteer login emails with a beautiful HTML template.

## Environment Variables Required

Add these environment variables to your `.env` file (or set them in your hosting environment):

```bash
# Required for email sending
RESEND_API_KEY=your-resend-api-key-here
FROM_EMAIL=theatre@yourtheatre.com
FROM_NAME=Theatre Shifts

# Environment setting
DENO_ENV=production  # Set to 'development' to see email logs instead of sending
```

## Getting Started with Resend

1. **Sign up for Resend**: Go to [resend.com](https://resend.com) and create an account
2. **Get your API key**: In the Resend dashboard, create a new API key
3. **Add your domain** (for production): Add and verify your domain in Resend
4. **Update environment variables**: Set the required environment variables

## Development Mode

When `DENO_ENV=development` or `RESEND_API_KEY` is not set, the system will:

- Log email details to console instead of sending
- Show what would be sent (recipient, subject, content length, login URL)
- Return success without actually sending emails

## Production Mode

When `DENO_ENV=production` and `RESEND_API_KEY` is set, the system will:

- Send actual emails via Resend
- Log successful sends with email IDs
- Handle errors gracefully and return appropriate error messages

## Email Template

The system now uses a beautiful HTML email template that includes:

- Theatre Shifts branding with emoji 🎭
- Personal greeting with volunteer name
- Large "Access My Shifts" button
- Copy-paste link option
- Feature list (what volunteers can do)
- Professional styling with responsive design
- Theatre administration contact information

## Testing

To test the email functionality:

1. **Development testing**:
   - Set `DENO_ENV=development`
   - Use the "Login to your account" button on the homepage
   - Check console logs for email details

2. **Production testing**:
   - Set `DENO_ENV=production` and valid `RESEND_API_KEY`
   - Use the "Login to your account" button
   - Check that emails are delivered to volunteer inboxes

## Features

- ✅ **User validation**: Only sends emails to approved users in the system
- ✅ **Error handling**: Clear error messages for not found vs send failures  
- ✅ **Beautiful template**: Professional HTML email design
- ✅ **Resend integration**: Modern email delivery service
- ✅ **Development mode**: Test without sending real emails
- ✅ **Security**: HTML escaping to prevent injection attacks

## Troubleshooting

- **Email not sending**: Check `RESEND_API_KEY` is valid and environment is set to 'production'
- **"Email not found" error**: User must be in the `participants` table with `approved = true`
  - Check the admin panel under "Manage Participants" to toggle login access
  - Use the participant check script: `deno run -A check-participant.ts`
- **Template not rendering**: Check that all placeholders are properly replaced

### Example Issue Resolution

If a participant exists but can't receive login emails:

1. Run: `deno run -A check-participant.ts` to verify their status
2. If `approved: false`, go to Admin Panel → Manage Participants  
3. Toggle the "Login Enabled" switch for that participant
4. The login email feature will now work for them

The system is now ready to send beautiful, professional emails to volunteers with their personal login links!
