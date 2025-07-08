/**
 * Client-side date/time formatting utilities for The Rep Volunteers application
 * No timezone conversions are performed in the client
 * All dates and times are assumed to be in Adelaide, Australia timezone
 */

const ADELAIDE_TIMEZONE = 'Australia/Adelaide';

/**
 * Format a date for display (DD/MM/YYYY)
 */
function formatDate(date) {
  let d;
  if (typeof date === 'string') {
    const dateOnly = date.split('T')[0];
    const parts = dateOnly.split('-');
    if (parts.length === 3) {
      // Construct date from parts to avoid timezone issues with `new Date('YYYY-MM-DD')`
      d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    } else {
      d = new Date(date); // Fallback for other formats
    }
  } else {
    d = date;
  }
  return d.toLocaleDateString('en-AU', {
    timeZone: 'UTC', // Format in UTC to match the date construction
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}



/**
 * Format a time for display (24-hour format)
 */
function formatTime(date) {
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
function formatDateTime(date) {
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
 * Format a date as YYYY-MM-DD (for form inputs)
 */
function formatDateForInput(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

/**
 * Format a time as HH:MM (for form inputs)
 */
function formatTimeForInput(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toTimeString().substring(0, 5); // Returns HH:MM
}

/**
 * Check if a date is today
 */
function isToday(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

/**
 * Format shift time with next day indicator if applicable
 */
function formatShiftTime(arriveTime, departTime) {
  const arrive = typeof arriveTime === 'string' ? new Date(arriveTime) : arriveTime;
  const depart = typeof departTime === 'string' ? new Date(departTime) : departTime;

  const arriveStr = formatTime(arrive);
  const departStr = formatTime(depart);

  // Check if depart is next day
  const isNextDay = arrive.getDate() !== depart.getDate() ||
    arrive.getMonth() !== depart.getMonth() ||
    arrive.getFullYear() !== depart.getFullYear();

  return `${arriveStr} - ${departStr}${isNextDay ? ' +1 day' : ''}`;
}

/**
 * Format a show time range (start_time to end_time)
 */
function formatShowTimeRange(startTime, endTime) {
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
 */
function formatPerformance(startTime, endTime) {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

  const dateStr = formatDate(start);
  const timeRangeStr = formatShowTimeRange(start, end);

  return `${dateStr}, ${timeRangeStr}`;
}

/**
 * Get formatted month/year for calendar header
 */
function getMonthYear(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Combine date string and time string into ISO format
 * This function does NOT perform any timezone conversion
 * @param {string} timeStr - Time string in 24-hour format (e.g., "14:30")
 * @param {string} dateStr - Date string in ISO format (YYYY-MM-DD)
 * @return {string} ISO string representing the date and time
 */
function combineDateTimeToISO(dateStr, timeStr) {
  if (!timeStr || !dateStr) {
    console.error('Missing time or date for ISO conversion');
    return null;
  }

  try {
    // Format: YYYY-MM-DDT18:00:00 (for 6pm)
    return `${dateStr}T${timeStr}:00`;
  } catch (error) {
    console.error('Error combining date and time:', error);
    return null;
  }
}

// Export functions for use in modules or make available globally
if (typeof module !== 'undefined' && module.exports) {
  // Node.js/CommonJS environment
  module.exports = {
    ADELAIDE_TIMEZONE,
    formatDate,
    formatTime,
    formatDateTime,
    formatDateForInput,
    formatTimeForInput,
    isToday,
    formatShiftTime,
    formatShowTimeRange,
    formatPerformance,
    getMonthYear,
    combineDateTimeToISO
  };
} else {
  // Browser environment - attach to globalThis object
  globalThis.DateTimeFormat = {
    ADELAIDE_TIMEZONE,
    formatDate,
    formatTime,
    formatDateTime,
    formatDateForInput,
    formatTimeForInput,
    isToday,
    formatShiftTime,
    formatShowTimeRange,
    formatPerformance,
    getMonthYear,
    combineDateTimeToISO
  };
}
