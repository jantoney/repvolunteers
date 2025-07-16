#!/usr/bin/env -S deno run --allow-read --allow-env

import { 
  renderVolunteerLoginEmail,
  renderVolunteerScheduleEmail,
  renderShowWeekEmail,
  createTheatreContactInfo,
  type VolunteerEmailData,
  type VolunteerScheduleEmailData,
  type ShowWeekEmailData
} from './src/utils/email.ts';

/**
 * Test the email templates with clickable phone numbers and contact functionality
 */

console.log("🧪 Testing Email Templates with Clickable Phone Numbers\n");

// Create standard theatre contact info
const contactInfo = createTheatreContactInfo();
console.log("📞 Standard Theatre Contact Info:", contactInfo);

// Test 1: Volunteer Login Email with Contact Info
console.log("\n--- Test 1: Volunteer Login Email ---");
const loginData: VolunteerEmailData = {
  volunteerName: "Sarah Smith",
  volunteerEmail: "sarah@example.com",
  loginUrl: "https://example.com/volunteer/signup/123",
  contactInfo: contactInfo
};

const loginEmail = renderVolunteerLoginEmail(loginData);
console.log("✅ Generated login email with clickable contact info");
console.log("Preview (phone section):", loginEmail.includes('tel:+61434586878') ? '✅ Phone link found' : '❌ Phone link missing');
console.log("Preview (VCF section):", loginEmail.includes('data:text/vcard') ? '✅ VCF contact found' : '❌ VCF contact missing');

// Test 2: Schedule Email with Contact Info
console.log("\n--- Test 2: Schedule Email ---");
const scheduleData: VolunteerScheduleEmailData = {
  volunteerName: "John Doe",
  volunteerEmail: "john@example.com",
  loginUrl: "https://example.com/volunteer/signup/456", 
  hasShifts: true,
  shifts: [
    "Friday 18 Oct 7:00pm - 10:30pm <span style='color:#666;'>Box Office</span>",
    "Saturday 19 Oct 1:00pm - 5:00pm <span style='color:#666;'>Usher</span>"
  ],
  contactInfo: contactInfo
};

const scheduleEmail = renderVolunteerScheduleEmail(scheduleData);
console.log("✅ Generated schedule email with clickable contact info");
console.log("Preview (phone section):", scheduleEmail.includes('tel:+61434586878') ? '✅ Phone link found' : '❌ Phone link missing');

// Test 3: Show Week Email (already has contact info built-in)
console.log("\n--- Test 3: Show Week Email ---");
const showWeekData: ShowWeekEmailData = {
  volunteerName: "Emma Wilson",
  volunteerEmail: "emma@example.com",
  loginUrl: "https://example.com/volunteer/signup/789",
  hasShifts: true,
  shifts: [
    "Show Week Monday 21 Oct 6:00pm - 11:00pm <span style='color:#666;'>Box Office</span>",
    "Show Week Tuesday 22 Oct 6:00pm - 11:00pm <span style='color:#666;'>Usher</span>"
  ],
  contactInfo: contactInfo
};

const showWeekEmail = renderShowWeekEmail(showWeekData);
console.log("✅ Generated show week email with clickable contact info");
console.log("Preview (phone section):", showWeekEmail.includes('tel:+61434586878') ? '✅ Phone link found' : '❌ Phone link missing');

// Test 4: Custom Contact Info
console.log("\n--- Test 4: Custom Contact Info ---");
const customContactInfo = {
  name: "Theatre Manager",
  phone: "0298765432",
  organization: "Community Theatre Group",
  displayFormat: "02 9876 5432"
};

const customData: VolunteerEmailData = {
  volunteerName: "Alex Johnson",
  volunteerEmail: "alex@example.com", 
  loginUrl: "https://example.com/volunteer/signup/999",
  contactInfo: customContactInfo
};

const customEmail = renderVolunteerLoginEmail(customData);
console.log("✅ Generated email with custom contact info");
console.log("Preview (custom phone):", customEmail.includes('tel:+61298765432') ? '✅ Custom phone link found' : '❌ Custom phone link missing');

console.log("\n🎉 All tests completed!");
console.log("\n📱 Key Features Added:");
console.log("  • Clickable phone numbers using tel: protocol");
console.log("  • VCF (vCard) download links for adding contacts to phone");
console.log("  • Flexible contact info support across all email templates");
console.log("  • Automatic international phone number formatting");
console.log("  • Mobile-optimized contact saving functionality");

// Optional: Write sample HTML to file for visual inspection
try {
  await Deno.writeTextFile('./sample-show-week-email.html', showWeekEmail);
  console.log("\n📄 Sample email saved to: sample-show-week-email.html");
  console.log("   You can open this file in a browser to see the clickable phone number!");
} catch (error) {
  console.log("\n📄 Could not save sample file:", error);
}
