import {
  getAdminNavigation,
  getAdminScripts,
  getAdminStyles,
} from "../components/navigation.ts";

export function renderDashboardTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Admin Dashboard - Theatre Shifts</title>
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
      ${getAdminNavigation("dashboard")}      <!-- Main Content -->
      <div class="main-content dashboard-page">
        <div class="page-header">
          <div class="dashboard-header">
            <div>
              <h1 class="page-title">Admin Dashboard</h1>
              <p class="page-subtitle">Manage your theatre shifts and participants</p>
            </div>
            <div class="dashboard-counters">
              <div class="counter">
                <span class="counter-value" id="unfilledShiftsCount">-</span>
                <div class="counter-label">Unfilled Shifts</div>
              </div>
              <div class="counter">
                <span class="counter-value" id="availabilityConflictsCount">-</span>
                <div class="counter-label">Availability Conflicts</div>
              </div>
              <div class="counter">
                <span class="counter-value" id="performancesWithoutShiftsCount">-</span>
                <div class="counter-label">Performances Without Shifts</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Calendar Section -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Shift Calendar</h2>
          </div>
          <div class="section-content">
            <div class="calendar-header">
              <div class="calendar-nav">
                <button onclick="changeMonth(-1)">Previous</button>
                <span id="currentMonth" aria-live="polite"></span>
                <button onclick="changeMonth(1)">Next</button>
              </div>
            </div>
            
            <div class="show-filter">
              <h4>Filter by Productions:</h4>
              <div class="show-checkboxes" id="showCheckboxes">
                <!-- Show checkboxes will be populated by JavaScript -->
              </div>
              <div class="filter-actions">
                <button class="filter-btn" onclick="selectAllShows()">Select All</button>
                <button class="filter-btn" onclick="deselectAllShows()">Deselect All</button>
                <button class="filter-btn" onclick="applyShowFilter()">Apply Filter</button>
              </div>
            </div>
            
            <p class="calendar-help" id="calendarHelp">Filled / total shifts. Select a day to view its shifts.</p>
            <div class="calendar" id="calendar" aria-describedby="calendarHelp">
              <!-- Calendar will be populated by JavaScript -->
            </div>
            
            <div class="calendar-legend">
              <div class="legend-item">
                <div class="legend-color" style="background: #28a745;"></div>
                <span>All shifts filled</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background: #ffc107;"></div>
                <span>Partially filled</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background: #dc3545;"></div>
                <span>Unfilled shifts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Include required JavaScript files -->
      <script src="/src/views/admin/dashboard.js"></script>
      ${getAdminScripts()}
    </body>
    </html>
  `;
}
