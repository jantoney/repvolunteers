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
    getNowAdelaide,
    dateToStringAdelaide,
    getMonthYearAdelaide,
    getAdelaideTimezoneOffset
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
    getNowAdelaide,
    dateToStringAdelaide,
    getMonthYearAdelaide,
    getAdelaideTimezoneOffset
  };
}
