import { getAdminNavigation, getAdminStyles } from "../components/navigation.ts";

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
      ${getAdminStyles()}      <style>
        /* Dashboard-specific styles */

        /* Section Styles */
        .section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
          overflow: hidden;
        }

        .section-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e9ecef;
          background: #f8f9fa;
        }

        .section-title {
          font-size: 1.5rem;
          color: #333;
          margin: 0;
        }        .section-content {
          padding: 2rem;
        }

        /* Calendar Styles */
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .calendar-nav {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .calendar-nav button {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .calendar-nav button:hover {
          background: #0056b3;
        }

        .show-filter {
          margin-bottom: 1.5rem;
        }

        .show-filter h4 {
          margin-bottom: 0.75rem;
          color: #333;
        }

        .show-checkboxes {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .show-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .show-checkbox input[type="checkbox"] {
          transform: scale(1.2);
        }

        .filter-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .filter-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background-color 0.2s;
        }

        .filter-btn:hover {
          background: #5a6268;
        }

        .calendar {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: #ddd;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .calendar-day-header {
          background: #007bff;
          color: white;
          padding: 0.75rem;
          text-align: center;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .calendar-day {
          background: white;
          padding: 0.5rem;
          min-height: 80px;
          position: relative;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          flex-direction: column;
        }

        .calendar-day:hover {
          background: #f8f9fa;
        }

        .calendar-day.other-month {
          background: #f8f9fa;
          color: #999;
        }

        .calendar-day.today {
          background: #fff3cd;
          border: 2px solid #ffc107;
        }

        .calendar-day.has-shifts {
          border-left: 4px solid #007bff;
        }

        .calendar-day.has-shifts.partial {
          border-left-color: #ffc107;
        }

        .calendar-day.has-shifts.unfilled {
          border-left-color: #dc3545;
        }

        .day-number {
          font-weight: bold;
          margin-bottom: 0.25rem;
        }

        .shift-indicator {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 0.75rem;
        }

        .shift-count {
          font-weight: bold;
          color: #333;
          margin-bottom: 0.25rem;
        }

        .shift-shows {
          color: #666;
          text-align: center;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .calendar-legend {
          display: flex;
          gap: 2rem;
          justify-content: center;
          flex-wrap: wrap;
          font-size: 0.9rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .legend-color {
          width: 20px;
          height: 15px;
          border-radius: 2px;
        }        /* Dashboard Header Counters */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .dashboard-counters {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .counter {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
          min-width: 140px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .counter-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #dc3545;
          display: block;
        }

        .counter-label {
          font-size: 0.875rem;
          color: #6c757d;
          margin-top: 0.25rem;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .section-content {
            padding: 1rem;
          }

          .calendar-day {
            min-height: 60px;
            font-size: 0.875rem;
          }

          .calendar-legend {
            gap: 1rem;
            font-size: 0.8rem;
          }

          .dashboard-header {
            flex-direction: column;
            align-items: stretch;
          }

          .dashboard-counters {
            justify-content: center;
          }

          .counter {
            min-width: 120px;
          }
        }
      </style>
    </head>
    <body>
      ${getAdminNavigation('dashboard')}      <!-- Main Content -->
      <div class="main-content">
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
                <span id="currentMonth"></span>
                <button onclick="changeMonth(1)">Next</button>
              </div>
            </div>
            
            <div class="show-filter">
              <h4>Filter by Shows:</h4>
              <div class="show-checkboxes" id="showCheckboxes">
                <!-- Show checkboxes will be populated by JavaScript -->
              </div>
              <div class="filter-actions">
                <button class="filter-btn" onclick="selectAllShows()">Select All</button>
                <button class="filter-btn" onclick="deselectAllShows()">Deselect All</button>
                <button class="filter-btn" onclick="applyShowFilter()">Apply Filter</button>
              </div>
            </div>
            
            <div class="calendar" id="calendar">
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
    </body>
    </html>
  `;
}
