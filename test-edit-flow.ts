import { toAdelaideDateTimeLocal } from "./src/utils/timezone.ts";

console.log("🔍 Testing Edit Flow Issue");
console.log("==========================");

// Simulate data that might come from the database
const testCases = [
  {
    name: "UTC String from DB",
    arrive_time: "2025-06-21T14:31:00.000Z", // This is what might come from DB after saving 00:01 Adelaide
    depart_time: "2025-06-22T08:30:00.000Z"  // This is what might come from DB after saving 18:00 Adelaide
  },
  {
    name: "Date Object from UTC String",
    arrive_time: new Date("2025-06-21T14:31:00.000Z"),
    depart_time: new Date("2025-06-22T08:30:00.000Z")
  },
  {
    name: "Wrong Parse - Direct Date Creation",
    arrive_time: new Date("2025-06-22T00:01:00"), // This would be wrong - treating as local timezone
    depart_time: new Date("2025-06-22T18:00:00")  // This would be wrong - treating as local timezone
  }
];

for (const testCase of testCases) {
  console.log(`\n📊 ${testCase.name}:`);
  console.log(`  Raw arrive_time: ${testCase.arrive_time}`);
  console.log(`  Raw depart_time: ${testCase.depart_time}`);
  
  try {
    const displayArrive = toAdelaideDateTimeLocal(testCase.arrive_time);
    const displayDepart = toAdelaideDateTimeLocal(testCase.depart_time);
    
    console.log(`  Form displays: ${displayArrive} to ${displayDepart}`);
    
    // Check if this matches what user expects
    if (displayArrive === "2025-06-22T00:01" && displayDepart === "2025-06-22T18:00") {
      console.log(`  ✅ Correct - matches user input`);
    } else {
      console.log(`  ❌ Wrong - user expects 2025-06-22T00:01 to 2025-06-22T18:00`);
      
      // If arrive is 02:01 instead of 00:01, that's 2 hours difference
      if (displayArrive === "2025-06-22T02:01") {
        console.log(`  🚨 This matches user's reported issue: 00:01 shows as 02:01`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error}`);
  }
}

// Test what happens when we create the wrong way (the old bug)
console.log(`\n🐛 Testing Old Bug:`);
const buggyArriveTime = new Date("2025-06-22T00:01");

console.log(`  Buggy arrive from new Date("2025-06-22T00:01"): ${buggyArriveTime.toISOString()}`);
console.log(`  Adelaide display of buggy: ${buggyArriveTime.toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' })}`);
console.log(`  toAdelaideDateTimeLocal of buggy: ${toAdelaideDateTimeLocal(buggyArriveTime)}`);
