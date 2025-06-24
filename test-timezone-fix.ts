#!/usr/bin/env deno run --allow-net
import { createAdelaideTimestamp } from "./src/utils/timezone.ts";

// Test the same input that was failing
const start_time = "2025-06-26T16:49:00";
const end_time = "2025-06-26T20:49:00";

console.log("Testing timezone conversion...");
console.log("Input start_time:", start_time);
console.log("Input end_time:", end_time);

// Extract date and time components (same as fixed createShow function)
const startDate = start_time.split('T')[0];
const startTimeOnly = start_time.split('T')[1]; // Keep full time format HH:MM:SS

const endDate = end_time.split('T')[0];
const endTimeOnly = end_time.split('T')[1]; // Keep full time format HH:MM:SS

console.log("Parsed start date:", startDate, "time:", startTimeOnly);
console.log("Parsed end date:", endDate, "time:", endTimeOnly);

try {
  // Create Adelaide timezone timestamps
  const adelaideStartTime = createAdelaideTimestamp(startDate, startTimeOnly);
  const adelaideEndTime = createAdelaideTimestamp(endDate, endTimeOnly);
  
  console.log("Adelaide start timestamp:", adelaideStartTime);
  console.log("Adelaide start ISO:", adelaideStartTime.toISOString());
  console.log("Adelaide end timestamp:", adelaideEndTime);
  console.log("Adelaide end ISO:", adelaideEndTime.toISOString());
  
  console.log("✅ Timezone conversion successful!");
} catch (error) {
  console.error("❌ Timezone conversion failed:", error);
  console.error("Error details:", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
}
