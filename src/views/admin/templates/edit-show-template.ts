import { getAdminNavigation, getAdminStyles } from "../components/navigation.ts";

export interface Show {
  id: number;
  name: string;
}

export interface ShowDate {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
}

export interface EditShowPageData {
  show: Show;
  showDates: ShowDate[];
}

export function renderEditShowTemplate(data: EditShowPageData): string {
  const { show, showDates } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Edit Show - Rep Volunteers</title>
      <!-- PWA Manifest -->
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}
      <style>
        .time-group { display: flex; gap: 1rem; }
        .time-group .form-group { flex: 1; }
        .show-dates { margin-top: 2rem; }
        .show-date-item { 
          border: 1px solid #ddd; 
          border-radius: 4px; 
          padding: 1rem; 
          margin-bottom: 1rem; 
          background: #f8f9fa;
        }
        .show-date-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 0.5rem; 
        }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; display: none; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; display: none; }
      </style>
    </head>
    <body>
      ${getAdminNavigation('shows')}
      
      <!-- Main Content -->
      <div class="main-content">
        <div class="page-header">
          <h1 class="page-title">Edit Show: ${show.name}</h1>
        </div>

        <div class="form-container">
          <div id="errorMessage" class="error"></div>
          <div id="successMessage" class="success"></div>

          <form id="showForm">
            <div class="form-group">
              <label for="name">Show Name:</label>
              <input type="text" id="name" name="name" value="${show.name}" required>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Update Show Name</button>
              <a href="/admin/shows" class="btn btn-secondary">Back to Shows</a>
            </div>
          </form>

          <div class="show-dates">
            <h2>Show Dates & Times</h2>
            
            ${showDates.length === 0 ? '<p>No dates scheduled for this show.</p>' : 
              showDates.map(date => `
                <div class="show-date-item" data-date-id="${date.id}">
                  <div class="show-date-header">
                    <strong>${new Date(date.date).toLocaleDateString()}</strong>
                    <button type="button" class="btn btn-danger btn-sm" onclick="deleteShowDate(${date.id})">Delete</button>
                  </div>
                  <div class="time-group">
                    <div class="form-group">
                      <label>Start Time:</label>
                      <input type="time" id="start_${date.id}" value="${date.start_time}" onchange="updateShowDate(${date.id})">
                    </div>
                    <div class="form-group">
                      <label>End Time:</label>
                      <input type="time" id="end_${date.id}" value="${date.end_time}" onchange="updateShowDate(${date.id})">
                    </div>
                  </div>
                </div>
              `).join('')
            }

            <div class="form-section">
              <h3>Add New Date</h3>
              <div class="time-group">
                <div class="form-group">
                  <label for="newDate">Date:</label>
                  <input type="date" id="newDate">
                </div>
                <div class="form-group">
                  <label for="newStartTime">Start Time:</label>
                  <input type="time" id="newStartTime">
                </div>
                <div class="form-group">
                  <label for="newEndTime">End Time:</label>
                  <input type="time" id="newEndTime">
                </div>
              </div>
              <button type="button" class="btn btn-primary" onclick="addNewDate()">Add Date</button>
            </div>
          </div>
        </div>
      </div>

      <script src="/src/views/admin/edit-show.js" data-show-id="${show.id}"></script>
    </body>
    </html>
  `;
}
