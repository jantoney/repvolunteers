import { getAdminNavigation, getAdminStyles } from "../components/navigation.ts";
import { formatDateTimeForInput, formatDate, formatTime } from "../../../utils/timezone.ts";

export interface ShowDate {
  id: number;
  show_name: string;
  date: string;
  start_time: string;
  end_time: string;
}

export interface Shift {
  id: number;
  show_date_id: number;
  role: string;
  arrive_time: Date;
  depart_time: Date;
}

export interface EditShiftPageData {
  shift: Shift;
  showDates: ShowDate[];
}

export function renderEditShiftTemplate(data: EditShiftPageData): string {
  const { shift, showDates } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Edit Shift - Rep Volunteers</title>
      <!-- PWA Manifest -->
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}
    </head>
    <body>
      ${getAdminNavigation('shifts')}
      
      <!-- Main Content -->
      <div class="main-content">
        <div class="page-header">
          <h1 class="page-title">Edit Shift #${shift.id}</h1>
        </div>

        <div class="form-container">
          <form id="shiftForm">
            <div class="form-group">
              <label for="show_date_id">Show & Date:</label>
              <select id="show_date_id" name="show_date_id" required>
                ${showDates.map(showDate => 
                  `<option value="${showDate.id}" ${showDate.id === shift.show_date_id ? 'selected' : ''}>
                    ${showDate.show_name} - ${formatDate(showDate.date)} (${formatTime(showDate.start_time)} - ${formatTime(showDate.end_time)})
                  </option>`
                ).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label for="role">Role:</label>
              <input type="text" id="role" name="role" value="${shift.role}" required>
            </div>
              <div class="form-group">
              <label for="arrive_time">Arrive Time:</label>
              <input type="datetime-local" id="arrive_time" name="arrive_time" 
                     value="${formatDateTimeForInput(shift.arrive_time)}" required>
            </div>
            
            <div class="form-group">
              <label for="depart_time">Depart Time:</label>
              <input type="datetime-local" id="depart_time" name="depart_time" 
                     value="${formatDateTimeForInput(shift.depart_time)}" required>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Update Shift</button>
              <a href="/admin/shifts" class="btn btn-secondary">Cancel</a>
            </div>
          </form>
        </div>
      </div>

      <script src="/src/utils/modal.js"></script>
      <script src="/src/views/admin/edit-shift.js" data-shift-id="${shift.id}"></script>
    </body>
    </html>
  `;
}
