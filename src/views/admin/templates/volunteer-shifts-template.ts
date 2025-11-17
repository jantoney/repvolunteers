import {
  getAdminNavigation,
  getAdminStyles,
  getAdminScripts,
} from "../components/navigation.ts";

export interface VolunteerShift {
  id: number;
  show_id: number;
  show_name: string;
  role: string;
  start_time: string;
  end_time: string;
  arrive_time: string | null;
  depart_time: string | null;
  performance_id?: number;
}

export interface VolunteerShiftsPageData {
  volunteer: {
    id: number;
    name: string;
    email: string;
  };
  assignedShifts: VolunteerShift[];
  pastShifts: VolunteerShift[];
}

export function renderVolunteerShiftsTemplate(
  data: VolunteerShiftsPageData
): string {
  const { volunteer, assignedShifts, pastShifts } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Manage Shifts for ${volunteer.name} - Theatre Shifts</title>
      <!-- PWA Manifest -->
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}
      <style>
        .volunteer-header {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        .volunteer-info h2 {
          margin-bottom: 0.5rem;
          color: #333;
        }
        .volunteer-info p {
          margin-bottom: 0.25rem;
          color: #666;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          border-bottom: 2px solid #007bff;
          padding-bottom: 0.5rem;
        }
        .shifts-grid {
          display: grid;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .shift-card {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1.5rem;
          transition: all 0.2s ease;
          position: relative;
        }
        .shift-card:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          border-color: #007bff;
        }
        .shift-card.assigned {
          border-left: 4px solid #28a745;
          background: #f8fff9;
        }
        .shift-card.available {
          border-left: 4px solid #6f42c1;
          background: #faf8ff;
        }
        .shift-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        .shift-title {
          font-size: 1.1rem;
          font-weight: bold;
          color: #333;
          margin-bottom: 0.25rem;
        }
        .shift-show {
          font-size: 0.95rem;
          color: #666;
          margin-bottom: 0.5rem;
        }
        .shift-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .shift-detail {
          display: flex;
          flex-direction: column;
        }
        .shift-detail-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }
        .shift-detail-value {
          font-size: 0.95rem;
          color: #333;
          font-weight: 500;
        }
        .shift-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .no-shifts {
          text-align: center;
          color: #666;
          padding: 2rem;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }
        .back-link {
          margin-bottom: 1rem;
        }
        .back-link a {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #007bff;
          text-decoration: none;
          font-weight: 500;
        }
        .back-link a:hover {
          color: #0056b3;
          text-decoration: underline;
        }
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .stat-card {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
        }
        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 0.25rem;
        }
        .stat-label {
          font-size: 0.9rem;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          .volunteer-header {
            padding: 1rem;
          }
          .shift-card {
            padding: 1rem;
          }
          .shift-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .shift-actions {
            margin-top: 1rem;
            width: 100%;
          }
          .shift-actions .btn {
            flex: 1;
          }
          .summary-stats {
            grid-template-columns: 1fr;
          }
        }
        .table-wrapper {
          overflow-x: auto;
        }
        .shifts-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          overflow: hidden;
        }
        .shifts-table th,
        .shifts-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #dee2e6;
        }
        .shifts-table th {
          background: #f0f3f8;
          font-weight: 600;
          color: #333;
        }
        .shifts-table tr:last-child td {
          border-bottom: none;
        }
        .shifts-table tbody tr:nth-child(even) {
          background: #f9fbfd;
        }
      </style>
    </head>
    <body>
      ${getAdminNavigation("volunteers")}
      
      <!-- Main Content -->
      <div class="main-content">
        <div class="back-link">
          <a href="/admin/volunteers">← Back to Participants</a>
        </div>
        
        <div class="volunteer-header">
          <div class="volunteer-info">
            <h2>${volunteer.name}</h2>
            <p><strong>Email:</strong> ${volunteer.email || "N/A"}</p>
            <p><strong>Participant ID:</strong> ${volunteer.id}</p>
          </div>
        </div>
        
        <div class="summary-stats">
          <div class="stat-card">
            <div class="stat-number">${assignedShifts.length}</div>
            <div class="stat-label">Upcoming Assigned Shifts</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${pastShifts.length}</div>
            <div class="stat-label">Past Shifts</div>
          </div>
        </div>
        
        <!-- Assigned Shifts Section -->
        <section>
          <div class="section-header">
            <h3>Upcoming Assigned Shifts</h3>
          </div>
          
          <div class="shifts-grid">
            ${
              assignedShifts.length === 0
                ? '<div class="no-shifts">No upcoming shifts currently assigned</div>'
                : assignedShifts
                    .map(
                      (shift) => `
                <div class="shift-card assigned">
                  <div class="shift-header">
                    <div>
                      <div class="shift-title">${shift.role}</div>
                      <div class="shift-show">${shift.show_name}</div>
                    </div>
                  </div>
                  <div class="shift-details">
                    <div class="shift-detail">
                      <div class="shift-detail-label">Start Time</div>
                      <div class="shift-detail-value">${shift.start_time}</div>
                    </div>
                    <div class="shift-detail">
                      <div class="shift-detail-label">End Time</div>
                      <div class="shift-detail-value">${shift.end_time}</div>
                    </div>
                  </div>
                  <div class="shift-actions">
                    <button class="btn btn-sm btn-danger" 
                            data-shift-id="${shift.id}" 
                            data-role="${shift.role}" 
                            data-show-name="${shift.show_name}"
                            onclick="removeShift(this)">
                      Remove
                    </button>
                    <button class="btn btn-sm btn-warning" 
                            data-shift-id="${shift.id}" 
                            data-role="${shift.role}" 
                            data-show-name="${shift.show_name}"
                            onclick="swapShift(this)">
                      Swap
                    </button>
                  </div>
                </div>
              `
                    )
                    .join("")
            }
          </div>
        </section>

        <!-- Past Shifts Section -->
        <section>
          <div class="section-header">
            <h3>Past Shifts</h3>
          </div>
          ${
            pastShifts.length === 0
              ? `
            <div class="no-shifts">No past shifts recorded</div>
          `
              : `
            <div class="table-wrapper">
              <table class="shifts-table">
                <thead>
                  <tr>
                    <th>Show</th>
                    <th>Role</th>
                    <th>Start</th>
                    <th>End</th>
                  </tr>
                </thead>
                <tbody>
                  ${pastShifts
                    .map(
                      (shift) => `
                    <tr>
                      <td>${shift.show_name}</td>
                      <td>${shift.role}</td>
                      <td>${shift.start_time}</td>
                      <td>${shift.end_time}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
          }
        </section>
      </div>

      <script src="/src/utils/modal.js"></script>
      <script src="/src/utils/timezone-client.js"></script>
      ${getAdminScripts()}
      <script src="/src/views/admin/volunteer-shifts.js"></script>
      <script>
        // Initialize the volunteer shifts functionality with data
        if (typeof initVolunteerShifts === 'function') {
          initVolunteerShifts(${volunteer.id}, ${JSON.stringify(
    volunteer.name
  )}, ${JSON.stringify(assignedShifts)});
        }
      </script>
    </body>
    </html>
  `;
}
