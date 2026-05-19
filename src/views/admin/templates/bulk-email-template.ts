import {
  getAdminNavigation,
  getAdminScripts,
  getAdminStyles,
} from "../components/navigation.ts";

export function renderBulkEmailTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Bulk Email - Theatre Shifts</title>
      <!-- PWA Manifest -->
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}
      <style>
        /* Email type tabs */
        .email-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid #e9ecef;
        }

        .email-tab {
          background: none;
          border: none;
          padding: 0.85rem 1.25rem;
          cursor: pointer;
          color: #666;
          font-size: 1rem;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }

        .email-tab.active {
          color: #007bff;
          border-bottom-color: #007bff;
          background: #f8f9fa;
        }

        .email-tab:hover {
          background: #f8f9fa;
        }

        /* Email content */
        .email-content {
          display: none;
        }

        .email-content.active {
          display: block;
        }

        /* Volunteer list */
        .volunteer-list {
          max-height: 520px;
          overflow-y: auto;
          overflow-x: auto;
          border: 1px solid #d8dee4;
          border-radius: 4px;
          background: #fff;
        }

        .volunteer-table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
          font-size: 0.95rem;
        }

        .volunteer-table th,
        .volunteer-table td {
          padding: 0.75rem 0.9rem;
          text-align: left;
          vertical-align: middle;
          border-bottom: 1px solid #e9ecef;
        }

        .volunteer-table th {
          position: sticky;
          top: 0;
          z-index: 1;
          background: #f8f9fa;
          color: #495057;
          font-size: 0.82rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .volunteer-table tbody tr:last-child td {
          border-bottom: none;
        }

        .volunteer-table tbody tr:hover {
          background: #f8fbff;
        }

        .volunteer-table .select-column {
          width: 5.5rem;
          text-align: center;
        }

        .volunteer-checkbox {
          width: 1.1rem;
          height: 1.1rem;
          cursor: pointer;
        }

        .volunteer-checkbox:disabled {
          cursor: not-allowed;
        }

        .volunteer-name-cell {
          min-width: 12rem;
          font-weight: 700;
          color: #212529;
        }

        .volunteer-unavailable {
          color: #6c757d;
          background: #fafafa;
        }

        .volunteer-unavailable .volunteer-name-cell {
          color: #6c757d;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          min-height: 1.65rem;
          padding: 0.25rem 0.55rem;
          border-radius: 999px;
          background: #e7f5ff;
          color: #0b7285;
          font-size: 0.82rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .status-pill.muted {
          background: #f1f3f5;
          color: #6c757d;
        }

        .table-empty-state {
          padding: 1.25rem;
          color: #6c757d;
          text-align: center;
        }

        /* Action buttons */
        .volunteer-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        /* Loading state */
        .loading {
          display: none;
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .loading.active {
          display: block;
        }

        /* Status messages */
        .status-message {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          display: none;
        }

        .status-message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .status-message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .status-message.active {
          display: block;
        }

        /* Selection summary */
        .selection-summary {
          background: #e3f2fd;
          border: 1px solid #bbdefb;
          border-radius: 4px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .selection-count {
          font-weight: bold;
          color: #1976d2;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .email-tabs {
            flex-direction: column;
            gap: 0;
          }

          .email-tab {
            text-align: left;
            border-bottom: 1px solid #e9ecef;
            border-radius: 0;
          }

          .volunteer-actions {
            flex-direction: column;
          }

          .volunteer-actions .btn {
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      ${getAdminNavigation("bulk-email")}

      <!-- Main Content -->
      <div class="main-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">Bulk Email</h1>
            <p class="page-subtitle">Send emails to groups of volunteers based on their assignments</p>
          </div>
        </div>

        <!-- Status Messages -->
        <div id="statusMessage" class="status-message"></div>

        <!-- Email Type Selection -->
        <div class="section-content">
          <div class="email-tabs" role="tablist" aria-label="Bulk email type">
            <button class="email-tab active" type="button" role="tab" aria-selected="true" data-email-type="show-week">
              📅 Show Week Email
            </button>
            <button class="email-tab" type="button" role="tab" aria-selected="false" data-email-type="unfilled-shifts">
              🚨 Unfilled Shifts Email
            </button>
            <button class="email-tab" type="button" role="tab" aria-selected="false" data-email-type="availability-request">
              📆 Availability Request
            </button>
          </div>

          <!-- Show Week Email Content -->
          <div class="email-content active" id="show-week-content">
            <h3>Show Week Email</h3>
            <p>Send "It's Show Week!" emails to volunteers who have shifts for a selected production. This includes their schedule PDF attachment.</p>
            
            <div class="form-group">
              <label class="form-label" for="showSelect">Select Production:</label>
              <select class="form-select" id="showSelect">
                <option value="">-- Select a production --</option>
              </select>
            </div>

            <div id="showVolunteersSection" style="display: none;">
              <div class="selection-summary">
                <div class="selection-count" id="showSelectionCount">0 volunteers selected</div>
              </div>

              <div class="volunteer-actions">
                <button class="btn btn-secondary" onclick="selectAllShowVolunteers()">Select All</button>
                <button class="btn btn-secondary" onclick="deselectAllShowVolunteers()">Deselect All</button>
                <button class="btn btn-primary" onclick="sendShowWeekEmails()" id="sendShowWeekBtn" disabled>
                  Send Show Week Emails
                </button>
              </div>

              <div class="volunteer-list" id="showVolunteersList">
                <!-- Volunteers will be loaded here -->
              </div>
            </div>
          </div>

          <!-- Unfilled Shifts Email Content -->
          <div class="email-content" id="unfilled-shifts-content">
            <h3>Unfilled Shifts Email</h3>
            <p>Send "Last Minute Shifts" emails to volunteers asking them to help fill outstanding shifts. This includes a PDF of the next 10 unfilled shifts.</p>
            
            <div class="selection-summary">
              <div class="selection-count" id="unfilledSelectionCount">0 volunteers selected</div>
            </div>

            <div class="volunteer-actions">
              <button class="btn btn-secondary" onclick="selectAllUnfilledVolunteers()">Select All</button>
              <button class="btn btn-secondary" onclick="deselectAllUnfilledVolunteers()">Deselect All</button>
              <button class="btn btn-primary" onclick="sendUnfilledShiftsEmails()" id="sendUnfilledBtn" disabled>
                Send Unfilled Shifts Emails
              </button>
            </div>

            <div class="volunteer-list" id="unfilledVolunteersList">
              <!-- Volunteers will be loaded here -->
            </div>
          </div>

          <!-- Availability Request Email Content -->
          <div class="email-content" id="availability-request-content">
            <h3>Availability Request</h3>
            <p>Ask volunteers to add the days they cannot work before shifts are filled for a new production.</p>
            
            <div class="selection-summary">
              <div class="selection-count" id="availabilitySelectionCount">0 volunteers selected</div>
            </div>

            <div class="volunteer-actions">
              <button class="btn btn-secondary" onclick="selectAllAvailabilityVolunteers()">Select All</button>
              <button class="btn btn-secondary" onclick="deselectAllAvailabilityVolunteers()">Deselect All</button>
              <button class="btn btn-primary" onclick="sendAvailabilityRequestEmails()" id="sendAvailabilityBtn" disabled>
                Send Availability Requests
              </button>
            </div>

            <div class="volunteer-list" id="availabilityVolunteersList">
              <!-- Volunteers will be loaded here -->
            </div>
          </div>

          <!-- Loading State -->
          <div id="loadingState" class="loading">
            <div>Loading volunteers...</div>
          </div>
        </div>
      </div>      <script src="/src/views/admin/bulk-email.js"></script>
      ${getAdminScripts()}
    </body>
    </html>
  `;
}
