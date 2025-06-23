import { createAdelaideTimestamp, toAdelaideDateTimeLocal } from "./src/utils/timezone.ts";

console.log("🕰️ Comprehensive Adelaide Timezone Test");
console.log("=======================================");

const testCases = [
  { date: "2025-06-22", time: "00:01" },
  { date: "2025-06-22", time: "00:30" },
  { date: "2025-06-22", time: "12:00" },
  { date: "2025-06-22", time: "18:00" },
  { date: "2025-06-23", time: "19:30" },
  { date: "2025-06-23", time: "00:00" },
  { date: "2025-06-23", time: "23:59" }
];

for (const { date, time } of testCases) {
  console.log(`\n📅 Testing: ${date} ${time}`);
  
  const timestamp = createAdelaideTimestamp(date, time);
  const backToLocal = toAdelaideDateTimeLocal(timestamp);
  
  console.log(`  Created UTC: ${timestamp.toISOString()}`);
  console.log(`  Adelaide display: ${timestamp.toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' })}`);
  console.log(`  Round trip: ${backToLocal}`);
  console.log(`  Expected: ${date}T${time}`);
  console.log(`  Match: ${backToLocal === `${date}T${time}` ? '✅' : '❌'}`);
}

// Let's also check what the system thinks Adelaide offset is for these dates
console.log("\n🌏 Adelaide Timezone Info:");
const testDate1 = new Date('2025-06-22T12:00:00Z');
const testDate2 = new Date('2025-06-23T12:00:00Z');

console.log(`June 22, 2025 noon UTC = ${testDate1.toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' })} Adelaide`);
console.log(`June 23, 2025 noon UTC = ${testDate2.toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' })} Adelaide`);
