import { getPool } from "./src/models/db.ts";
import { toAdelaideDateTimeLocal } from "./src/utils/timezone.ts";

console.log("🔍 Database Timezone Diagnostic");
console.log("================================");

const pool = getPool();
const client = await pool.connect();

try {
  // Check timezone settings
  console.log("📊 PostgreSQL Timezone Settings:");
  const timezoneResult = await client.queryObject("SHOW TIMEZONE");
  console.log(`  Database Timezone: ${JSON.stringify(timezoneResult.rows)}`);
  
  // Check if there are any existing shifts
  console.log("\n📊 Existing Shifts (if any):");
  const shiftsResult = await client.queryObject<{
    id: number;
    role: string;
    arrive_time: Date;
    depart_time: Date;
  }>(`
    SELECT id, role, arrive_time, depart_time 
    FROM shifts 
    ORDER BY id 
    LIMIT 3
  `);
  
  if (shiftsResult.rows.length === 0) {
    console.log("  No shifts found in database");
  } else {
    for (const shift of shiftsResult.rows) {
      console.log(`  Shift ${shift.id}:`);
      console.log(`    Raw arrive_time: ${shift.arrive_time} (type: ${typeof shift.arrive_time})`);
      console.log(`    Raw depart_time: ${shift.depart_time} (type: ${typeof shift.depart_time})`);
      
      if (shift.arrive_time) {
        const arriveAsDate = shift.arrive_time instanceof Date ? shift.arrive_time : new Date(shift.arrive_time);
        const departAsDate = shift.depart_time instanceof Date ? shift.depart_time : new Date(shift.depart_time);
        
        console.log(`    arrive_time as Date: ${arriveAsDate.toISOString()}`);
        console.log(`    depart_time as Date: ${departAsDate.toISOString()}`);
        
        try {
          const displayArrive = toAdelaideDateTimeLocal(arriveAsDate);
          const displayDepart = toAdelaideDateTimeLocal(departAsDate);
          console.log(`    Form would show: ${displayArrive} to ${displayDepart}`);
        } catch (error) {
          console.log(`    Error displaying: ${error}`);
        }
      }
    }
  }
  
  // Test inserting a test timestamp and reading it back
  console.log("\n🧪 Test Insert/Read:");
  
  try {
    // Insert a test timestamp
    const testUtcTime = "2025-06-22T14:31:00.000Z"; // This should display as 00:01 Adelaide
    console.log(`  Inserting test UTC time: ${testUtcTime}`);
    
    // Create a temporary test
    const insertResult = await client.queryObject<{
      id: number;
      arrive_time: Date;
      depart_time: Date;
    }>(`
      INSERT INTO shifts (show_date_id, role, arrive_time, depart_time) 
      VALUES (1, 'TEST_DIAGNOSTIC', $1, $1) 
      RETURNING id, arrive_time, depart_time
    `, [testUtcTime]);
    
    if (insertResult.rows.length > 0) {
      const testShift = insertResult.rows[0];
      console.log(`  Inserted with ID: ${testShift.id}`);
      console.log(`  Read back arrive_time: ${testShift.arrive_time} (type: ${typeof testShift.arrive_time})`);
      
      const readBackAsDate = testShift.arrive_time instanceof Date ? testShift.arrive_time : new Date(testShift.arrive_time);
      console.log(`  As Date object: ${readBackAsDate.toISOString()}`);
      console.log(`  Adelaide display: ${readBackAsDate.toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' })}`);
      
      const displayTime = toAdelaideDateTimeLocal(readBackAsDate);
      console.log(`  Form would display: ${displayTime}`);
      
      if (displayTime === "2025-06-22T00:01") {
        console.log(`  ✅ CORRECT - would display as expected 00:01`);
      } else {
        console.log(`  ❌ INCORRECT - expected 2025-06-22T00:01 but got ${displayTime}`);
      }
      
      // Clean up
      await client.queryObject("DELETE FROM shifts WHERE id = $1", [testShift.id]);
    }
  } catch (error) {
    console.log(`  ❌ Test failed: ${error}`);
  }
  
} finally {
  client.release();
}

console.log("\n✅ Diagnostic complete!");
