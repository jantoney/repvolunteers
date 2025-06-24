#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write

import { renderVolunteerLoginEmail, sendVolunteerLoginEmail, createVolunteerLoginUrl, type VolunteerEmailData } from "./src/utils/email.ts";

/**
 * Test script to demonstrate the volunteer login email template
 */
async function testEmailTemplate() {
  console.log("🎭 Testing Volunteer Login Email Template\n");

  // Sample data for testing
  const sampleData: VolunteerEmailData = {
    volunteerName: "Sarah Johnson",
    volunteerEmail: "jaya@adelaiderep.com",
    loginUrl: createVolunteerLoginUrl("https://yourtheatre.com", 123)
  };

  console.log("Sample volunteer data:");
  console.log(`Name: ${sampleData.volunteerName}`);
  console.log(`Email: ${sampleData.volunteerEmail}`);
  console.log(`Login URL: ${sampleData.loginUrl}\n`);

  // Test HTML rendering
  console.log("Rendering HTML template...");
  const htmlContent = renderVolunteerLoginEmail(sampleData);
  
  // Write the HTML to a file for preview
  const outputFile = "volunteer-email-preview.html";
  try {
    await Deno.writeTextFile(outputFile, htmlContent);
    console.log(`✅ HTML template saved to: ${outputFile}`);
    console.log(`   Open this file in a browser to preview the email`);
  } catch (error) {
    console.log(`❌ Failed to write HTML file: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Test email sending (simulated)
  console.log("\nTesting email sending...");
  const emailSent = await sendVolunteerLoginEmail(sampleData);
  
  if (emailSent) {
    console.log("✅ Email sending simulation completed successfully");
  } else {
    console.log("❌ Email sending simulation failed");
  }

  console.log("\n🎯 Template Features:");
  console.log("✓ Professional theatre-themed design");
  console.log("✓ Clear call-to-action button");
  console.log("✓ Responsive email layout");
  console.log("✓ Copy-paste link fallback");
  console.log("✓ Instructions for volunteers");
  console.log("✓ HTML escaping for security");

  console.log("\n📧 Next Steps for Production:");
  console.log("1. Integrate with email service (SendGrid, AWS SES, etc.)");
  console.log("2. Add email configuration settings");
  console.log("3. Replace simulation with actual email sending");
  console.log("4. Add email templates for other notifications");
  console.log("5. Consider HTML/text dual format");
}

// Run the test
if (import.meta.main) {
  await testEmailTemplate();
}
