#!/usr/bin/env -S deno run --allow-net --allow-env

import { createResendClient } from "./src/utils/resend-config.ts";

/**
 * Utility script to help with Resend setup and domain verification
 */
async function checkResendSetup() {
  console.log("🔧 Resend Setup Checker\n");

  // Check environment configuration
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('FROM_EMAIL') || 'enquiries@adelaiderep.com';
  
  console.log(`Debug - API Key present: ${!!apiKey}`);
  console.log(`Debug - API Key starts with: ${apiKey ? apiKey.substring(0, 5) + '...' : 'none'}`);
  
  if (!apiKey) {
    console.log("❌ RESEND_API_KEY is not configured");
    console.log("\n📋 Setup Steps:");
    console.log("1. Sign up at https://resend.com/");
    console.log("2. Get your API key from the dashboard");
    console.log("3. Add to your .env file: RESEND_API_KEY=re_your_key_here");
    return;
  }

  console.log("✅ RESEND_API_KEY is configured");
  console.log(`📧 FROM_EMAIL: ${fromEmail}`);

  try {
    const resend = createResendClient();
    
    // Test API connection by fetching domains
    console.log("\n🌐 Checking domains...");
    const domainsResponse = await resend.domains.list();
    
    if (domainsResponse.data && Array.isArray(domainsResponse.data.data) && domainsResponse.data.data.length > 0) {
      console.log(`✅ Found ${domainsResponse.data.data.length} domain(s):`);
      
      for (const domain of domainsResponse.data.data) {
        const status = domain.status === 'verified' ? '✅' : '⚠️';
        console.log(`   ${status} ${domain.name} (${domain.status})`);
      }
      
      // Check if the FROM_EMAIL domain is verified
      const fromDomain = fromEmail.split('@')[1];
      const isVerified = domainsResponse.data.data.some(
        (d: { name: string; status: string }) => d.name === fromDomain && d.status === 'verified'
      );
      
      if (isVerified) {
        console.log(`\n✅ Your FROM_EMAIL domain (${fromDomain}) is verified and ready!`);
      } else {
        console.log(`\n⚠️  Your FROM_EMAIL domain (${fromDomain}) is not verified`);
        console.log("   You need to verify your domain in the Resend dashboard");
        console.log("   Or use a verified domain for FROM_EMAIL");
      }
      
    } else {
      console.log("⚠️  No domains found. You need to add and verify a domain in Resend");
      console.log("   Visit: https://resend.com/domains");
    }

    // Test sending a simple email (if domain is verified)
    console.log("\n🧪 Testing email sending capability...");
    
    try {
      const testResult = await resend.emails.send({
        from: fromEmail,
        to: ['jaya@adelaiderep.com'], // Resend's test email
        subject: 'Test Email from Theatre Shifts',
        html: '<p>This is a test email to verify Resend integration.</p>',
      });
      
      console.log("✅ Test email sent successfully!");
      console.log(`   Email ID: ${testResult.data?.id}`);
      
    } catch (testError) {
      console.log("❌ Failed to send test email:");
      console.log(`   Error: ${testError}`);
      
      const errorMessage = testError instanceof Error ? testError.message : String(testError);
      if (errorMessage.includes('domain')) {
        console.log("   💡 This is likely because your domain is not verified");
        console.log("   💡 Verify your domain at https://resend.com/domains");
      }
    }

  } catch (error) {
    console.log("❌ Failed to connect to Resend API:");
    console.log(`   Error: ${error}`);
    console.log("\n🔍 Possible issues:");
    console.log("   - Invalid API key");
    console.log("   - Network connectivity issues");
    console.log("   - API key permissions");
  }

  console.log("\n📚 Useful Resend Links:");
  console.log("   Dashboard: https://resend.com/dashboard");
  console.log("   Domains: https://resend.com/domains");
  console.log("   API Keys: https://resend.com/api-keys");
  console.log("   Docs: https://resend.com/docs");
}

// Run the setup checker
if (import.meta.main) {
  // Load environment variables manually
  try {
    const envText = await Deno.readTextFile('.env');
    console.log("✅ Found .env file");
    
    // Parse .env file manually
    const lines = envText.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    for (const line of lines) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        Deno.env.set(key.trim(), value);
      }
    }
    console.log("✅ Parsed environment variables");
    
  } catch (_error) {
    console.log("💡 No .env file found or failed to load, using environment variables");
  }
  
  await checkResendSetup();
}
