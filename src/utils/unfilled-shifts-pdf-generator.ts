/**
 * Unfilled Shifts PDF generation utility for Theatre Shifts
 * Generates PDFs showing all unfilled shifts requiring attention
 */

import { getPool } from "../models/db.ts";
import { jsPDF } from "jspdf";

interface UnfilledShift {
  id: number;
  show_date_id: number;
  show_name: string;
  date: string;
  show_start: string;
  show_end: string;
  role: string;
  arrive_time: string;
  depart_time: string;
}

interface UnfilledShiftsData {
  shifts: UnfilledShift[];
  generatedAt: string;
  totalShifts: number;
  affectedShows: number;
  performanceDates: number;
}

// Helper functions for date/time formatting (Adelaide timezone)
function formatCurrentDateAdelaide(): string {
  const now = new Date();
  return now.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Australia/Adelaide'
  });
}

function formatCurrentTimeAdelaide(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Adelaide'
  });
}

function extractTime(str: string): string {
  if (!str) return '';
  // Try ISO first
  const match = str.match(/T(\d{2}:\d{2})/);
  if (match) return match[1];
  
  // Try Date object or string
  const dateObj = new Date(str);
  if (!isNaN(dateObj.getTime())) {
    return String(dateObj.getHours()).padStart(2, '0') + ':' + String(dateObj.getMinutes()).padStart(2, '0');
  }
  return str;
}

function plusOneDayIfNeeded(arrive: string, depart: string): string {
  if (!arrive || !depart) return '';
  const a = new Date(arrive);
  const d = new Date(depart);
  if (!isNaN(a.getTime()) && !isNaN(d.getTime())) {
    if (d.getDate() !== a.getDate() || d.getMonth() !== a.getMonth() || d.getFullYear() !== a.getFullYear()) {
      return ' (+1d)';
    }
  }
  return '';
}

/**
 * Fetches unfilled shifts data from the database
 */
async function getUnfilledShiftsData(): Promise<UnfilledShiftsData> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.queryObject<UnfilledShift>(
      `SELECT s.id, s.show_date_id, sh.name as show_name, DATE(sd.start_time) as date,
              TO_CHAR(sd.start_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as show_start, 
              TO_CHAR(sd.end_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as show_end,
              s.role, 
              TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as arrive_time, 
              TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as depart_time
       FROM shifts s
       JOIN show_dates sd ON sd.id = s.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       LEFT JOIN participant_shifts vs ON vs.shift_id = s.id
       GROUP BY s.id, sh.name, DATE(sd.start_time), sd.start_time, sd.end_time, s.role, s.arrive_time, s.depart_time
       HAVING COUNT(vs.participant_id) = 0
       ORDER BY DATE(sd.start_time), s.arrive_time`
    );

    const shifts = result.rows;
    const uniqueShows = new Set(shifts.map(s => s.show_name));
    const uniqueDates = new Set(shifts.map(s => s.date));

    return {
      shifts,
      generatedAt: formatCurrentDateAdelaide() + ' ' + formatCurrentTimeAdelaide(),
      totalShifts: shifts.length,
      affectedShows: uniqueShows.size,
      performanceDates: uniqueDates.size
    };
  } finally {
    client.release();
  }
}

// Function to add footer to current page
function addPageFooter(doc: jsPDF, pageWidth: number, pageHeight: number, margin: number, generatedAt: string) {
  // Website info at bottom left
  doc.setFontSize(9);
  const websiteUrl = Deno.env.get("BASE_URL") || "Adelaide Repertory Theatre";
  const infoText = `Login for updates: ${websiteUrl}`;
  doc.text(infoText, margin, pageHeight - margin);
  
  // Generated date/time at bottom right
  const generatedText = `Generated: ${generatedAt}`;
  const textWidth = doc.getTextWidth(generatedText);
  doc.text(generatedText, pageWidth - margin - textWidth, pageHeight - margin);
}

/**
 * Generates a PDF of unfilled shifts
 */
