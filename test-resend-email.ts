#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env

import { renderVolunteerLoginEmail, sendVolunteerLoginEmail, createVolunteerLoginUrl, type VolunteerEmailData } from "./src/utils/email.ts";

/**
 * Test script to demonstrate the volunteer login email template with Resend integration
 */
async function testEmailTemplate() {
  console.log("🎭 Testing Volunteer Login Email Template with Resend Integration\n");

  // Check environment configuration
  const isDevelopment = Deno.env.get('DENO_ENV') === 'development' || !Deno.env.get('RESEND_API_KEY');
  const hasResendKey = !!Deno.env.get('RESEND_API_KEY');
  
  console.log("📧 Email Configuration:");
  console.log(`Environment Mode: ${isDevelopment ? 'Development (simulation)' : 'Production (real emails)'}`);
  console.log(`Resend API Key: ${hasResendKey ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`From Email: ${Deno.env.get('FROM_EMAIL') || 'theatre@yourtheatre.com'}`);
  console.log(`From Name: ${Deno.env.get('FROM_NAME') || 'Theatre Shifts'}\n`);

  // Sample data for testing
  const sampleData: VolunteerEmailData = {
    volunteerName: "Sarah Johnson",
    volunteerEmail: "sarah.johnson@example.com", // Use a test email in development
    loginUrl: createVolunteerLoginUrl("https://yourtheatre.com", 123)
  };

  console.log("👤 Sample volunteer data:");
  console.log(`Name: ${sampleData.volunteerName}`);
  console.log(`Email: ${sampleData.volunteerEmail}`);
  console.log(`Login URL: ${sampleData.loginUrl}\n`);

  // Test HTML rendering
  console.log("🎨 Rendering HTML template...");
  const htmlContent = renderVolunteerLoginEmail(sampleData);
  
  // Write the HTML to a file for preview
  const outputFile = "volunteer-email-preview.html";
  try {
    await Deno.writeTextFile(outputFile, htmlContent);
    console.log(`✅ HTML template saved to: ${outputFile}`);
    console.log(`   Open this file in a browser to preview the email\n`);
  } catch (error) {
    console.log(`❌ Failed to write HTML file: ${error instanceof Error ? error.message : String(error)}\n`);
  }

  // Test email sending
  console.log("📤 Testing email sending...");
  const emailSent = await sendVolunteerLoginEmail(sampleData);
  
  if (emailSent) {
    console.log("✅ Email sending completed successfully");
    if (isDevelopment) {
      console.log("   (Email was simulated in development mode)");
    } else {
      console.log("   (Real email was sent via Resend)");
    }
  } else {
    console.log("❌ Email sending failed");
  }

  console.log("\n🎯 Template Features:");
  console.log("✓ Professional theatre-themed design");
  console.log("✓ Clear call-to-action button");
  console.log("✓ Responsive email layout");
  console.log("✓ Copy-paste link fallback");
  console.log("✓ Instructions for volunteers");
  console.log("✓ HTML escaping for security");
  console.log("✓ Resend integration for production");

  console.log("\n🚀 Production Setup:");
  if (!hasResendKey) {
    console.log("1. Sign up for Resend at https://resend.com/");
    console.log("2. Get your API key from the dashboard");
    console.log("3. Add RESEND_API_KEY to your .env file");
    console.log("4. Set DENO_ENV=production to enable real email sending");
    console.log("5. Configure FROM_EMAIL with your verified domain");
  } else {
    console.log("✅ Resend is configured and ready!");
    console.log("💡 Set DENO_ENV=production to send real emails");
  }

  console.log("\n📧 Email Service Features:");
  console.log("✓ Automatic development/production mode detection");
  console.log("✓ Fallback to simulation when API key is missing");
  console.log("✓ Configurable sender name and email");
  console.log("✓ Proper error handling and logging");
  console.log("✓ Ready for production use");
}

// Show usage if API key is missing
function showSetupInstructions() {
  console.log("\n📋 Quick Setup Instructions:");
  console.log("1. Copy .env.example to .env");
  console.log("2. Get your Resend API key from https://resend.com/");
  console.log("3. Add your API key to the .env file:");
  console.log("   RESEND_API_KEY=re_your_api_key_here");
  console.log("4. Configure your sender email (must be verified with Resend):");
  console.log("   FROM_EMAIL=theatre@yourdomain.com");
  console.log("5. Set environment to production when ready:");
  console.log("   DENO_ENV=production");
}

// Run the test
if (import.meta.main) {
  // Load environment variables
  try {
    await import("dotenv").then(mod => mod.load());
  } catch {
    console.log("💡 No .env file found, using defaults");
  }
  
  await testEmailTemplate();
  
  // Show setup instructions if in development mode
  if (Deno.env.get('DENO_ENV') === 'development' || !Deno.env.get('RESEND_API_KEY')) {
    showSetupInstructions();
  }
}
