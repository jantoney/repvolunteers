/**
 * Timezone utilities for The Rep Volunteers application
 * All dates and times are treated as Adelaide, Australia timezone
 * This module provides server-side utilities for database operations
 */

const ADELAIDE_TIMEZONE = 'Australia/Adelaide';

/**
 * Format a date for display (DD/MM/YYYY)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Format a time for display (24-hour format)
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Format a date and time for display (DD/MM/YYYY HH:MM)
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Get the current date as YYYY-MM-DD string
 */
export function getCurrentDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

/**
 * Get the current time in HH:MM format
 */
export function getCurrentTime(): string {
  const now = new Date();
  return now.toTimeString().substring(0, 5); // Returns HH:MM
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

/**
 * Check if two dates are on different days
 */
export function isDifferentDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  return d1.getDate() !== d2.getDate() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getFullYear() !== d2.getFullYear();
}

/**
 * Format shift time with next day indicator if applicable
 */
export function formatShiftTime(arriveTime: Date | string, departTime: Date | string): string {
  const arrive = typeof arriveTime === 'string' ? new Date(arriveTime) : arriveTime;
  const depart = typeof departTime === 'string' ? new Date(departTime) : departTime;

  const arriveStr = formatTime(arrive);
  const departStr = formatTime(depart);

  // Check if depart is next day
  const isNextDay = isDifferentDay(arrive, depart);

  return `${arriveStr} - ${departStr}${isNextDay ? ' +1 day' : ''}`;
}

/**
 * Get timezone offset string for Adelaide (for reference only)
 */
export function getAdelaideTimezoneOffset(): string {
  return ADELAIDE_TIMEZONE;
}

/**
 * Format a date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

/**
 * Format a time for input fields (HH:MM)
 */
export function formatTimeForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toTimeString().substring(0, 5); // Returns HH:MM
}

/**
 * Format date and time for datetime-local input fields (YYYY-MM-DDTHH:MM)
 * Replaces the old toAdelaideDateTimeLocal function
 */
export function formatDateTimeForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = d.toTimeString().substring(0, 5); // HH:MM
  return `${dateStr}T${timeStr}`; // YYYY-MM-DDTHH:MM
}

/**
 * Combine date string and time string into ISO format
 * This function does NOT perform any timezone conversion
 * @param {string} dateStr - Date string in ISO format (YYYY-MM-DD)
 * @param {string} timeStr - Time string in 24-hour format (e.g., "14:30")
 * @return {string} ISO string representing the date and time
 */
export function combineDateTimeToISO(dateStr: string, timeStr: string): string {
  if (!timeStr || !dateStr) {
    console.error('Missing time or date for ISO conversion');
    return "";
  }

  try {
    // Format: YYYY-MM-DDT18:00:00 (for 6pm)
    return `${dateStr}T${timeStr}:00`;
  } catch (error) {
    console.error('Error combining date and time:', error);
    return "";
  }
}


/**
 * Format a show time range (start_time to end_time)
 */
export function formatShowTimeRange(startTime: Date | string, endTime: Date | string): string {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

  const startTimeStr = formatTime(start);
  const endTimeStr = formatTime(end);

  // Check if start and end are on different days
  const isMultiDay = start.getDate() !== end.getDate() ||
    start.getMonth() !== end.getMonth() ||
    start.getFullYear() !== end.getFullYear();

  return `${startTimeStr} - ${endTimeStr}${isMultiDay ? ' +1 day' : ''}`;
}


/**
 * Format performance date and time for display
 * @param startTime - The performance start time
 * @param endTime - The performance end time
 * @returns Formatted string showing date and time range
 */
export function formatPerformance(startTime: Date | string, endTime: Date | string): string {
  const dateStr = formatDate(startTime);
  const timeRangeStr = formatShowTimeRange(startTime, endTime);

  return `${dateStr}, ${timeRangeStr}`;
}

/**
 * Generate SQL fragment for selecting a timestamptz column as Adelaide time
 * 
 * @param {string} columnName - The name of the timestamptz column
 * @param {string} [alias=null] - Optional alias for the result column
 * @return {string} SQL fragment for the query
 */
export function getAdelaideTimeSelectSQL(columnName: string, alias?: string): string {
  const resultAlias = alias || columnName;
  return `${columnName} AT TIME ZONE '${ADELAIDE_TIMEZONE}' AS ${resultAlias}`;
}

/**
 * Generate SQL parameter placeholder for inserting Adelaide timezone
 * 
 * @param {string} paramName - Parameter placeholder (e.g., '$1', ':time')
 * @return {string} SQL fragment for parameterized query
 */
export function getAdelaideTimeParameterSQL(paramName: string): string {
  return `TIMESTAMP ${paramName} AT TIME ZONE '${ADELAIDE_TIMEZONE}'`;
}

/**
 * Generate SQL for inserting a timestamp that will be treated as Adelaide time
 * Use this in INSERT/UPDATE queries
 * 
 * @param {string|Date} date - Date in YYYY-MM-DD format or Date object
 * @param {string} time - Time in HH:MM or HH:MM:SS format
 * @return {string} SQL fragment for inserting timestamp in Adelaide timezone
 */
export function getAdelaideTimeInsertSQL(date: Date | string, time: string): string {
  const dateStr = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
  const timeStr = time.includes(':') ? time : `${time}:00`;

  return `TIMESTAMP '${dateStr} ${timeStr}' AT TIME ZONE '${ADELAIDE_TIMEZONE}'`;
}

/**
 * Creates a parameter object for inserting Adelaide timestamps in PostgreSQL
 * 
 * @param {string|Date} date - Date in YYYY-MM-DD format or Date object
 * @param {string} time - Time in HH:MM or HH:MM:SS format
 * @return {Object} Parameter object for use with postgres client
 */
export function createAdelaideTimestamp(date: Date | string, time: string): Date {
  const dateStr = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
  const timeStr = time.includes(':') ? time : `${time}:00`;

  // Create timestamp string in format that PostgreSQL expects
  const timestamp = `${dateStr} ${timeStr}`;

  // This function should just create a JavaScript Date object that will be 
  // treated as Adelaide time in PostgreSQL when using AT TIME ZONE
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes, seconds = 0] = timeStr.split(':').map(Number);

  // Create a date object with the given components
  return new Date(year, month - 1, day, hours, minutes, seconds);
}