export async function generateUnfilledShiftsPDF(): Promise<Uint8Array> {
  try {
    const data = await getUnfilledShiftsData();
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - (2 * margin);
    let yPos = margin + 5;

    // Title
    doc.setFontSize(24);
    doc.setFont("helvetica", 'bold');
    doc.text('Unfilled Shifts Report', margin, yPos);
    yPos += 15;

    // Summary stats
    doc.setFontSize(12);
    doc.setFont("helvetica", 'normal');
    doc.text(`Report Generated: ${data.generatedAt}`, margin, yPos);
    yPos += 8;

    if (data.totalShifts === 0) {
      doc.setFontSize(16);
      doc.setFont("helvetica", 'bold');
      doc.text('All Shifts Filled!', margin, yPos);
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", 'normal');
      doc.text('Excellent! All shifts currently have participants assigned.', margin, yPos);
      yPos += 8;
      doc.text('Great job on the coordination!', margin, yPos);
    } else {
      // Alert message
      doc.setFillColor(248, 215, 218); // Light red background
      doc.rect(margin, yPos - 2, contentWidth, 15, 'F');
      doc.setDrawColor(245, 198, 203);
      doc.rect(margin, yPos - 2, contentWidth, 15);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", 'bold');
      const alertLine1 = `ATTENTION REQUIRED!`;
      const alertLine2 = `${data.totalShifts} unfilled shift${data.totalShifts !== 1 ? 's' : ''} need${data.totalShifts === 1 ? 's' : ''} participants assigned.`;
      doc.text(alertLine1, margin + 2, yPos + 5);
      doc.text(alertLine2, margin + 2, yPos + 11);
      yPos += 21;

      // Stats boxes
      const statBoxWidth = (contentWidth - 20) / 3;
      const statBoxHeight = 25;
      
      // Total Shifts
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, yPos, statBoxWidth, statBoxHeight, 'FD');
      doc.setFontSize(20);
      doc.setFont("helvetica", 'bold');
      const totalText = data.totalShifts.toString();
      const totalTextWidth = doc.getTextWidth(totalText);
      doc.text(totalText, margin + (statBoxWidth / 2) - (totalTextWidth / 2), yPos + 12);
      doc.setFontSize(9);
      doc.setFont("helvetica", 'normal');
      const totalLabelWidth = doc.getTextWidth('Unfilled Shifts');
      doc.text('Unfilled Shifts', margin + (statBoxWidth / 2) - (totalLabelWidth / 2), yPos + 20);

      // Shows Affected
      doc.setFillColor(255, 255, 255);
      doc.rect(margin + statBoxWidth + 10, yPos, statBoxWidth, statBoxHeight, 'FD');
      doc.setFontSize(20);
      doc.setFont("helvetica", 'bold');
      const showsText = data.affectedShows.toString();
      const showsTextWidth = doc.getTextWidth(showsText);
      doc.text(showsText, margin + statBoxWidth + 10 + (statBoxWidth / 2) - (showsTextWidth / 2), yPos + 12);
      doc.setFontSize(9);
      doc.setFont("helvetica", 'normal');
      const showsLabelWidth = doc.getTextWidth('Shows Affected');
      doc.text('Shows Affected', margin + statBoxWidth + 10 + (statBoxWidth / 2) - (showsLabelWidth / 2), yPos + 20);

      // Performance Dates
      doc.setFillColor(255, 255, 255);
      doc.rect(margin + (statBoxWidth + 10) * 2, yPos, statBoxWidth, statBoxHeight, 'FD');
      doc.setFontSize(20);
      doc.setFont("helvetica", 'bold');
      const datesText = data.performanceDates.toString();
      const datesTextWidth = doc.getTextWidth(datesText);
      doc.text(datesText, margin + (statBoxWidth + 10) * 2 + (statBoxWidth / 2) - (datesTextWidth / 2), yPos + 12);
      doc.setFontSize(9);
      doc.setFont("helvetica", 'normal');
      const datesLabelWidth = doc.getTextWidth('Performance Dates');
      doc.text('Performance Dates', margin + (statBoxWidth + 10) * 2 + (statBoxWidth / 2) - (datesLabelWidth / 2), yPos + 20);

      yPos += 35;

      // Shifts table
      doc.setFontSize(14);
      doc.setFont("helvetica", 'bold');
      doc.text('Unfilled Shifts Details', margin, yPos);
      yPos += 10;

      // Table headers
      doc.setFontSize(10);
      doc.setFont("helvetica", 'bold');
      const colWidths = [35, 80, 45, 30]; // Date, Show/Role, Times, Actions
      const headers = ['Date', 'Show & Role', 'Shift Times', 'Show Times'];
      let xPos = margin;

      headers.forEach((header, i) => {
        doc.text(header, xPos, yPos);
        xPos += colWidths[i];
      });
      yPos += 8;

      // Header underline
      doc.line(margin, yPos - 2, margin + colWidths.reduce((a, b) => a + b, 0), yPos - 2);
      yPos += 5;

      // Group shifts by performance
      const grouped = new Map<string, UnfilledShift[]>();
      for (const shift of data.shifts) {
        const key = `${shift.show_name} - ${shift.date}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(shift);
      }

      doc.setFont("helvetica", 'normal');

      for (const [_key, shiftsGroup] of grouped.entries()) {
        const firstShift = shiftsGroup[0];
        
        for (let i = 0; i < shiftsGroup.length; i++) {
          const shift = shiftsGroup[i];
          
          // Check if we need a new page
          if (yPos > pageHeight - 30) {
            addPageFooter(doc, pageWidth, pageHeight, margin, data.generatedAt);
            doc.addPage();
            yPos = margin + 10;
            
            // Redraw headers on new page
            doc.setFont("helvetica", 'bold');
            xPos = margin;
            headers.forEach((header, j) => {
              doc.text(header, xPos, yPos);
              xPos += colWidths[j];
            });
            yPos += 8;
            doc.line(margin, yPos - 2, margin + colWidths.reduce((a, b) => a + b, 0), yPos - 2);
            yPos += 5;
            doc.setFont("helvetica", 'normal');
          }

          xPos = margin;

          // Date (only show once per performance)
          if (i === 0) {
            const formattedDate = new Date(firstShift.date).toLocaleDateString('en-AU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
            doc.text(formattedDate, xPos, yPos);
          }
          xPos += colWidths[0];

          // Show & Role
          let currentRowY = yPos;
          if (i === 0) {
            doc.setFont("helvetica", 'bold');
            doc.text(shift.show_name, xPos, yPos);
            doc.setFont("helvetica", 'normal');
            currentRowY = yPos + 4; // Role will be 4 units below show name
            doc.text(shift.role, xPos, currentRowY);
          } else {
            doc.text(shift.role, xPos, currentRowY);
          }
          xPos += colWidths[1];

          // Shift Times (align with the role text, not show name)
          const arriveTime = extractTime(shift.arrive_time);
          const departTime = extractTime(shift.depart_time) + plusOneDayIfNeeded(shift.arrive_time, shift.depart_time);
          doc.text(`${arriveTime} - ${departTime}`, xPos, currentRowY);
          xPos += colWidths[2];

          // Show Times (only show once per performance, align with show name)
          if (i === 0) {
            doc.text(`${firstShift.show_start} - ${firstShift.show_end}`, xPos, yPos);
          }

          yPos += (i === 0 && shift.show_name.length > 20) ? 8 : 6;
        }
        
        yPos += 3; // Extra space between performances
      }
    }

    // Add footer to last page
    addPageFooter(doc, pageWidth, pageHeight, margin, data.generatedAt);

    // Generate the PDF as a Uint8Array
    const pdfData = doc.output('arraybuffer');
    return new Uint8Array(pdfData);

  } catch (error) {
    console.error('Unfilled shifts PDF generation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`PDF generation failed: ${errorMessage}`);
  }
}

/**
 * Generates a PDF of the next N outstanding shifts (for last minute shifts emails)
 */
export async function generateOutstandingShiftsPDF(limit: number = 10): Promise<Uint8Array> {
  try {
    const data = await getOutstandingShiftsData(limit);
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - (2 * margin);
    let yPos = margin + 5;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", 'bold');
    doc.text('Last Minute Shifts @ the Arts Theatre', margin, yPos);
    yPos += 12;

    // Subtitle
    doc.setFontSize(14);
    doc.setFont("helvetica", 'normal');
    doc.text(`Next ${limit} Outstanding Shifts`, margin, yPos);
    yPos += 10;

    // Summary stats
    doc.setFontSize(12);
    doc.setFont("helvetica", 'normal');
    doc.text(`Report Generated: ${data.generatedAt}`, margin, yPos);
    yPos += 8;

    if (data.totalShifts === 0) {
      doc.setFontSize(16);
      doc.setFont("helvetica", 'bold');
      doc.text('All Shifts Filled!', margin, yPos);
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", 'normal');
      doc.text('Excellent! All upcoming shifts currently have participants assigned.', margin, yPos);
      yPos += 8;
      doc.text('Thank you for being available to help when needed.', margin, yPos);
    } else {
      // Header message
      doc.setFillColor(255, 243, 205); // Light orange background
      doc.rect(margin, yPos - 2, contentWidth, 20, 'F');
      doc.setDrawColor(255, 193, 7);
      doc.rect(margin, yPos - 2, contentWidth, 20);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", 'bold');
      doc.text(`We need your help! ${data.totalShifts} shifts need volunteers.`, margin + 3, yPos + 5);
      doc.setFont("helvetica", 'normal');
      doc.text('Contact Jay (0434586878) if you can help with any of these shifts:', margin + 3, yPos + 12);
      
      yPos += 28;

      // Column headers
      doc.setFontSize(10);
      doc.setFont("helvetica", 'bold');
      doc.text('Date & Time', margin, yPos);
      doc.text('Show', margin + 50, yPos);
      doc.text('Role', margin + 110, yPos);
      doc.text('Arrive - Depart', margin + 150, yPos);
      yPos += 6;

      // Line under headers
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPos, margin + contentWidth, yPos);
      yPos += 5;

      // List shifts
      doc.setFont("helvetica", 'normal');
      for (const shift of data.shifts) {
        // Check if we need a new page
        if (yPos > pageHeight - 40) {
          addPageFooter(doc, pageWidth, pageHeight, margin, data.generatedAt);
          doc.addPage();
          yPos = margin + 5;
        }

        const date = new Date(shift.date).toLocaleDateString('en-AU', {
          weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
        });
        const arriveTime = extractTime(shift.arrive_time);
        const departTime = extractTime(shift.depart_time) + plusOneDayIfNeeded(shift.arrive_time, shift.depart_time);

        doc.text(date, margin, yPos);
        doc.text(shift.show_name, margin + 50, yPos);
        doc.text(shift.role.length > 26 ? shift.role.slice(0, 20) + '...' : shift.role, margin + 110, yPos);
        doc.text(`${arriveTime} - ${departTime}`, margin + 150, yPos);
        
        yPos += 5;
      }

      yPos += 10;

      // Contact information
      doc.setFillColor(248, 249, 250); // Light gray background
      doc.rect(margin, yPos - 2, contentWidth, 25, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPos - 2, contentWidth, 25);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", 'bold');
      doc.text('To confirm last minute shifts or last minute sickness:', margin + 3, yPos + 6);
      doc.setFontSize(14);
      doc.text('Please message or call Jay - 0434586878', margin + 3, yPos + 15);
    }

    // Add footer to last page
    addPageFooter(doc, pageWidth, pageHeight, margin, data.generatedAt);

    // Generate the PDF as a Uint8Array
    const pdfData = doc.output('arraybuffer');
    return new Uint8Array(pdfData);

  } catch (error) {
    console.error('Outstanding shifts PDF generation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Outstanding shifts PDF generation failed: ${errorMessage}`);
  }
}

