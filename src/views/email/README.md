# Email Templates for RepVolunteers

This directory contains email templates and utilities for the RepVolunteers theatre shift management system, integrated with **Resend** for reliable email delivery.

## Current Templates

### Volunteer Login Email (`volunteer-login-email.html`)

A professionally designed email template that sends volunteers their personal login links. The template is based on modern email best practices and includes:

- **Professional Design**: Clean, theatre-themed layout with good typography
- **Clear Call-to-Action**: Prominent button to access shifts
- **Responsive Layout**: Works well on both desktop and mobile email clients
- **Fallback Options**: Copy-paste link for clients that don't support buttons
- **Instructions**: Clear explanation of what volunteers can do
- **Security**: HTML escaping to prevent injection attacks
- **Resend Integration**: Production-ready email sending via Resend API

## Features

- Placeholder substitution system (`{{volunteerName}}`, `{{loginUrl}}`)
- HTML escaping for security
- Professional email client compatibility
- Theatre-specific branding and messaging
- **Automatic development/production mode detection**
- **Resend API integration for reliable delivery**
- **Domain verification checking**

## Setup & Configuration

### 1. Get Resend API Key

1. Sign up at [resend.com](https://resend.com/)
2. Get your API key from the dashboard
3. Add a domain and verify it (required for sending emails)

### 2. Environment Configuration

Add these variables to your `.env` file:

```bash
# Required
RESEND_API_KEY=re_your_api_key_here

# Optional (with defaults)
FROM_EMAIL=theatre@yourdomain.com
FROM_NAME=Theatre Shifts
DENO_ENV=development  # Set to 'production' for real emails
```

### 3. Domain Verification

Before sending emails in production:

1. Add your domain in the Resend dashboard
2. Configure DNS records as instructed
3. Wait for verification (usually a few minutes)
4. Update `FROM_EMAIL` to use your verified domain

## Usage

```typescript
import { sendVolunteerLoginEmail, createVolunteerLoginUrl } from "./src/utils/email.ts";

// Send login email to a volunteer
const loginUrl = createVolunteerLoginUrl("https://yourtheatre.com", volunteerId);
const emailSent = await sendVolunteerLoginEmail({
  volunteerName: "John Doe",
  volunteerEmail: "john@example.com",
  loginUrl: loginUrl
});
```

## Testing & Development

### Test Email Template

```bash
# Test with simulation (development mode)
deno run --allow-write --allow-env --allow-net test-resend-email.ts

# Check Resend setup and domain verification
deno run --allow-env --allow-net check-resend-setup.ts
```

### Development vs Production

- **Development Mode**: Emails are simulated and logged (no real emails sent)
- **Production Mode**: Real emails sent via Resend API

Mode is automatically detected based on:

- `DENO_ENV=production` environment variable
- Presence of `RESEND_API_KEY`

## Template Structure

The email template follows a table-based layout for maximum email client compatibility:

1. **Header**: Blue theatre-themed header with emoji and title
2. **Main Content**:
   - Personalized greeting
   - Explanation text
   - Call-to-action button
   - Copy-paste link fallback
3. **Instructions**: List of what volunteers can do
4. **Footer**: Contact information and disclaimers

## Production Deployment

### Resend Integration

The system is pre-configured for Resend with:

- Automatic API connection
- Domain verification checking
- Error handling and logging
- Development/production mode switching

### Example Production Setup

```typescript
// Automatically uses Resend when configured
const emailSent = await sendVolunteerLoginEmail({
  volunteerName: volunteer.name,
  volunteerEmail: volunteer.email,
  loginUrl: createVolunteerLoginUrl(baseUrl, volunteer.id)
});

if (emailSent) {
  console.log("✅ Login email sent successfully");
} else {
  console.log("❌ Failed to send login email");
}
```

## File Structure

```text
src/
├── utils/
│   ├── email.ts              # Email utilities and template rendering
│   └── resend-config.ts      # Resend configuration and client
└── views/
    └── email/
        ├── volunteer-login-email.html  # HTML email template
        └── README.md                   # This documentation

test-resend-email.ts          # Test script with Resend integration
check-resend-setup.ts         # Setup checker and domain verification
```

## Error Handling

The system includes comprehensive error handling:

- **Missing API Key**: Falls back to development mode
- **Domain Not Verified**: Clear error messages with setup instructions
- **Network Issues**: Proper error logging and user feedback
- **Invalid Recipients**: Validation and error reporting

## Security Considerations

- All user input is HTML-escaped to prevent XSS attacks
- Email templates should be served over HTTPS
- Personal login links use secure, unpredictable IDs
- Resend API keys are kept secure in environment variables
- Domain verification prevents email spoofing

## Monitoring & Analytics

Resend provides built-in analytics:

- Email delivery status
- Open rates and click tracking
- Bounce and complaint handling
- Real-time webhook notifications

Access these through your Resend dashboard.

## Troubleshooting

### Common Issues

1. **"Domain not verified"**
   - Solution: Verify your domain in Resend dashboard
   - Check DNS records are properly configured

2. **"API key invalid"**
   - Solution: Check your API key in .env file
   - Ensure key has proper permissions

3. **"Emails not sending"**
   - Check `DENO_ENV` is set to `production`
   - Verify FROM_EMAIL uses verified domain
   - Run `check-resend-setup.ts` for diagnostics

### Debug Tools

```bash
# Check complete Resend setup
deno run --allow-env --allow-net check-resend-setup.ts

# Test email template rendering
deno run --allow-write --allow-env test-resend-email.ts
```

## Future Enhancements

- **Additional Templates**: Welcome emails, shift reminders, schedule changes
- **Multi-language Support**: Templates in different languages
- **HTML/Text Dual Format**: Plain text fallback for all emails
- **Email Analytics**: Enhanced tracking integration
- **Personalization**: Dynamic content based on volunteer preferences
- **Batch Sending**: Efficient bulk email capabilities
- **Webhook Integration**: Real-time delivery status updates
