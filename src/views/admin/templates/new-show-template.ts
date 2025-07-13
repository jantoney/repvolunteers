import { getAdminNavigation, getAdminStyles, getAdminScripts } from "../components/navigation.ts";

export interface NewShowPageData {
  existingShows: Array<{
    id: number;
    name: string;
  }>;
}

export function renderNewShowTemplate(data: NewShowPageData): string {
  const { existingShows } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Add New Show - Theatre Shifts</title>
      <!-- PWA Manifest -->
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}
      <link rel="stylesheet" href="/src/views/admin/new-show.css">
    </head>
    <body>
      ${getAdminNavigation('shows')}
      
      <!-- Main Content -->
      <div class="main-content">
        <div class="page-header">
          <h1 class="page-title">Add New Show</h1>
          <div class="page-actions">
            <a href="/admin/shows" class="btn btn-secondary">Back to Shows</a>
          </div>
        </div>

        <div class="content-card">
          <div id="successMessage" class="success-message"></div>
          <div id="errorMessage" class="error-message"></div>

          <form id="showForm">
            <div class="show-selection">
              <div class="radio-group">
                <label>
                  <input type="radio" name="showType" value="new" checked>
                  Create New Show
                </label>
                <label>
                  <input type="radio" name="showType" value="existing">
                  Add to Existing Show
                </label>
              </div>
              
              <div class="form-group" id="newShowName">
                <label for="name">Show Name:</label>
                <input type="text" id="name" name="name" required>
              </div>
              
              <div class="form-group hidden" id="existingShowSelect">
                <label for="existingShow">Select Show:</label>
                <select id="existingShow" name="existingShow">
                  <option value="">-- Select a Show --</option>
                  ${existingShows.map(show => `<option value="${show.id}">${show.name}</option>`).join('')}
                </select>
              </div>
            </div>
            
            <div class="time-group">
              <div class="form-group">
                <label for="startTime">Start Time:</label>
                <input type="time" id="startTime" name="startTime" required>
              </div>
              
              <div class="form-group">
                <label for="endTime">End Time:</label>
                <input type="time" id="endTime" name="endTime" required>
              </div>
            </div>
            
            <div class="form-group">
              <label>Select Show Dates:</label>
              <div class="calendar">
                <div class="calendar-header">
                  <button type="button" class="calendar-nav" id="prevMonth">‹ Previous</button>
                  <h3 id="currentMonth"></h3>
                  <button type="button" class="calendar-nav" id="nextMonth">Next ›</button>
                </div>
                <div class="calendar-grid" id="calendarGrid"></div>
              </div>
              
              <div class="selected-dates">
                <strong>Selected Dates:</strong>
                <div id="selectedDatesDisplay"></div>
              </div>
            </div>
            
            <div class="show-intervals">
              <h3>Show Intervals (Optional)</h3>
              <p class="form-text">Add intervals that occur during each performance. These will appear on run sheets.</p>
              
              <div id="intervalsList">
                <!-- Intervals will be added dynamically -->
              </div>
              
              <div class="interval-form">
                <div class="form-group">
                  <label for="newIntervalStart">Start (minutes from show start):</label>
                  <input type="number" id="newIntervalStart" min="0" max="300" placeholder="e.g. 60">
                  <small class="form-text">When the interval begins</small>
                </div>
                <div class="form-group">
                  <label for="newIntervalDuration">Duration (minutes):</label>
                  <input type="number" id="newIntervalDuration" min="1" max="60" placeholder="e.g. 20">
                  <small class="form-text">How long the interval lasts</small>
                </div>
                <div class="form-group">
                  <button type="button" class="btn btn-secondary" onclick="addInterval()">Add Interval</button>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <button type="submit" class="btn btn-primary">Add Show</button>
              <button type="button" id="clearForm" class="btn btn-secondary">Clear Form</button>
              <a href="/admin/shows" class="btn btn-outline">Cancel</a>
            </div>
          </form>
        </div>
      </div>

      <script src="/src/utils/modal.js"></script>
      ${getAdminScripts()}
      <script src="/src/views/admin/new-show.js"></script>
    </body>
    </html>
    `;
}