/**
 * Generates a PDF of outstanding shifts for a specific volunteer (excluding shifts that overlap with their existing shifts)
 */
export async function generateOutstandingShiftsPDFForVolunteer(volunteerId: string, limit: number = 10): Promise<Uint8Array> {
  try {
    const data = await getOutstandingShiftsDataForVolunteer(volunteerId, limit);
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - (2 * margin);
    let yPos = margin + 5;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", 'bold');
    doc.text('Last Minute Shifts @ the Arts Theatre', margin, yPos);
    yPos += 12;

    // Subtitle
    doc.setFontSize(14);
    doc.setFont("helvetica", 'normal');
    doc.text(`Available Shifts for You`, margin, yPos);
    yPos += 10;

    // Summary stats
    doc.setFontSize(12);
    doc.setFont("helvetica", 'normal');
    doc.text(`Report Generated: ${data.generatedAt}`, margin, yPos);
    yPos += 8;

    if (data.totalShifts === 0) {
      doc.setFontSize(16);
      doc.setFont("helvetica", 'bold');
      doc.text('No Available Shifts', margin, yPos);
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", 'normal');
      doc.text('Either all shifts are filled, or the remaining unfilled shifts', margin, yPos);
      yPos += 6;
      doc.text('conflict with your current schedule. Thank you for volunteering!', margin, yPos);
    } else {
      // Header message
      doc.setFillColor(255, 243, 205); // Light orange background
      doc.rect(margin, yPos - 2, contentWidth, 25, 'F');
      doc.setDrawColor(255, 193, 7);
      doc.rect(margin, yPos - 2, contentWidth, 25);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", 'bold');
      doc.text(`${data.totalShifts} shifts available that don't conflict with your schedule!`, margin + 3, yPos + 5);
      doc.setFont("helvetica", 'normal');
      doc.text('These shifts are filtered to exclude any that overlap with your existing', margin + 3, yPos + 12);
      doc.text('commitments. Contact Jay (0434586878) if you can help with any:', margin + 3, yPos + 19);
      
      yPos += 33;

      // Column headers
      doc.setFontSize(10);
      doc.setFont("helvetica", 'bold');
      doc.text('Date & Time', margin, yPos);
      doc.text('Show', margin + 50, yPos);
      doc.text('Role', margin + 110, yPos);
      doc.text('Arrive - Depart', margin + 150, yPos);
      yPos += 6;

      // Line under headers
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPos, margin + contentWidth, yPos);
      yPos += 5;

      // List shifts
      doc.setFont("helvetica", 'normal');
      for (const shift of data.shifts) {
        // Check if we need a new page
        if (yPos > pageHeight - 40) {
          addPageFooter(doc, pageWidth, pageHeight, margin, data.generatedAt);
          doc.addPage();
          yPos = margin + 5;
        }

        const date = new Date(shift.date).toLocaleDateString('en-AU', {
          weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
        });
        const arriveTime = extractTime(shift.arrive_time);
        const departTime = extractTime(shift.depart_time) + plusOneDayIfNeeded(shift.arrive_time, shift.depart_time);

        doc.text(date, margin, yPos);
        doc.text(shift.show_name, margin + 50, yPos);
        doc.text(shift.role.length > 26 ? shift.role.slice(0, 20) + '...' : shift.role, margin + 110, yPos);
        doc.text(`${arriveTime} - ${departTime}`, margin + 150, yPos);
        
        yPos += 5;
      }

      yPos += 10;

      // Thank you message
      doc.setFontSize(12);
      doc.setFont("helvetica", 'normal');
      doc.text('Thank you for being part of our volunteer community!', margin, yPos);
      yPos += 5;
      
      // Contact message
      doc.setFontSize(14);
      doc.text('Please message or call Jay - 0434586878', margin + 3, yPos + 15);
    }

    // Add footer to last page
    addPageFooter(doc, pageWidth, pageHeight, margin, data.generatedAt);

    // Generate the PDF as a Uint8Array
    const pdfData = doc.output('arraybuffer');
    return new Uint8Array(pdfData);

  } catch (error) {
    console.error('Volunteer-specific outstanding shifts PDF generation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Volunteer-specific outstanding shifts PDF generation failed: ${errorMessage}`);
  }
}

