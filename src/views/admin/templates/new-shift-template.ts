import { getAdminNavigation, getAdminStyles } from "../components/navigation.ts";

export interface Show {
  id: number;
  name: string;
}

export interface NewShiftPageData {
  shows: Show[];
}

export function renderNewShiftTemplate(data: NewShiftPageData): string {
  const { shows } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Add New Shifts - Theatre Shifts</title>
      <!-- PWA Manifest -->
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}
      <style>
        .time-group { display: flex; gap: 1rem; align-items: end; }
        .time-group .form-group { flex: 1; }
        
        .checkbox-group { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; margin-top: 0.5rem; }
        .checkbox-item { display: flex; align-items: center; }
        .checkbox-item input[type="checkbox"] { margin-right: 0.5rem; }
        
        .roles-section { background: #f8f9fa; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
        .show-dates-section { background: #f8f9fa; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
        
        .custom-role-group { margin-top: 1rem; }
        .custom-role-input { display: flex; gap: 0.5rem; align-items: center; }
        .custom-role-input input { flex: 1; }
        .custom-role-input button { padding: 0.5rem 1rem; }
        
        .warning-message { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 0.75rem; border-radius: 4px; margin: 0.5rem 0; display: none; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 0.75rem; border-radius: 4px; margin: 0.5rem 0; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 0.75rem; border-radius: 4px; margin: 0.5rem 0; }
      </style>
    </head>
    <body>
      ${getAdminNavigation('shifts')}
      
      <!-- Main Content -->
      <div class="main-content">
        <div class="page-header">
          <h1 class="page-title">Add New Shifts</h1>
        </div>

        <div class="form-container">
          <div id="successMessage" class="success" style="display: none;"></div>
          <div id="errorMessage" class="error" style="display: none;"></div>

          <form id="shiftForm">
            <div class="form-group">
              <label for="show_id">Show:</label>
              <select id="show_id" name="show_id" required>
                <option value="">Select a show</option>
                ${shows.map(show => `
                  <option value="${show.id}">${show.name}</option>
                `).join('')}
              </select>
            </div>
            
            <div class="show-dates-section" id="showDatesSection" style="display: none;">
              <label>Show Dates:</label>
              <div id="showDatesList" class="checkbox-group">
              </div>
            </div>
            
            <div class="time-group">
              <div class="form-group">
                <label for="arrive_time">Arrive Time:</label>
                <input type="time" id="arrive_time" name="arrive_time" required>
              </div>
              
              <div class="form-group">
                <label for="depart_time">Depart Time:</label>
                <input type="time" id="depart_time" name="depart_time" required>
              </div>
            </div>
            
            <div id="nextDayWarning" class="warning-message">
              ⚠️ <strong>Following Day:</strong> Depart time is before arrive time, so it will be saved as the next day.
            </div>
            
            <div class="roles-section">
              <label>Roles:</label>
              <div id="defaultRolesList" class="checkbox-group">
                <!-- Default roles will be loaded here -->
              </div>
              
              <div class="custom-role-group">
                <label for="customRole">Custom Role:</label>
                <div class="custom-role-input">
                  <input type="text" id="customRole" placeholder="Enter custom role name">
                  <button type="button" id="addCustomRole" class="btn btn-secondary">Add Role</button>
                </div>
              </div>
              
              <div id="customRolesList" class="checkbox-group" style="margin-top: 1rem;">
                <!-- Custom roles will appear here -->
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Create Shifts</button>
              <a href="/admin/shifts" class="btn btn-secondary">Cancel</a>
            </div>
          </form>
        </div>
      </div>

      <script src="/src/utils/modal.js"></script>
      <script src="/src/utils/timezone-client.js"></script>
      <script src="/src/views/admin/new-shift.js"></script>
    </body>
    </html>
  `;
}
