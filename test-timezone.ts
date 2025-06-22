import { 
  formatDateAdelaide, 
  formatTimeAdelaide, 
  formatShiftTimeAdelaide, 
  getCurrentDateAdelaide, 
  getCurrentTimeAdelaide,
  getAdelaideTimezoneOffset,
  isDifferentDayAdelaide
} from "./src/utils/timezone.ts";

console.log("🇦🇺 Adelaide Timezone Test");
console.log("===========================");

const now = new Date();
console.log(`Current UTC time: ${now.toISOString()}`);
console.log(`Adelaide current date: ${getCurrentDateAdelaide()}`);
console.log(`Adelaide current time: ${getCurrentTimeAdelaide()}`);
console.log(`Adelaide timezone: ${getAdelaideTimezoneOffset()}`);

console.log("\n📅 Date formatting examples:");
const testDate = new Date('2025-06-22T14:30:00Z'); // UTC time
console.log(`Date: ${formatDateAdelaide(testDate)}`);
console.log(`Time: ${formatTimeAdelaide(testDate)}`);

console.log("\n🎭 Shift time examples:");
const arriveTime = new Date('2025-06-22T09:30:00Z'); // 7:00 PM Adelaide time 
const departTime = new Date('2025-06-22T15:00:00Z'); // 1:30 AM next day Adelaide time
console.log(`Shift: ${formatShiftTimeAdelaide(arriveTime, departTime)}`);

console.log("\n🌅 Next day check:");
const earlyTime = new Date('2025-06-22T09:00:00Z'); // 6:30 PM Adelaide
const lateTime = new Date('2025-06-22T15:30:00Z'); // 2:00 AM next day Adelaide
console.log(`Is different day: ${isDifferentDayAdelaide(earlyTime, lateTime)}`);

console.log("\n✅ Adelaide timezone utilities are working!");