// Helper function to get next N outstanding shifts
async function getOutstandingShiftsData(limit: number = 10): Promise<UnfilledShiftsData> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.queryObject<UnfilledShift>(
      `SELECT s.id, s.show_date_id, sh.name as show_name, DATE(sd.start_time) as date,
              TO_CHAR(sd.start_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as show_start, 
              TO_CHAR(sd.end_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as show_end,
              s.role, 
              TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as arrive_time, 
              TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as depart_time
       FROM shifts s
       JOIN show_dates sd ON sd.id = s.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       LEFT JOIN participant_shifts vs ON vs.shift_id = s.id
       WHERE sd.start_time >= NOW()
       GROUP BY s.id, sh.name, DATE(sd.start_time), sd.start_time, sd.end_time, s.role, s.arrive_time, s.depart_time
       HAVING COUNT(vs.participant_id) = 0
       ORDER BY sd.start_time, s.arrive_time
       LIMIT $1`,
      [limit]
    );

    const shifts = result.rows;
    const uniqueShows = new Set(shifts.map(s => s.show_name));
    const uniqueDates = new Set(shifts.map(s => s.date));

    return {
      shifts,
      generatedAt: formatCurrentDateAdelaide() + ' ' + formatCurrentTimeAdelaide(),
      totalShifts: shifts.length,
      affectedShows: uniqueShows.size,
      performanceDates: uniqueDates.size
    };
  } finally {
    client.release();
  }
}

