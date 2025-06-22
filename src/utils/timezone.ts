/**
 * Timezone utilities for The Rep Volunteers application
 * All dates and times are displayed in Adelaide, Australia timezone
 */

const ADELAIDE_TIMEZONE = 'Australia/Adelaide';

/**
 * Format a date for Adelaide timezone
 */
export function formatDateAdelaide(date: Date | string): string {
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
export function formatTimeAdelaide(date: Date | string, options: { hour12?: boolean } = {}): string {
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
export function formatDateTimeAdelaide(date: Date | string): string {
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
export function getCurrentDateAdelaide(): string {
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: ADELAIDE_TIMEZONE }); // en-CA gives YYYY-MM-DD format
}

/**
 * Get the current time in Adelaide timezone
 */
export function getCurrentTimeAdelaide(): string {
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
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = getCurrentDateAdelaide();
  const dateStr = d.toLocaleDateString('en-CA', { timeZone: ADELAIDE_TIMEZONE });
  return dateStr === today;
}

/**
 * Check if two dates are on different days in Adelaide timezone
 */
export function isDifferentDayAdelaide(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const day1 = d1.toLocaleDateString('en-CA', { timeZone: ADELAIDE_TIMEZONE });
  const day2 = d2.toLocaleDateString('en-CA', { timeZone: ADELAIDE_TIMEZONE });
  
  return day1 !== day2;
}

/**
 * Format shift time with next day indicator if applicable
 */
export function formatShiftTimeAdelaide(arriveTime: Date | string, departTime: Date | string): string {
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
 * Get timezone offset string for Adelaide (for debugging)
 */
export function getAdelaideTimezoneOffset(): string {
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
 * Convert a date to Adelaide timezone and return as ISO string
 */
export function toAdelaideISOString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Get the date/time components in Adelaide timezone
  const year = d.toLocaleDateString('en-CA', { timeZone: ADELAIDE_TIMEZONE, year: 'numeric' });
  const month = d.toLocaleDateString('en-CA', { timeZone: ADELAIDE_TIMEZONE, month: '2-digit' });
  const day = d.toLocaleDateString('en-CA', { timeZone: ADELAIDE_TIMEZONE, day: '2-digit' });
  const time = d.toLocaleTimeString('en-GB', { timeZone: ADELAIDE_TIMEZONE, hour12: false });
  
  return `${year}-${month}-${day}T${time}`;
}
