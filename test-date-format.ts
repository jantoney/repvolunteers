import { formatDateAdelaide } from './src/utils/timezone.ts';

console.log('Testing date formatting:');
console.log('formatDateAdelaide("2025-06-22"):', formatDateAdelaide('2025-06-22'));
console.log('formatDateAdelaide("2025-06-23"):', formatDateAdelaide('2025-06-23'));
console.log('formatDateAdelaide(new Date("2025-06-22")):', formatDateAdelaide(new Date('2025-06-22')));

// Test the exact scenario
const testShowDate = {
  id: 1,
  show_name: "Test Show",
  date: "2025-06-22",
  start_time: "19:30",
  end_time: "22:00"
};

console.log('\nTesting template scenario:');
console.log(`${testShowDate.show_name} - ${formatDateAdelaide(testShowDate.date)} (${testShowDate.start_time} - ${testShowDate.end_time})`);
