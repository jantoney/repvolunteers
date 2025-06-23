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

/**
 * Convert a date to Adelaide timezone and format for datetime-local input
 * @param date - Date object to convert
 * @returns String in YYYY-MM-DDTHH:MM format representing Adelaide time
 */
export function toAdelaideDateTimeLocal(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Get the date/time components in Adelaide timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ADELAIDE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(d);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Create a timestamp in Adelaide timezone from a date and time
 * @param date - The date (YYYY-MM-DD string or Date object)  
 * @param time - The time (HH:MM string)
 * @returns Date object representing the time in Adelaide timezone stored as UTC
 */
export function createAdelaideTimestamp(date: Date | string, time: string): Date {
  const dateStr = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
  
  // Parse the components
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  
  // Use a more direct approach: create a date with the desired Adelaide time,
  // then find the UTC equivalent using binary search
  
  // Start with an approximation
  let utcTime = Date.UTC(year, month - 1, day, hours, minutes);
  
  // Adjust for approximate Adelaide offset (UTC+9.5 to UTC+10.5 depending on DST)
  utcTime -= 9.5 * 60 * 60 * 1000; // Start with UTC+9.5
  
  // Use binary search to find the exact UTC time that displays as our target Adelaide time
  let low = utcTime - 2 * 60 * 60 * 1000; // -2 hours
  let high = utcTime + 2 * 60 * 60 * 1000; // +2 hours
  
  for (let i = 0; i < 20; i++) { // 20 iterations should be more than enough
    const mid = Math.floor((low + high) / 2);
    const testDate = new Date(mid);
    
    // Get what this UTC time displays as in Adelaide
    const adelaideString = testDate.toLocaleString('sv-SE', {
      timeZone: ADELAIDE_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const [adelaideDatePart, adelaideTimePart] = adelaideString.split(' ');
    const [aYear, aMonth, aDay] = adelaideDatePart.split('-').map(Number);
    const [aHours, aMinutes] = adelaideTimePart.split(':').map(Number);
    
    // Compare with our target
    const targetTime = year * 10000000000 + month * 100000000 + day * 1000000 + hours * 10000 + minutes * 100;
    const actualTime = aYear * 10000000000 + aMonth * 100000000 + aDay * 1000000 + aHours * 10000 + aMinutes * 100;
    
    if (actualTime === targetTime) {
      return new Date(mid);
    } else if (actualTime < targetTime) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  
  // Fallback: return the best approximation
  return new Date(Math.floor((low + high) / 2));
}
