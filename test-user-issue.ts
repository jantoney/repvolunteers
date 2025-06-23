import { createAdelaideTimestamp, toAdelaideDateTimeLocal } from "./src/utils/timezone.ts";

console.log("🔄 Testing Round-Trip for User Issue");
console.log("====================================");

// Test the exact scenario the user mentioned
const userInput = "2025-06-22T00:01";
console.log(`User saves: ${userInput}`);

// Simulate what happens when the form is submitted
const [arriveDate, arriveTime] = userInput.split('T');
console.log(`Parsed - Date: ${arriveDate}, Time: ${arriveTime}`);

// Create Adelaide timestamp (this is saved to DB)
const adelaideTimestamp = createAdelaideTimestamp(arriveDate, arriveTime);
console.log(`Stored in DB (UTC): ${adelaideTimestamp.toISOString()}`);

// When editing, this is what gets displayed back in the form
const displayedValue = toAdelaideDateTimeLocal(adelaideTimestamp);
console.log(`Displayed in edit form: ${displayedValue}`);

console.log(`\nExpected: ${userInput}`);
console.log(`Actual: ${displayedValue}`);
console.log(`Match: ${userInput === displayedValue ? '✅' : '❌'}`);

if (userInput !== displayedValue) {
  console.log(`\n❌ BUG FOUND! User input ${userInput} becomes ${displayedValue}`);
  const [expectedHours, expectedMinutes] = arriveTime.split(':').map(Number);
  const [actualHours, actualMinutes] = displayedValue.split('T')[1].split(':').map(Number);
  const hourDiff = actualHours - expectedHours;
  const minuteDiff = actualMinutes - expectedMinutes;
  console.log(`Time difference: ${hourDiff}h ${minuteDiff}m`);
} else {
  console.log("\n✅ No bug - round trip is correct!");
}
