# PDF Generation and Email System

This document describes the comprehensive PDF generation and email system implemented for Theatre Shifts volunteer management.

## Overview

The system provides multiple ways to generate and distribute volunteer schedules:

1. **Admin-initiated email** - Send PDF schedules to volunteers via email
2. **Direct PDF download** - Volunteers can download their own schedules  
3. **Client-side PDF generation** - Rich PDF with calendars (existing functionality)
4. **Server-side PDF generation** - Simple text-based PDF for quick access

## Features

### For Administrators
- **Send PDF Button**: Email a volunteer's schedule PDF directly from the admin volunteers page
- **Email Validation**: Button is disabled for volunteers without email addresses
- **Success Feedback**: Shows shift count and confirmation when email is sent
- **Error Handling**: Clear error messages for failed sends or missing volunteers

### For Volunteers
- **Quick Download**: Server-side PDF generation for instant download
- **Enhanced PDF**: Existing client-side PDF with calendars and full features
- **No Email Required**: Direct download works without email configuration

### Email Features
- **Professional Template**: Theatre-themed email design matching existing login emails
- **Smart Content**: Shows upcoming shifts in email preview (up to 5 shifts)
- **PDF Attachment**: Schedule attached as downloadable file
- **Login Link**: Direct link to online schedule for updates

## Files Modified

### New Files
- `src/views/email/volunteer-schedule-email.html` - Email template
- `test-pdf-system.ts` - Test script
- `PDF_SYSTEM_IMPLEMENTATION.md` - This documentation

### Updated Files
- `src/utils/pdf-generator.ts` - Enhanced with schedule generation
- `src/utils/email.ts` - Added schedule email functionality
- `src/controllers/admin.ts` - Added PDF download/email endpoints
- `src/controllers/volunteer.ts` - Added schedule PDF download
- `src/routes/admin.ts` - Added new admin routes
- `src/routes/volunteer.ts` - Added volunteer PDF route
- `src/views/admin/templates/volunteers-template.ts` - Added "Send PDF" button
- `views/signup.html` - Added "Quick Download" button

## API Endpoints

### Admin Endpoints (Protected)
- `GET /admin/api/volunteers/:id/schedule-pdf` - Download PDF directly
- `POST /admin/api/volunteers/:id/email-schedule-pdf` - Email PDF to volunteer

### Volunteer Endpoints (Public)
- `GET /volunteer/signup/:id/pdf` - Original PDF data (JSON)
- `GET /volunteer/signup/:id/schedule-pdf` - New server-side PDF download

## Email Integration

### Development Mode
- Emails are simulated and logged to console
- No real emails sent
- PDF attachment details shown in logs

### Production Mode
- Real emails sent via Resend
- PDF attached as downloadable file
- Email delivery confirmation logged

### Email Template Features
- Theatre Shifts branding
- Personalized greeting with volunteer name
- Upcoming shifts preview (max 5 shown)
- Call-to-action button to online schedule
- Professional footer with contact info

## User Interface

### Admin Volunteers Page
- **Send PDF Button**: Green button with email icon
- **Disabled State**: Button disabled for volunteers without email
- **Tooltip**: "No email address" shown on hover for disabled buttons
- **Confirmation Dialog**: Confirms email address before sending

### Volunteer Signup Page
- **Quick Download Button**: New button next to existing PDF button
- **Direct Link**: Server-side generation, works immediately
- **No JavaScript**: Works even with JavaScript disabled

## Testing

Run the test script to verify functionality:

```bash
deno run --allow-net --allow-read --allow-write --allow-env test-pdf-system.ts
```

Test features include:
- Mock volunteer data generation
- PDF creation and file saving
- Email template rendering
- Email sending simulation
- Error handling verification

## PDF Content

### Information Included
- Volunteer name and contact details
- Generation timestamp and URL for updates
- Assigned shifts (current month and future only)
- Formatted dates and times in Adelaide timezone
- Instructions for online access
- Contact information for questions

### File Format
- Plain text format (.txt) for broad compatibility
- Meaningful filename: `theatre-shifts-volunteer-name-YYYY-MM-DD.txt`
- Readable formatting with clear sections
- Printable layout

## Security

### Access Control
- **Volunteers**: Can download their own PDF only
- **Admins**: Can download or email any volunteer's PDF
- **Email sending**: Admin-only functionality

### Data Protection
- No sensitive data in PDF filenames
- Volunteer IDs validated before PDF generation
- Email addresses validated before sending
- Error messages don't expose sensitive information

## Usage Instructions

### For Administrators

1. **Navigate to Admin Volunteers Page**: `/admin/volunteers`

2. **Send PDF to Volunteer**:
   - Locate volunteer in the table
   - Click green "Send PDF" button
   - Confirm email address in dialog
   - Check for success/error message

3. **Download PDF Directly**: `GET /admin/api/volunteers/:id/schedule-pdf`

### For Volunteers

1. **Quick Download** (Recommended):
   - Visit your signup page
   - Click "Quick Download" button
   - PDF downloads immediately

2. **Full PDF with Calendars**:
   - Click "Download PDF" button
   - Wait for client-side generation
   - Includes visual calendars

## Configuration

### Email Setup (Production)
```bash
# Required for email sending
RESEND_API_KEY=your-resend-api-key-here
FROM_EMAIL=theatre@yourtheatre.com
FROM_NAME=Theatre Shifts

# Environment
DENO_ENV=production  # Set to 'development' for simulation
```

### Development Testing
```bash
# No configuration needed for testing
DENO_ENV=development  # Simulates emails, no real sends
```

## Error Handling

### Common Issues and Solutions

1. **"Volunteer not found"**
   - Verify volunteer ID exists in database
   - Check URL parameters

2. **"No email address"**
   - Add email to volunteer's profile
   - Use direct download instead

3. **"Failed to send email"**
   - Check Resend API key configuration
   - Verify FROM_EMAIL domain is verified
   - Check network connectivity

4. **"PDF generation failed"**
   - Check database connectivity
   - Verify volunteer has shifts data
   - Review server logs for details

## Implementation Summary

This PDF system enhances volunteer management by:

- **Reducing admin workload**: Automated email sending
- **Improving volunteer experience**: Instant PDF downloads
- **Ensuring accessibility**: Multiple download options
- **Maintaining professionalism**: Branded email templates
- **Supporting offline use**: Downloadable schedules

The implementation provides a complete PDF generation and email system that integrates seamlessly with the existing Theatre Shifts volunteer management platform while maintaining security, usability, and professional presentation standards.
