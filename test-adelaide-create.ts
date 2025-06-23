import { 
  createAdelaideTimestamp, 
  toAdelaideDateTimeLocal,
  formatTimeAdelaide,
  formatDateAdelaide
} from "./src/utils/timezone.ts";

console.log("🇦🇺 Adelaide Timezone Create Test");
console.log("===================================");

// Test creating Adelaide timestamps
const testDate = "2025-06-23";
const testTime = "19:30";

console.log(`Input: ${testDate} ${testTime} (Adelaide time)`);

const adelaideTimestamp = createAdelaideTimestamp(testDate, testTime);
console.log(`Created timestamp (UTC): ${adelaideTimestamp.toISOString()}`);
console.log(`When displayed in Adelaide: ${formatDateAdelaide(adelaideTimestamp)} ${formatTimeAdelaide(adelaideTimestamp)}`);

// Test the datetime-local formatter
console.log(`\nDatetime-local format: ${toAdelaideDateTimeLocal(adelaideTimestamp)}`);

// Test round-trip
const backToLocal = toAdelaideDateTimeLocal(adelaideTimestamp);
console.log(`Round-trip test: ${backToLocal} should match ${testDate}T${testTime}`);

console.log("\n✅ Adelaide timestamp creation test complete!");
