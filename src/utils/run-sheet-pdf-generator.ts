/**
 * Run Sheet PDF generation utility for Theatre Shifts
 * Generates landscape PDFs with time-based tables showing staff and unfilled shifts for a specific performance
 */

import { jsPDF } from "jspdf";

interface RunSheetParticipant {
  name: string;
  role: string;
  arriveTime: string;
  departTime: string;
}

interface RunSheetUnfilledShift {
  role: string;
  arriveTime: string;
  departTime: string;
  date: string;
}

interface RunSheetData {
  showName: string;
  date: string;
  performanceTime: string;
  participants: RunSheetParticipant[];
  unfilledShifts: RunSheetUnfilledShift[];
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

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Australia/Adelaide'
    });
  } catch {
    return dateStr;
  }
}

// Convert time string to minutes since midnight for calculations
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert minutes since midnight back to time string
function _minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Generate 15-minute time intervals for the day
function generateTimeSlots(startHour: number = 6, endHour: number = 24): string[] {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return slots;
}

// Helper function to truncate text with ellipsis
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generates a PDF buffer for the performance run sheet
 */
export function generateRunSheetPDF(data: RunSheetData): Uint8Array {
  // Create landscape PDF
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10; // Reduced margins to fit more content
  let currentY = margin;

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("THEATRE SHIFTS - PERFORMANCE RUNNING SHEET", pageWidth / 2, currentY, { align: "center" });
  currentY += 6;

  // Show Information
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const infoText = `${data.showName} | ${formatDate(data.date)} | Performance: ${data.performanceTime}`;
  doc.text(infoText, pageWidth / 2, currentY, { align: "center" });
  currentY += 15;

  // Determine time range based on participants for THIS performance only
  let earliestTime = 23 * 60 + 59; // Start with late time
  let latestTime = 0;

  // Check participant times (only for current performance)
  data.participants.forEach(p => {
    const arriveMinutes = timeToMinutes(p.arriveTime);
    const departMinutes = timeToMinutes(p.departTime);
    earliestTime = Math.min(earliestTime, arriveMinutes);
    latestTime = Math.max(latestTime, departMinutes);
  });

  // If no participants, set reasonable defaults
  if (data.participants.length === 0) {
    earliestTime = 9 * 60; // 9:00 AM
    latestTime = 17 * 60;  // 5:00 PM
  }

  // Add buffer and limit to maximum 1 hour either side
  const bufferHours = 1;
  const earliestHour = Math.floor(earliestTime / 60);
  const latestHour = Math.ceil(latestTime / 60);
  
  // Apply buffer but limit to reasonable bounds
  const actualStartHour = Math.max(6, earliestHour - bufferHours); // Not before 6 AM
  const actualEndHour = Math.min(24, latestHour + bufferHours); // Not after midnight

  // Generate time slots in 15-minute intervals
  const timeSlots = generateTimeSlots(actualStartHour, actualEndHour);

  if (data.participants.length === 0) {
    doc.setFontSize(12);
    doc.text("No staff assigned for this performance.", margin, currentY);
    currentY += 20;
  } else {
    // Calculate column widths
    const nameColWidth = 30; // Slightly increased for max 20 chars + (...)
    const roleColWidth = 35; // Increased for max 30 chars
    const timeColWidth = (pageWidth - margin * 2 - nameColWidth - roleColWidth) / timeSlots.length;

    // Table header
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    // Headers
    doc.text("Name", margin, currentY);
    doc.text("Role", margin + nameColWidth, currentY);
    
    // Time headers (rotated)
    timeSlots.forEach((time, index) => {
      const x = margin + nameColWidth + roleColWidth + (index * timeColWidth) + timeColWidth / 2;
      doc.text(time, x, currentY, { angle: 45 });
    });

    currentY += 2;

    // Draw header line
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    // Table rows (participants sorted by first name)
    doc.setFont("helvetica", "normal");
    const sortedParticipants = [...data.participants].sort((a, b) => a.name.localeCompare(b.name));
    
    // Draw light gray vertical lines for time columns
    doc.setDrawColor(200, 200, 200); // Light gray
    doc.setLineWidth(0.2);
    timeSlots.forEach((_, index) => {
      const x = margin + nameColWidth + roleColWidth + (index * timeColWidth);
      doc.line(x, currentY - 3, x, currentY + (sortedParticipants.length * 8) + 2);
    });
    // Final vertical line
    const finalX = margin + nameColWidth + roleColWidth + (timeSlots.length * timeColWidth);
    doc.line(finalX, currentY - 3, finalX, currentY + (sortedParticipants.length * 8) + 2);
    
    doc.setDrawColor(0, 0, 0); // Reset to black
    doc.setLineWidth(0.5);
    
    // Extract performance start and end times for highlighting
    const perfTimes = data.performanceTime.split(' - ');
    let performanceStartMinutes = 0;
    let performanceEndMinutes = 0;
    if (perfTimes.length === 2) {
      performanceStartMinutes = timeToMinutes(perfTimes[0]);
      performanceEndMinutes = timeToMinutes(perfTimes[1]);
    }
    
    // Draw light gray highlighting for performance time across all rows
    if (performanceStartMinutes > 0 && performanceEndMinutes > 0) {
      doc.setFillColor(190, 190, 190); // Very light gray
      timeSlots.forEach((time, index) => {
        const timeMinutes = timeToMinutes(time);
        if (timeMinutes >= performanceStartMinutes && timeMinutes < performanceEndMinutes) {
          const x = margin + nameColWidth + roleColWidth + (index * timeColWidth);
          // Draw background for entire table height
          doc.rect(x, currentY - 6, timeColWidth, (sortedParticipants.length * 8) + 6, 'F');
        }
      });
      
      // Add label below the highlighted area to explain what it represents
      const labelY = currentY + (sortedParticipants.length * 8) + 5;
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      
      // Find the X position where the performance starts
      let performanceLabelX = margin + nameColWidth + roleColWidth;
      timeSlots.forEach((time, index) => {
        const timeMinutes = timeToMinutes(time);
        if (timeMinutes >= performanceStartMinutes) {
          if (performanceLabelX === margin + nameColWidth + roleColWidth) {
            // First time slot that matches performance start
            performanceLabelX = margin + nameColWidth + roleColWidth + (index * timeColWidth);
          }
        }
      });
      
      doc.text(`Performance: ${data.performanceTime}`, performanceLabelX, labelY);
    }
    
    sortedParticipants.forEach((participant, rowIndex) => {
      const rowY = currentY + (rowIndex * 8);
      
      // Check if we need a new page
      if (rowY > pageHeight - 40) {
        doc.addPage('landscape');
        currentY = margin;
        // Repeat headers on new page
        doc.setFont("helvetica", "bold");
        doc.text("Name", margin, currentY);
        doc.text("Role", margin + nameColWidth, currentY);
        timeSlots.forEach((time, index) => {
          const x = margin + nameColWidth + roleColWidth + (index * timeColWidth) + timeColWidth / 2;
          doc.text(time, x, currentY - 2, { angle: 45 });
        });
        currentY += 8;
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 3;
        rowIndex = 0;
      }

      const actualRowY = currentY + (rowIndex * 8);

      // Name and role (truncated)
      doc.setFont("helvetica", "normal");
      doc.text(truncateText(participant.name, 20), margin, actualRowY);
      doc.text(truncateText(participant.role, 30), margin + nameColWidth, actualRowY);

      // Highlight time slots when person is working
      const arriveMinutes = timeToMinutes(participant.arriveTime);
      const departMinutes = timeToMinutes(participant.departTime);

      // Find first and last highlighted slots for time labels
      let firstHighlightX: number | null = null;
      let lastHighlightX: number | null = null;

      timeSlots.forEach((time, index) => {
        const timeMinutes = timeToMinutes(time);
        const x = margin + nameColWidth + roleColWidth + (index * timeColWidth);
        
        // If this time slot is within the person's working hours
        if (timeMinutes >= arriveMinutes && timeMinutes < departMinutes) {
          // Draw highlight background
          doc.setFillColor(10, 36, 99); // Dark blue highlight (RGB)
          doc.rect(x, actualRowY - 3, timeColWidth, 6, 'F');
          
          // Track first and last highlighted positions
          if (firstHighlightX === null) firstHighlightX = x;
          lastHighlightX = x + timeColWidth;
        }
      });

      // Add arrive and depart time labels at the ends of the highlight bar
      if (firstHighlightX !== null && lastHighlightX !== null) {
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255); // White text
        doc.text(participant.arriveTime, firstHighlightX + 1, actualRowY);
        doc.text(participant.departTime, lastHighlightX - doc.getTextWidth(participant.departTime) - 1, actualRowY);
        doc.setTextColor(0, 0, 0); // Reset to black
        doc.setFontSize(9);
      }
    });

    currentY += (sortedParticipants.length * 8) + 15; // Extra space for performance label
  }

  // Unfilled Shifts section - compact format with dates in bold
  if (data.unfilledShifts.length > 0) {
    // Check if we need a new page
    if (currentY > pageHeight - 50) {
      doc.addPage('landscape');
      currentY = margin;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("UNFILLED SHIFTS", margin, currentY);
    currentY += 8;

    // Group unfilled shifts by date
    const shiftsByDate = new Map<string, typeof data.unfilledShifts>();
    data.unfilledShifts.forEach(shift => {
      if (!shiftsByDate.has(shift.date)) {
        shiftsByDate.set(shift.date, []);
      }
      shiftsByDate.get(shift.date)!.push(shift);
    });

    doc.setFontSize(9);
    
    // Sort dates
    const sortedDates = Array.from(shiftsByDate.keys()).sort();
    
    // Build compact text: **Date** ROLE (TIME), ROLE_2 (TIME_2). **DATE_2** ROLE (TIME)
    const compactParts: string[] = [];
    
    sortedDates.forEach(date => {
      const shifts = shiftsByDate.get(date)!;
      
      // Format date
      const formattedDate = new Date(date).toLocaleDateString('en-AU', {
        day: '2-digit',
        month: '2-digit'
      });
      
      // Format shifts for this date
      const shiftsText = shifts.map(shift => 
        `${shift.role} (${shift.arriveTime}-${shift.departTime})`
      ).join(', ');
      
      compactParts.push(`**${formattedDate}** ${shiftsText}`);
    });
    
    // Join all parts with '. ' separator
    const fullCompactText = compactParts.join('. ');
    
    // Split long text into multiple lines if needed
    const textLines = doc.splitTextToSize(fullCompactText, pageWidth - margin * 2);
    textLines.forEach((line: string) => {
      // Handle bold dates in the line
      if (line.includes('**')) {
        let currentX = margin;
        const parts = line.split('**');
        
        parts.forEach((part, index) => {
          if (index % 2 === 1) {
            // This is a date part (between **), make it bold
            doc.setFont("helvetica", "bold");
            doc.text(part, currentX, currentY);
            currentX += doc.getTextWidth(part);
            doc.setFont("helvetica", "normal");
          } else {
            // This is regular text
            doc.text(part, currentX, currentY);
            currentX += doc.getTextWidth(part);
          }
        });
        currentY += 5;
      } else {
        // Line doesn't contain bold markers, print normally
        doc.setFont("helvetica", "normal");
        doc.text(line, margin, currentY);
        currentY += 5;
      }
    });
  } else {
    if (currentY > pageHeight - 30) {
      doc.addPage('landscape');
      currentY = margin;
    }
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("All shifts are filled.", margin, currentY);
  }

  // Footer
  if (currentY > pageHeight - 25) {
    doc.addPage('landscape');
    currentY = margin;
  }
  
  currentY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Theatre Shifts Management System", margin, currentY);
  doc.text(`Generated: ${formatCurrentDateAdelaide()} at ${formatCurrentTimeAdelaide()}`, pageWidth - margin, currentY, { align: "right" });

  // Return PDF as Uint8Array
  const pdfOutput = doc.output('arraybuffer');
  return new Uint8Array(pdfOutput);
}
