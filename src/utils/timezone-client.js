/**
 * Client-side timezone utilities for The Rep Volunteers application
 * All dates and times are displayed in Adelaide, Australia timezone
 */

const ADELAIDE_TIMEZONE = 'Australia/Adelaide';

/**
 * Format a date for Adelaide timezone
 */
function formatDateAdelaide(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-AU', {
    timeZone: ADELAIDE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Format a time for Adelaide timezone
 */
function formatTimeAdelaide(date, options = {}) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-AU', {
    timeZone: ADELAIDE_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: options.hour12 || false
  });
}

/**
 * Format a date and time for Adelaide timezone
 */
function formatDateTimeAdelaide(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-AU', {
    timeZone: ADELAIDE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Get the current date in Adelaide timezone as YYYY-MM-DD string
 */
function getCurrentDateAdelaide() {
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: ADELAIDE_TIMEZONE }); // en-CA gives YYYY-MM-DD format
}

/**
 * Get the current time in Adelaide timezone
 */
function getCurrentTimeAdelaide() {
  const now = new Date();
  return now.toLocaleTimeString('en-AU', {
    timeZone: ADELAIDE_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Check if a date is today in Adelaide timezone
 */
function isTodayAdelaide(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = getCurrentDateAdelaide();
  const dateStr = d.toLocaleDateString('en-CA', { timeZone: ADELAIDE_TIMEZONE });
  return dateStr === today;
}

/**
 * Format shift time with next day indicator if applicable
 */
function formatShiftTimeAdelaide(arriveTime, departTime) {
  const arrive = typeof arriveTime === 'string' ? new Date(arriveTime) : arriveTime;
  const depart = typeof departTime === 'string' ? new Date(departTime) : departTime;

  const arriveStr = formatTimeAdelaide(arrive);
  const departStr = formatTimeAdelaide(depart);

  // Check if depart is next day in Adelaide timezone
  const arriveDate = arrive.toLocaleDateString('en-CA', { timeZone: ADELAIDE_TIMEZONE });
  const departDate = depart.toLocaleDateString('en-CA', { timeZone: ADELAIDE_TIMEZONE });

  const isNextDay = arriveDate !== departDate;

  return `${arriveStr} - ${departStr}${isNextDay ? ' +1 day' : ''}`;
}

/**
 * Format a show time range in Adelaide timezone (start_time to end_time)
 * This function is specifically for displaying performance times on the shows page
 */
function formatShowTimeRangeAdelaide(startTime, endTime) {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

  const startTimeStr = formatTimeAdelaide(start);
  const endTimeStr = formatTimeAdelaide(end);

  // Check if start and end are on different days in Adelaide timezone
  const startDate = start.toLocaleDateString('en-CA', { timeZone: ADELAIDE_TIMEZONE });
  const endDate = end.toLocaleDateString('en-CA', { timeZone: ADELAIDE_TIMEZONE });
  const isMultiDay = startDate !== endDate;

  return `${startTimeStr} - ${endTimeStr}${isMultiDay ? ' +1 day' : ''}`;
}

/**
 * Format performance date and time for display in the admin interface
 */
function formatPerformanceAdelaide(startTime, endTime) {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

  const dateStr = formatDateAdelaide(start);
  const timeRangeStr = formatShowTimeRangeAdelaide(start, end);

  return `${dateStr}, ${timeRangeStr}`;
}

/**
 * Get the current date and time in Adelaide timezone
 */
function getNowAdelaide() {
  const now = new Date();
  // Create a new date that represents "now" in Adelaide timezone
  const adelaideNow = new Date(now.toLocaleString('en-US', { timeZone: ADELAIDE_TIMEZONE }));
  return adelaideNow;
}

/**
 * Convert date to Adelaide timezone for calendar usage
 */
function dateToStringAdelaide(dateValue) {
  if (!dateValue) return null;

  try {
    let date;
    if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      console.warn('Unexpected date format:', dateValue);
      return null;
    }

    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateValue);
      return null;
    }

    return date.toLocaleDateString('en-CA', { timeZone: ADELAIDE_TIMEZONE });
  } catch (error) {
    console.error('Error converting date:', dateValue, error);
    return null;
  }
}

/**
 * Get formatted month/year for calendar header
 */
function getMonthYearAdelaide(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    timeZone: ADELAIDE_TIMEZONE,
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Get timezone offset string for Adelaide (for debugging)
 */
function getAdelaideTimezoneOffset() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: ADELAIDE_TIMEZONE,
    timeZoneName: 'short'
  });
  const parts = formatter.formatToParts(now);
  const timeZoneName = parts.find(part => part.type === 'timeZoneName');
  return timeZoneName?.value || 'ACDT/ACST';
}

/**
 * Convert time string (HH:MM) and date string (YYYY-MM-DD) to Adelaide timezone ISO string
 * This function ensures that a time entered by the user is always treated as if it was entered in Adelaide timezone
 * @param {string} timeStr - Time string in 24-hour format (e.g., "14:30")
 * @param {string} dateStr - Date string in ISO format (YYYY-MM-DD)
 * @return {string} ISO string representing the date and time in Adelaide timezone
 */
function saveTimeAsAdelaideTZ(timeStr, dateStr) {
  if (!timeStr || !dateStr) {
    console.error('Missing time or date for Adelaide timezone conversion');
    return null;
  }

  try {
    // Extract hours and minutes from the time string
    const [hours, minutes] = timeStr.split(':').map(num => parseInt(num, 10));

    // Create a date object from the provided date
    const dateParts = dateStr.split('-').map(num => parseInt(num, 10));
    const year = dateParts[0];
    const month = dateParts[1] - 1; // Month is 0-indexed in JavaScript
    const day = dateParts[2];

    // First construct an ISO string that represents the desired date/time in Adelaide
    // Format: YYYY-MM-DDT18:00:00 (for 6pm Adelaide time)
    const adelaideDateTimeStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    console.log('Target Adelaide time:', adelaideDateTimeStr);

    // This timestamp is meant to be interpreted as Adelaide time
    // We'll add a special comment to ensure the server knows this
    return adelaideDateTimeStr;
  } catch (error) {
    console.error('Error converting time to Adelaide timezone:', error);
    return null;
  }
}

// Export functions for use in modules or make available globally
if (typeof module !== 'undefined' && module.exports) {
  // Node.js/CommonJS environment
  module.exports = {
    ADELAIDE_TIMEZONE,
    formatDateAdelaide,
    formatTimeAdelaide,
    formatDateTimeAdelaide,
    getCurrentDateAdelaide,
    getCurrentTimeAdelaide,
    isTodayAdelaide,
    formatShiftTimeAdelaide,
    formatShowTimeRangeAdelaide,
    formatPerformanceAdelaide,
    getNowAdelaide,
    dateToStringAdelaide,
    getMonthYearAdelaide,
    getAdelaideTimezoneOffset,
    saveTimeAsAdelaideTZ
  };
} else {
  // Browser environment - attach to globalThis object
  globalThis.AdelaideTime = {
    ADELAIDE_TIMEZONE,
    formatDateAdelaide,
    formatTimeAdelaide,
    formatDateTimeAdelaide,
    getCurrentDateAdelaide,
    getCurrentTimeAdelaide,
    isTodayAdelaide,
    formatShiftTimeAdelaide,
    formatShowTimeRangeAdelaide,
    formatPerformanceAdelaide,
    getNowAdelaide,
    dateToStringAdelaide,
    getMonthYearAdelaide,
    getAdelaideTimezoneOffset,
    saveTimeAsAdelaideTZ
  };
}
