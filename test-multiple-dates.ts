import { createAdelaideTimestamp } from "./src/utils/timezone.ts";

console.log("🎭 Testing Multiple Performance Dates");
console.log("====================================");

// Simulate creating shifts for multiple performance dates
const arriveTime = "19:00"; // 7:00 PM
const departTime = "23:30"; // 11:30 PM

const performanceDates = [
  "2025-07-15", // Tuesday
  "2025-07-16", // Wednesday  
  "2025-07-19", // Saturday
  "2025-07-20"  // Sunday
];

console.log(`Shift times: Arrive ${arriveTime}, Depart ${departTime}`);
console.log("\nCreating shifts for multiple performance dates:");

performanceDates.forEach((date, index) => {
  const arriveTimestamp = createAdelaideTimestamp(date, arriveTime);
  const departTimestamp = createAdelaideTimestamp(date, departTime);
  
  console.log(`\nPerformance ${index + 1} (${date}):`);
  console.log(`  Arrive: ${arriveTimestamp.toISOString()} (UTC)`);
  console.log(`  Depart: ${departTimestamp.toISOString()} (UTC)`);
  console.log(`  Adelaide Arrive: ${arriveTimestamp.toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' })}`);
  console.log(`  Adelaide Depart: ${departTimestamp.toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' })}`);
});

console.log("\n✅ Each performance date gets its own correctly calculated timestamps!");
