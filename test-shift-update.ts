import { createAdelaideTimestamp } from "./src/utils/timezone.ts";

console.log("🛠️ Testing Shift Update Fix");
console.log("============================");

// Simulate the exact scenario from the user's issue
const arrive_time = "2025-06-22T00:01";
const depart_time = "2025-06-22T18:00";

console.log(`Input arrive_time: ${arrive_time}`);
console.log(`Input depart_time: ${depart_time}`);

// OLD WAY (incorrect - what was happening before)
console.log("\n❌ OLD WAY (incorrect):");
const oldArriveDate = new Date(arrive_time + ':00');
const oldDepartDate = new Date(depart_time + ':00');
console.log(`  new Date(arrive_time + ':00'): ${oldArriveDate.toISOString()}`);
console.log(`  new Date(depart_time + ':00'): ${oldDepartDate.toISOString()}`);
console.log(`  Adelaide display: ${oldArriveDate.toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' })}`);

// NEW WAY (correct)
console.log("\n✅ NEW WAY (correct):");
const [arriveDate, arriveTime] = arrive_time.split('T');
const [departDate, departTime] = depart_time.split('T');

console.log(`  Parsed date: ${arriveDate}, time: ${arriveTime}`);
console.log(`  Parsed date: ${departDate}, time: ${departTime}`);

const arriveAdelaide = createAdelaideTimestamp(arriveDate, arriveTime);
const departAdelaide = createAdelaideTimestamp(departDate, departTime);

console.log(`  Adelaide arrive timestamp: ${arriveAdelaide.toISOString()}`);
console.log(`  Adelaide depart timestamp: ${departAdelaide.toISOString()}`);
console.log(`  Adelaide display arrive: ${arriveAdelaide.toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' })}`);
console.log(`  Adelaide display depart: ${departAdelaide.toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' })}`);

console.log("\n✅ The times should now remain exactly as entered!");
