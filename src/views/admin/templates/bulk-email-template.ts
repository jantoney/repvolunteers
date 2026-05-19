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
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid #e9ecef;
        }

        .email-tab {
          background: none;
          border: none;
          padding: 1rem 1.5rem;
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
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 1rem;
          background: #f8f9fa;
        }

        .volunteer-item {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          background: white;
          border-radius: 4px;
          border: 1px solid #e9ecef;
        }

        .volunteer-checkbox {
          margin-right: 1rem;
          transform: scale(1.2);
        }

        .volunteer-info {
          flex-grow: 1;
        }

        .volunteer-name {
          font-weight: bold;
          color: #333;
        }

        .volunteer-details {
          font-size: 0.9rem;
          color: #666;
        }

        /* Action buttons */
        .volunteer-actions {
          display: flex;
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
            text-align: center;
            border-bottom: 1px solid #e9ecef;
            border-radius: 0;
          }

          .volunteer-actions {
            flex-direction: column;
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
          <div class="email-tabs">
            <button class="email-tab active" data-email-type="show-week">
              📅 Show Week Email
            </button>
            <button class="email-tab" data-email-type="unfilled-shifts">
              🚨 Unfilled Shifts Email
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
