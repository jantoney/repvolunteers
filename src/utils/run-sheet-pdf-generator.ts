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

interface RunSheetInterval {
  start_minutes: number;
  duration_minutes: number;
}

interface RunSheetData {
  showName: string;
  date: string;
  performanceTime: string;
  participants: RunSheetParticipant[];
  unfilledShifts: RunSheetUnfilledShift[];
  intervals: RunSheetInterval[];
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

// Helper function to draw a warning sign (yellow triangle with exclamation mark)
function drawWarningSign(doc: jsPDF, x: number, y: number, size: number = 20) {
  const halfSize = size / 2;

  // Triangle coordinates
  const x1 = x;
  const y1 = y - halfSize;

  const x2 = x - halfSize * Math.sin(Math.PI / 3);
  const y2 = y + halfSize / 2;

  const x3 = x + halfSize * Math.sin(Math.PI / 3);
  const y3 = y + halfSize / 2;

  // Draw triangle (yellow fill with black border)
  doc.setFillColor(255, 255, 0); // Yellow
  doc.setDrawColor(0, 0, 0);     // Black
  doc.triangle(x1, y1, x2, y2, x3, y3, 'FD');

}

// Helper function to check for overlapping shifts for the same person
function detectOverlappingShifts(participants: RunSheetParticipant[]): Set<string> {
  const overlappingPeople = new Set<string>();
  
  // Group participants by name
  const participantsByName = new Map<string, RunSheetParticipant[]>();
  participants.forEach(p => {
    if (!participantsByName.has(p.name)) {
      participantsByName.set(p.name, []);
    }
    participantsByName.get(p.name)!.push(p);
  });
  
  // Check each person for overlapping shifts
  participantsByName.forEach((shifts, name) => {
    if (shifts.length > 1) {
      // Check each pair of shifts for this person
      for (let i = 0; i < shifts.length; i++) {
        for (let j = i + 1; j < shifts.length; j++) {
          const shift1 = shifts[i];
          const shift2 = shifts[j];
          
          const start1 = timeToMinutes(shift1.arriveTime);
          const end1 = timeToMinutes(shift1.departTime);
          const start2 = timeToMinutes(shift2.arriveTime);
          const end2 = timeToMinutes(shift2.departTime);
          
          // Check for overlap: shifts overlap if one starts before the other ends
          if ((start1 < end2 && end1 > start2)) {
            overlappingPeople.add(name);
            break;
          }
        }
        if (overlappingPeople.has(name)) break;
      }
    }
  });
  
  return overlappingPeople;
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

  // Add buffer and limit to maximum 30 minutes either side
  const bufferMinutes = 30;
  const earliestHour = Math.floor((earliestTime - bufferMinutes) / 60);
  const latestHour = Math.ceil((latestTime + bufferMinutes) / 60);
  
  // Apply buffer but limit to reasonable bounds
  const actualStartHour = Math.max(6, earliestHour); // Not before 6 AM
  const actualEndHour = Math.min(24, latestHour); // Not after midnight

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
    
    // Detect people with overlapping shifts
    const overlappingPeople = detectOverlappingShifts(data.participants);
    
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
      
      // Draw interval bars as darker vertical lines over the performance block
      if (data.intervals && data.intervals.length > 0) {
        data.intervals.forEach(interval => {
          const intervalStartMinutes = performanceStartMinutes + interval.start_minutes;
          const intervalEndMinutes = intervalStartMinutes + interval.duration_minutes;
          
          // Track if we've drawn the label for this interval
          let labelDrawn = false;
          let firstBarX = 0;
          let totalBarWidth = 0;
          
          timeSlots.forEach((time, index) => {
            const timeMinutes = timeToMinutes(time);
            
            // Check if this time slot overlaps with the interval
            const slotStart = timeMinutes;
            const slotEnd = timeMinutes + 15; // 15-minute slots
            const overlapStart = Math.max(slotStart, intervalStartMinutes);
            const overlapEnd = Math.min(slotEnd, intervalEndMinutes);
            const overlapDuration = Math.max(0, overlapEnd - overlapStart);
            
            // If there's any overlap, draw proportional bar
            if (overlapDuration > 0) {
              const baseX = margin + nameColWidth + roleColWidth + (index * timeColWidth);
              
              // Calculate proportional positioning within the column
              const overlapStartOffset = Math.max(0, intervalStartMinutes - slotStart);
              const overlapEndOffset = Math.min(15, intervalEndMinutes - slotStart);
              
              // Convert time offsets to pixel offsets within the column
              const startPixelOffset = (overlapStartOffset / 15) * timeColWidth;
              const endPixelOffset = (overlapEndOffset / 15) * timeColWidth;
              const barWidth = endPixelOffset - startPixelOffset;
              
              const barX = baseX + startPixelOffset;
              
              // Track the first bar position and total width for label placement
              if (firstBarX === 0) {
                firstBarX = barX;
                totalBarWidth = barWidth;
              } else {
                // Extend the total width to include this bar
                totalBarWidth = (barX + barWidth) - firstBarX;
              }
              
              // Draw darker vertical bar for interval (proportional width)
              doc.setFillColor(100, 100, 100); // Dark gray
              doc.rect(barX, currentY - 6, barWidth, (sortedParticipants.length * 8) + 6, 'F');
            }
          });
          
          // Draw the "INTERVAL" label once per interval at the bottom center
          if (!labelDrawn && totalBarWidth > 3) {
            doc.setFontSize(5); // Smaller font size
            doc.setTextColor(255, 255, 255); // White text
            doc.setFont("helvetica", "bold");
            const text = "INTERVAL";
            const textWidth = doc.getTextWidth(text);
            // Position text at the bottom of the bar
            const textY = currentY + (sortedParticipants.length * 8) - 1;
            const centerX = firstBarX + (totalBarWidth / 2) - (textWidth / 2);
            doc.text(text, centerX, textY);
            doc.setTextColor(0, 0, 0); // Reset to black
            doc.setFont("helvetica", "normal");
            labelDrawn = true;
          }
        });
      }
      
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
      
      // Add interval information below the performance label
      if (data.intervals && data.intervals.length > 0) {
        const intervalY = labelY + 4;
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        
        const intervalTexts = data.intervals.map(interval => {
          const startHours = Math.floor((performanceStartMinutes + interval.start_minutes) / 60);
          const startMins = (performanceStartMinutes + interval.start_minutes) % 60;
          const endMinutes = performanceStartMinutes + interval.start_minutes + interval.duration_minutes;
          const endHours = Math.floor(endMinutes / 60);
          const endMinsDisplay = endMinutes % 60;
          
          const startTime = `${startHours.toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')}`;
          const endTime = `${endHours.toString().padStart(2, '0')}:${endMinsDisplay.toString().padStart(2, '0')}`;
          
          return `${startTime}-${endTime}`;
        });
        
        doc.text(`Intervals: ${intervalTexts.join(', ')}`, performanceLabelX, intervalY);
      }
      
      // Add legend for warning symbol if there are overlapping shifts (on the left, same line as performance)
      if (overlappingPeople.size > 0) {
        // Draw the same warning symbol for the legend
        const legendX = margin + 2;
        const legendY = labelY - 1;
        const size = 4;
        
        drawWarningSign(doc, legendX, legendY, size);
        
        // Reset colors and add text
        doc.setDrawColor(0, 0, 0);
        doc.setFillColor(0, 0, 0);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "italic");
        doc.text(" = Overlapping shifts", margin + 5, labelY);
      }
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
      
