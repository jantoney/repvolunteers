import { getAdminNavigation, getAdminStyles, getAdminScripts } from "../components/navigation.ts";
import { formatDate, formatDateTimeForInput } from "../../../utils/timezone.ts";

export interface Show {
  id: number;
  name: string;
}

export interface ShowDate {
  id: number;
  start_time: Date;
  end_time: Date;
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
        .show-intervals { margin-top: 2rem; }
        .show-date-item { 
          border: 1px solid #ddd; 
          border-radius: 4px; 
          padding: 1rem; 
          margin-bottom: 1rem; 
          background: #f8f9fa;
        }
        .interval-item {
          border: 1px solid #ddd; 
          border-radius: 4px; 
          padding: 1rem; 
          margin-bottom: 1rem; 
          background: #f0f8ff;
        }
        .interval-header {
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 0.5rem;
        }
        .interval-form {
          display: flex;
          gap: 1rem;
          align-items: end;
        }
        .interval-form .form-group {
          flex: 1;
        }
        .show-date-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 0.5rem; 
        }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; display: none; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; display: none; }
        .help-text { color: #6c757d; font-size: 0.9rem; margin-bottom: 1rem; }
        .form-text { color: #6c757d; font-size: 0.8rem; }
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
                    <strong>${formatDate(date.start_time)}</strong>
                    <button type="button" class="btn btn-danger btn-sm" onclick="deleteShowDate(${date.id})">Delete</button>
                  </div>
                  <div class="time-group">
                    <div class="form-group">
                      <label>Start Date & Time:</label>
                      <input type="datetime-local" id="start_${date.id}" value="${formatDateTimeForInput(date.start_time)}" onchange="updateShowDate(${date.id})">
                    </div>
                    <div class="form-group">
                      <label>End Date & Time:</label>
                      <input type="datetime-local" id="end_${date.id}" value="${formatDateTimeForInput(date.end_time)}" onchange="updateShowDate(${date.id})">
                    </div>
                  </div>
                </div>
              `).join('')
            }

            <div class="form-section">
              <h3>Add New Performance</h3>
              <div class="time-group">
                <div class="form-group">
                  <label for="newStartDateTime">Start Date & Time:</label>
                  <input type="datetime-local" id="newStartDateTime">
                </div>
                <div class="form-group">
                  <label for="newEndDateTime">End Date & Time:</label>
                  <input type="datetime-local" id="newEndDateTime">
                </div>
              </div>
              <button type="button" class="btn btn-primary" onclick="addNewDate()">Add Performance</button>
            </div>
          </div>

          <div class="show-intervals">
            <h2>Show Intervals</h2>
            <p class="help-text">Intervals are recorded as time offsets from the start of each performance, and will appear on run sheets.</p>
            
            <div id="intervalsList">
              <!-- Intervals will be loaded dynamically -->
            </div>

            <div class="form-section">
              <h3>Add New Interval</h3>
              <div class="interval-form">
                <div class="form-group">
                  <label for="intervalStart">Start Time (minutes from performance start):</label>
                  <input type="number" id="intervalStart" min="0" max="300" placeholder="e.g. 60 for 1 hour into show">
                  <small class="form-text text-muted">Enter the number of minutes from the start of the performance when the interval begins</small>
                </div>
                <div class="form-group">
                  <label for="intervalDuration">Duration (minutes):</label>
                  <input type="number" id="intervalDuration" min="1" max="60" placeholder="e.g. 20">
                  <small class="form-text text-muted">How long the interval lasts in minutes</small>
                </div>
              </div>
              <button type="button" class="btn btn-primary" onclick="addNewInterval()">Add Interval</button>
            </div>
          </div>
        </div>
      </div>

      ${getAdminScripts()}
      <script src="/src/views/admin/edit-show.js" data-show-id="${show.id}"></script>
    </body>
    </html>
  `;
}
