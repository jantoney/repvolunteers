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
 * @param time - The time (HH:MM or HH:MM:SS string)
 * @returns Date object representing the time in Adelaide timezone stored as UTC
 */
/**
 * Format a show time range in Adelaide timezone (start_time to end_time)
 * This function is specifically for displaying performance times on the shows page
 */
export function formatShowTimeRangeAdelaide(startTime: Date | string, endTime: Date | string): string {
  const startTimeStr = formatTimeAdelaide(startTime);
  const endTimeStr = formatTimeAdelaide(endTime);

  // Check if start and end are on different days in Adelaide timezone
  const isMultiDay = isDifferentDayAdelaide(startTime, endTime);

  return `${startTimeStr} - ${endTimeStr}${isMultiDay ? ' +1 day' : ''}`;
}

/**
 * Format performance date and time for display in the admin interface
 * @param startTime - The performance start time
 * @param endTime - The performance end time
 * @returns Formatted string showing date and time range in Adelaide timezone
 */
export function formatPerformanceAdelaide(startTime: Date | string, endTime: Date | string): string {
  const dateStr = formatDateAdelaide(startTime);
  const timeRangeStr = formatShowTimeRangeAdelaide(startTime, endTime);

  return `${dateStr}, ${timeRangeStr}`;
}

export function createAdelaideTimestamp(date: Date | string, time: string): Date {
  const dateStr = typeof date === 'string' ? date : date.toISOString().slice(0, 10);

  // Parse the components
  const [year, month, day] = dateStr.split('-').map(Number);

  // Parse the components - handle both HH:MM and HH:MM:SS formats
  const timeParts = time.split(':').map(Number);
  const [hours, minutes, seconds = 0] = timeParts; // Default seconds to 0 if not provided

  console.log(`Creating Adelaide timestamp for: ${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);

  // Create a temporary date object representing the desired Adelaide time
  // We need to convert this to UTC time for storage in the database

  // First, create a date object in UTC with the same year, month, day, hour, minute
  // This creates a UTC timestamp
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));

  // Now, get the difference between Adelaide time and UTC
  // This gives us how many hours to subtract from the Adelaide time to get UTC
  const adelaideDate = new Date(year, month - 1, day, hours, minutes, seconds);
  adelaideDate.setSeconds(0, 0);

  // Format both dates to see the difference
  console.log(`Adelaide date (local): ${adelaideDate.toISOString()}`);
  console.log(`UTC date: ${utcDate.toISOString()}`);

  // Create a formatter to show Adelaide time
  const adelaideTZFormatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: ADELAIDE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Get the exact offset between Adelaide and UTC for this specific date
  const targetAdelaideString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Calculate the UTC time that, when displayed in Adelaide, will show the target time
  // Adelaide is typically UTC+9:30 or UTC+10:30 depending on daylight saving time

  // Start with an estimate: subtract ~10 hours from the Adelaide time to get UTC
  // The exact offset varies based on daylight saving time
  const estimatedOffset = 10 * 60 * 60 * 1000; // 10 hours in milliseconds
  let estimatedUtcTime = new Date(adelaideDate.getTime() - estimatedOffset);

  // Check if our estimate is correct by displaying it in Adelaide time
  const adelaideView = adelaideTZFormatter.format(estimatedUtcTime).replace(/\//g, '-');
  console.log(`Estimated UTC time: ${estimatedUtcTime.toISOString()}`);
  console.log(`This displays as ${adelaideView} in Adelaide`);

  // If needed, refine this estimate using binary search to get the exact UTC time
  // that will display as the target Adelaide time

  // Binary search with a maximum of 10 iterations should be sufficient
  let low = estimatedUtcTime.getTime() - (2 * 60 * 60 * 1000); // 2 hours earlier
  let high = estimatedUtcTime.getTime() + (2 * 60 * 60 * 1000); // 2 hours later

  for (let i = 0; i < 10; i++) {
    const mid = Math.floor((low + high) / 2);
    const testDate = new Date(mid);

    const testAdelaideView = adelaideTZFormatter.format(testDate).replace(/\//g, '-');

    if (testAdelaideView === targetAdelaideString) {
      console.log(`Found exact match at UTC time: ${testDate.toISOString()}`);
      console.log(`This displays as ${testAdelaideView} in Adelaide`);
      return testDate;
    }

    // Compare the formatted strings - if our test time is earlier than target in Adelaide,
    // we need to increase our UTC time
    if (testAdelaideView < targetAdelaideString) {
      low = mid + 1000; // Add 1 second
    } else {
      high = mid - 1000; // Subtract 1 second
    }
  }

  // Use the best approximation we found
  const result = new Date(Math.floor((low + high) / 2));
  const finalAdelaideView = adelaideTZFormatter.format(result).replace(/\//g, '-');

  console.log(`Final UTC time: ${result.toISOString()}`);
  console.log(`This displays as ${finalAdelaideView} in Adelaide`);

  return result;
}