      // Check if this person has overlapping shifts and add warning symbol
      const hasOverlap = overlappingPeople.has(participant.name);
      
      if (hasOverlap) {
        // Draw warning symbol using the custom function
        const warningX = margin - 3;
        const warningY = actualRowY - 1;
        const size = 4;
        
        drawWarningSign(doc, warningX, warningY, size);
        
        // Reset colors after drawing
        doc.setDrawColor(0, 0, 0);
        doc.setFillColor(0, 0, 0);
        doc.setTextColor(0, 0, 0);
      }
      
      doc.text(truncateText(participant.name, 20), margin, actualRowY); // Names always start at margin
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

    currentY += (sortedParticipants.length * 8) + 15; // Reduced space since legend is on same line as performance
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
    doc.text("FUTURE UNFILLED SHIFTS", margin, currentY);
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
  }

  // Footer
  if (currentY > pageHeight - 15) {
    doc.addPage('landscape');
    currentY = margin;
  }
  
  currentY = pageHeight - 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Theatre Shifts Management System", margin, currentY);
  doc.text(`Generated: ${formatCurrentDateAdelaide()} at ${formatCurrentTimeAdelaide()}`, pageWidth - margin, currentY, { align: "right" });

  // Return PDF as Uint8Array
  const pdfOutput = doc.output('arraybuffer');
  return new Uint8Array(pdfOutput);
}
