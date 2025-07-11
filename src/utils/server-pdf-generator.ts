/**
 * Server-side PDF generation utility for Theatre Shifts
 * Generates PDFs using the same structure as the client-side implementation
 */

import type { PDFData } from "./pdf-generator.ts";

// Import jsPDF for server-side use
import { jsPDF } from "jspdf";

interface ShiftRow {
  id: number;
  show_id: number;
  show_name: string;
  show_date_id: number;
  role: string;
  arrive_time: string;
  depart_time: string;
  show_date: string;
  start_time: string;
  end_time: string;
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

/**
 * Generates a PDF buffer using the same logic as the client-side implementation
 */
export async function generateServerSidePDF(data: PDFData): Promise<Uint8Array> {
  // Helper to extract HH:mm from a string like 'Thu Jul 17 2025 14:45:00 GMT+1000 (Australian Eastern Standard Time)' or ISO string
  function extractTime(str: unknown): string {
    if (!str) return '';
    if (typeof str === 'string') {
      // Try ISO first
      const match = str.match(/T(\d{2}:\d{2})/);
      if (match) return match[1];
    }
    // Try Date object or string
    const dateObj = new Date(str as string);
    if (!isNaN(dateObj.getTime())) {
      return String(dateObj.getHours()).padStart(2, '0') + ':' + String(dateObj.getMinutes()).padStart(2, '0');
    }
    // Fallback: just return the string
    return String(str);
  }

  // (+1d) if depart is on the next day
  function plusOneDayIfNeeded(arrive: unknown, depart: unknown): string {
    if (!arrive || !depart) return '';
    const a = new Date(arrive as string);
    const d = new Date(depart as string);
    if (!isNaN(a.getTime()) && !isNaN(d.getTime())) {
      if (d.getDate() !== a.getDate() || d.getMonth() !== a.getMonth() || d.getFullYear() !== a.getFullYear()) {
        return ' (+1d)';
      }
    }
    return '';
  }
  // Function to add footer to current page
  function addPageFooter(doc: jsPDF, pageWidth: number, pageHeight: number, margin: number) {
    // Website info at bottom left
    doc.setFontSize(9);
    const websiteUrl = Deno.env.get("BASE_URL") || "Adelaide Repertory Theatre";
    const infoText = `Login for the most up-to-date roster: ${websiteUrl}`;
    doc.text(infoText, margin, pageHeight - margin);
    
    // Generated date/time at bottom right (in adelaide timezone)  
    doc.setFontSize(9);
    const generatedText = `Printed: ${formatCurrentDateAdelaide()} ${formatCurrentTimeAdelaide()}`;
    const textWidth = doc.getTextWidth(generatedText);
    doc.text(generatedText, pageWidth - margin - textWidth, pageHeight - margin);
  }

  try {
    // Wait a moment for any async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // First page: landscape
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    let pageWidth = 297;
    let pageHeight = 210;
    const margin = 10;
    const calendarMargin = 5; // Margin for calendar cells
    const contentWidth = pageWidth - (2 * margin);
    const maxY = pageHeight - margin - 15; // Leave space for footer
    
    let yPos = margin + 5;
    
    // Title
    doc.setFontSize(20);
    const volunteerName = data.volunteer?.name || 'Unknown';
    doc.text(`Theatre Shifts for ${volunteerName}`, margin, yPos);
    yPos += 10;
           
    // Add footer to first page
    addPageFooter(doc, pageWidth, pageHeight, margin);
    
    // Filter shifts to current month and future only
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    const currentMonthStart = new Date(currentYear, currentMonth, 1); // First day of current month
    
    // Group shifts by date - add validation and filter for current month and future
    const shiftsByDate: Record<string, ShiftRow[]> = {};
    const assignedShifts = (data.assignedShifts || []).filter(shift => {
      if (shift && shift.show_date) {
        const shiftDate = new Date(shift.show_date);
        // Include only shifts from current month onwards
        return shiftDate >= currentMonthStart;
      }
      return false;
    });
    
    assignedShifts.forEach(shift => {
      if (shift && shift.show_date) {
        // Handle show_date as Date or string
        let showDateStr = shift.show_date;
        if (Object.prototype.toString.call(showDateStr) === '[object Date]') {
          showDateStr = (showDateStr as unknown as Date).toISOString();
        }
        if (typeof showDateStr === 'string') {
          const date = showDateStr.split('T')[0]; // Get YYYY-MM-DD part
          if (!shiftsByDate[date]) {
            shiftsByDate[date] = [];
          }
          shiftsByDate[date].push(shift);
        }
      }
    });
    
    // Assigned Shifts Details table (on first page)
    doc.setFontSize(16);
    doc.text('Assigned Shifts (Current Month On-wards)', margin, yPos);
    yPos += 10;
    
    if (assignedShifts.length === 0) {
      doc.setFontSize(10);
      doc.text('No shifts assigned for current month and future.', margin, yPos);
      yPos += 10;
    } else {
      // Table headers
      doc.setFontSize(10);
      doc.setFont("helvetica", 'bold');
      // Adjusted column widths for landscape, with Show Name wider and all columns shifted right
      const colWidths = [38, 90, 70, 34, 34]; // Date, Show, Role, Arrive, Depart
      const headers = ['Date', 'Show Name', 'Role', 'Arrive Time', 'Depart Time'];
      let xPos = margin + 8; // Shift all columns right for better alignment

      // Draw header row
      headers.forEach((header, i) => {
        doc.text(header, xPos, yPos);
        xPos += colWidths[i];
      });
      yPos += 8;

      // Draw header underline
      doc.line(margin + 8, yPos - 2, margin + 8 + colWidths.reduce((a, b) => a + b, 0), yPos - 2);
      yPos += 5;
      
      // Sort shifts by date, then by arrive time
      const sortedDates = Object.keys(shiftsByDate).sort();
      const allShiftsForTable: ShiftRow[] = [];
      
      sortedDates.forEach(date => {
        const shiftsOnDate = shiftsByDate[date];
        shiftsOnDate.forEach(shift => {
          allShiftsForTable.push(shift);
        });
      });
      
      // Sort all shifts by date, then by arrive time
      allShiftsForTable.sort((a, b) => {
        const dateCompare = new Date(a.show_date).getTime() - new Date(b.show_date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return new Date(a.arrive_time).getTime() - new Date(b.arrive_time).getTime();
      });
      
      doc.setFont("helvetica", 'normal');
      
      allShiftsForTable.forEach(shift => {
        // Check if we need a new page
        if (yPos > maxY - 15) {
          doc.addPage('a4', 'landscape');
          pageWidth = 297;
          pageHeight = 210;
          yPos = margin + 10;

          // Add footer to new page
          addPageFooter(doc, pageWidth, pageHeight, margin);

          // Redraw headers on new page
          doc.setFont("helvetica", 'bold');
          xPos = margin + 8;
          headers.forEach((header, i) => {
            doc.text(header, xPos, yPos);
            xPos += colWidths[i];
          });
          yPos += 8;
          doc.line(margin + 8, yPos - 2, margin + 8 + colWidths.reduce((a, b) => a + b, 0), yPos - 2);
          yPos += 5;
          doc.setFont("helvetica", 'normal');
        }

        xPos = margin + 8;

        // Date: show only YYYY-MM-DD part
        const formattedDate = (shift.show_date && typeof shift.show_date === 'string') ? shift.show_date.split('T')[0] : '';
        const showName = (shift.show_name || 'Unknown Show').substring(0, 50);
        const role = (shift.role || '').substring(0, 35);


        const arriveTime = extractTime(shift.arrive_time);
        const departTime = extractTime(shift.depart_time) + plusOneDayIfNeeded(shift.arrive_time, shift.depart_time);

        const rowData = [formattedDate, showName, role, arriveTime, departTime];

        rowData.forEach((data, i) => {
          // Ensure all values are strings for jsPDF
          doc.text(String(data), xPos, yPos);
          xPos += colWidths[i];
        });

        yPos += 7;
      });
    }
    
    // Start calendars on new page if we have shifts
    if (Object.keys(shiftsByDate).length > 0) {
      // Switch to portrait for calendar pages
      doc.addPage('a4', 'portrait');
      pageWidth = 210;
      pageHeight = 297;
      yPos = margin;

      // Add footer to calendar page
      addPageFooter(doc, pageWidth, pageHeight, margin);

      // Get unique months with shifts
      const monthsWithShifts = new Set<string>();
      Object.keys(shiftsByDate).forEach(dateStr => {
        const date = new Date(dateStr);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthsWithShifts.add(monthKey);
      });

      const sortedMonths = Array.from(monthsWithShifts).sort();
      let calendarsOnPage = 0;
      const maxCalendarsPerPage = 2;

      sortedMonths.forEach((monthKey) => {
        const [year, month] = monthKey.split('-').map(Number);
        const monthDate = new Date(year, month - 1, 1);

        // Check if we need a new page (2 calendars per page)
        if (calendarsOnPage >= maxCalendarsPerPage) {
          doc.addPage('a4', 'portrait');
          pageWidth = 210;
          pageHeight = 297;
          yPos = margin;
          calendarsOnPage = 0;

          // Add footer to new calendar page
          addPageFooter(doc, pageWidth, pageHeight, margin);
        }

        // Draw calendar for this month
        // For portrait, recalculate contentWidth
        const calendarWidth = pageWidth - (2 * calendarMargin);
        const cellWidth = calendarWidth / 7;
        const cellHeight = 20;

        // Month and year title
        doc.setFontSize(14);
        doc.setFont("helvetica", 'bold');
        const monthName = monthDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
        doc.text(monthName, calendarMargin, yPos);
        yPos += 6;

        // Day headers
        const dayHeaders = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        doc.setFontSize(9);
        doc.setFont("helvetica", 'bold');
        for (let i = 0; i < 7; i++) {
          const x = calendarMargin + (i * cellWidth);
          doc.text(dayHeaders[i].substring(0, 3), x + 2, yPos);
        }
        yPos += 3;

        // Draw calendar grid
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const daysInMonth = lastDay.getDate();
        const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
        // Adjust for Monday start: Sunday becomes 6, Monday becomes 0, etc.
        const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

        let dayCount = 1;
        let row = 0;
        const maxRows = 6;

        while (dayCount <= daysInMonth && row < maxRows) {
          for (let col = 0; col < 7; col++) {
            const x = calendarMargin + (col * cellWidth);
            const y = yPos + (row * cellHeight);

            // Determine if this cell is a valid date
            const isDateCell = !(row === 0 && col < adjustedFirstDay) && (dayCount <= daysInMonth);
            let hasShifts = false;
            let dateStr = '';
            if (isDateCell) {
              dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayCount).padStart(2, '0')}`;
              hasShifts = !!shiftsByDate[dateStr];
            }

            // Grey out cells that are not valid dates
            if (!isDateCell) {
              doc.setFillColor(220, 220, 220); // light grey
              doc.rect(x, y, cellWidth, cellHeight, 'F');
              doc.setDrawColor(180, 180, 180); // slightly darker border
              doc.rect(x, y, cellWidth, cellHeight);
              doc.setDrawColor(0, 0, 0); // reset to black
            } else {
              // Draw normal or thick border for date cells
              if (hasShifts) {
                doc.setLineWidth(1.2); // Thicker border for days with shifts
                doc.setDrawColor(0, 0, 0); // Ensure border is black
                doc.rect(x, y, cellWidth, cellHeight);
                doc.setLineWidth(0.2); // Reset to default
              } else {
                doc.rect(x, y, cellWidth, cellHeight);
              }
            }

            if (isDateCell) {
              // Day number
              doc.setFontSize(10);
              if (hasShifts) {
                doc.setFont("helvetica", 'bold');
              } else {
                doc.setFont("helvetica", 'normal');
              }
              doc.text(dayCount.toString(), x + 2, y + 4);
              doc.setFont("helvetica", 'normal');

              // If this day has shifts, print each shift's arrive and depart time
              if (hasShifts) {
                let shiftY = y + 9;
                doc.setFontSize(8);
                shiftsByDate[dateStr].forEach(shift => {
                  // Use extractTime and plusOneDayIfNeeded as above
                  const arrive = extractTime(shift.arrive_time);
                  const depart = extractTime(shift.depart_time) + plusOneDayIfNeeded(shift.arrive_time, shift.depart_time);
                  doc.text(`${arrive} - ${depart}`, x + 1, shiftY);
                  shiftY += 5;
                });
              }

              dayCount++;
            }
          }
          row++;
        }

        yPos += (row * cellHeight) + 10;
        calendarsOnPage++;
      });
    }
    
    // Generate the PDF as a Uint8Array
    const pdfData = doc.output('arraybuffer');
    return new Uint8Array(pdfData);
    
  } catch (error) {
    console.error('Server-side PDF generation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`PDF generation failed: ${errorMessage}`);
  }
}