// Helper function to get outstanding shifts for a specific volunteer (excluding overlapping shifts)
async function getOutstandingShiftsDataForVolunteer(volunteerId: string, limit: number = 10): Promise<UnfilledShiftsData> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.queryObject<UnfilledShift>(
      `SELECT s.id, s.show_date_id, sh.name as show_name, DATE(sd.start_time) as date,
              TO_CHAR(sd.start_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as show_start, 
              TO_CHAR(sd.end_time AT TIME ZONE 'Australia/Adelaide', 'HH24:MI') as show_end,
              s.role, 
              TO_CHAR(s.arrive_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as arrive_time, 
              TO_CHAR(s.depart_time AT TIME ZONE 'Australia/Adelaide', 'YYYY-MM-DD"T"HH24:MI:SS') as depart_time
       FROM shifts s
       JOIN show_dates sd ON sd.id = s.show_date_id
       JOIN shows sh ON sh.id = sd.show_id
       LEFT JOIN participant_shifts vs ON vs.shift_id = s.id
       WHERE sd.start_time >= NOW()
         AND s.id NOT IN (
           -- Exclude shifts that overlap with volunteer's existing shifts
           SELECT DISTINCT unfilled.id
           FROM shifts unfilled
           JOIN show_dates unfilled_sd ON unfilled_sd.id = unfilled.show_date_id
           JOIN shifts existing ON existing.id IN (
             SELECT ps.shift_id 
             FROM participant_shifts ps 
             WHERE ps.participant_id = $1
           )
           JOIN show_dates existing_sd ON existing_sd.id = existing.show_date_id
           WHERE unfilled_sd.start_time >= NOW()
             AND (
               -- Check for time overlap: shifts overlap if one starts before the other ends
               (unfilled.arrive_time < existing.depart_time AND unfilled.depart_time > existing.arrive_time)
               OR 
               -- Also check show date overlap as backup
               (unfilled_sd.start_time < existing_sd.end_time AND unfilled_sd.end_time > existing_sd.start_time)
             )
         )
       GROUP BY s.id, sh.name, DATE(sd.start_time), sd.start_time, sd.end_time, s.role, s.arrive_time, s.depart_time
       HAVING COUNT(vs.participant_id) = 0
       ORDER BY sd.start_time, s.arrive_time
       LIMIT $2`,
      [volunteerId, limit]
    );

    const shifts = result.rows;
    const uniqueShows = new Set(shifts.map(s => s.show_name));
    const uniqueDates = new Set(shifts.map(s => s.date));

    return {
      shifts,
      generatedAt: formatCurrentDateAdelaide() + ' ' + formatCurrentTimeAdelaide(),
      totalShifts: shifts.length,
      affectedShows: uniqueShows.size,
      performanceDates: uniqueDates.size
    };
  } finally {
    client.release();
  }
}
