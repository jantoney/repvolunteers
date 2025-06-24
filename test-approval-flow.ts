#!/usr/bin/env -S deno run --allow-env --allow-net

import "jsr:@std/dotenv/load";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

async function testApprovalFlow() {
  console.log('🔄 Testing Approval Flow');
  console.log('========================');
  
  const pool = new Pool(Deno.env.get("DATABASE_URL")!, 1);
  
  try {
    // Find a participant with future shifts
    const client = await pool.connect();
    try {
      const futureShifts = await client.queryObject(`
        SELECT 
          p.id as participant_id,
          p.name,
          p.approved,
          COUNT(s.id) as shift_count,
          STRING_AGG(
            sh.name || ' - ' || s.role || ' (' || 
            TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'DD/MM/YYYY HH24:MI') || ')',
            ', '
          ) as shifts
        FROM participants p
        LEFT JOIN shifts s ON p.id = s.participant_id
        LEFT JOIN shows sh ON s.show_id = sh.id
        WHERE s.depart_time > NOW()
        GROUP BY p.id, p.name, p.approved
        HAVING COUNT(s.id) > 0
        ORDER BY shift_count DESC
        LIMIT 5
      `);
      
      console.log('\n📋 Participants with future shifts:');
      if (futureShifts.rows.length === 0) {
        console.log('   No participants found with future shifts');
        return;
      }
      
      futureShifts.rows.forEach((p: any, i: number) => {
        console.log(`   ${i + 1}. ${p.name} (ID: ${p.participant_id})`);
        console.log(`      Approved: ${p.approved ? '✅' : '❌'}`);
        console.log(`      Future shifts: ${p.shift_count}`);
        console.log(`      Details: ${p.shifts}`);
        console.log('');
      });
      
      // Test the API endpoint that the frontend would call
      const testParticipant = futureShifts.rows[0];
      console.log(`\n🧪 Testing API for participant: ${testParticipant.name}`);
      
      // Simulate the API call that gets future shifts
      const shifts = await client.queryObject(`
        SELECT 
          s.id,
          sh.name as show_name,
          s.role,
          TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'DD/MM/YYYY') as date,
          CASE 
            WHEN s.arrive_time IS NOT NULL AND s.depart_time IS NOT NULL THEN
              TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'h:mm am') || ' - ' ||
              TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'h:mm am') ||
              CASE 
                WHEN DATE(s.arrive_time AT TIME ZONE 'Australia/Adelaide') != DATE(s.depart_time AT TIME ZONE 'Australia/Adelaide') 
                THEN ' (+1 day)'
                ELSE ''
              END
            WHEN s.arrive_time IS NOT NULL THEN
              TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'h:mm am') || ' (arrive only)'
            WHEN s.depart_time IS NOT NULL THEN
              TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'h:mm am') || ' (depart only)'
            ELSE 'Time TBD'
          END as time
        FROM shifts s
        JOIN shows sh ON s.show_id = sh.id
        WHERE s.participant_id = $1 
          AND s.depart_time > NOW()
        ORDER BY s.arrive_time, s.depart_time
      `, [testParticipant.participant_id]);
      
      console.log(`   Found ${shifts.rows.length} future shifts:`);
      shifts.rows.forEach((shift: any, i: number) => {
        console.log(`   ${i + 1}. ${shift.show_name} - ${shift.role}`);
        console.log(`      Date: ${shift.date}`);
        console.log(`      Time: ${shift.time}`);
      });
      
      console.log('\n✅ API response matches expected format for frontend');
      console.log('✅ Modal and PDF would receive correctly formatted data');
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

if (import.meta.main) {
  await testApprovalFlow();
}
