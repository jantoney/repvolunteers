import {
  getAdminNavigation,
  getAdminScripts,
  getAdminStyles,
} from "../components/navigation.ts";
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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    };
    return entities[char];
  });
}

export function renderEditShowTemplate(data: EditShowPageData): string {
  const { show, showDates } = data;
  const showName = escapeHtml(show.name);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Edit Production - Rep Volunteers</title>
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
        .edit-show-header {
          justify-content: flex-start;
          align-items: flex-start;
        }
        .edit-show-title-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .back-to-productions {
          flex: 0 0 auto;
        }
        .production-title-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 0;
        }
        .production-name-edit-btn {
          width: 2.25rem;
          height: 2.25rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #ced4da;
          border-radius: 6px;
          background: #fff;
          color: #495057;
          cursor: pointer;
          font-size: 1rem;
          line-height: 1;
        }
        .production-name-edit-btn:hover,
        .production-name-edit-btn:focus {
          border-color: #007bff;
          color: #007bff;
          outline: none;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
        }
        .production-name-form {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          width: 100%;
        }
        .production-name-form.hidden {
          display: none;
        }
        .production-name-form input {
          max-width: 28rem;
        }
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
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
      ${getAdminNavigation("shows")}
      
      <!-- Main Content -->
      <div class="main-content">
        <div class="page-header edit-show-header">
          <div class="edit-show-title-row" id="productionNameDisplayRow">
            <a href="/admin/shows" class="btn btn-secondary back-to-productions">Back to Productions</a>
            <div class="production-title-wrap">
              <h1 class="page-title">Edit Production: <span id="productionNameDisplay">${showName}</span></h1>
              <button type="button" class="production-name-edit-btn" id="editProductionName" aria-label="Edit production name" title="Edit production name">&#9998;</button>
            </div>
          </div>

          <form id="showForm" class="production-name-form hidden">
            <label for="name" class="visually-hidden">Production Name</label>
            <input type="text" id="name" name="name" value="${showName}" required>
            <button type="submit" class="btn btn-primary">Save</button>
            <button type="button" class="btn btn-secondary" id="cancelProductionNameEdit">Cancel</button>
          </form>
        </div>

        <div class="form-container">
          <div id="errorMessage" class="error"></div>
          <div id="successMessage" class="success"></div>

          <div class="show-dates">
            <h2>Performances</h2>
            
            ${
              showDates.length === 0
                ? "<p>No performances scheduled for this production.</p>"
                : showDates
                    .map(
                      (date) => `
                <div class="show-date-item" data-date-id="${date.id}">
                  <div class="show-date-header">
                    <strong>${formatDate(date.start_time)}</strong>
                    <button type="button" class="btn btn-danger btn-sm" onclick="deleteShowDate(${date.id})">Delete</button>
                  </div>
                  <div class="time-group">
                    <div class="form-group">
                      <label>Start Date & Time:</label>
                      <input type="datetime-local" id="start_${date.id}" value="${formatDateTimeForInput(
                        date.start_time,
                      )}" onchange="updateShowDate(${date.id})">
                    </div>
                    <div class="form-group">
                      <label>End Date & Time:</label>
                      <input type="datetime-local" id="end_${date.id}" value="${formatDateTimeForInput(
                        date.end_time,
                      )}" onchange="updateShowDate(${date.id})">
                    </div>
                  </div>
                </div>
              `,
                    )
                    .join("")
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
            <h2>Performance Intervals</h2>
            <p class="help-text">Intervals are recorded as time offsets from the start of each performance, and will appear on run sheets.</p>
            
            <div id="intervalsList">
              <!-- Intervals will be loaded dynamically -->
            </div>

            <div class="form-section">
              <h3>Add New Interval</h3>
              <div class="interval-form">
                <div class="form-group">
                  <label for="intervalStart">Start Time (minutes from performance start):</label>
                  <input type="number" id="intervalStart" min="0" max="300" placeholder="e.g. 60 for 1 hour into the performance">
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
