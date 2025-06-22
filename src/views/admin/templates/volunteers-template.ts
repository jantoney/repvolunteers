import { getAdminNavigation, getAdminStyles, getAdminScripts } from "../components/navigation.ts";

export interface Volunteer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface VolunteersPageData {
  volunteers: Volunteer[];
}

export function renderVolunteersTemplate(data: VolunteersPageData): string {
  const { volunteers } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Manage Participants - Theatre Shifts</title>
      <!-- PWA Manifest -->
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}      <style>
        .signup-link { font-family: monospace; background: #f8f9fa; padding: 0.25rem; border-radius: 4px; font-size: 0.875rem; }
        .signup-url-container { 
          display: flex; 
          align-items: center; 
          gap: 0.5rem; 
          max-width: 300px; 
        }
        .signup-url { 
          font-family: monospace; 
          background: #f8f9fa; 
          padding: 0.5rem; 
          border-radius: 4px; 
          font-size: 0.875rem; 
          border: 1px solid #dee2e6; 
          flex: 1; 
          min-width: 0; 
          overflow: hidden; 
          text-overflow: ellipsis; 
          white-space: nowrap;
        }
        .copy-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          transition: background-color 0.2s;
          white-space: nowrap;
        }
        .copy-btn:hover {
          background: #218838;
        }
        .copy-btn.copied {
          background: #17a2b8;
        }
        
        /* Modal styles */
        .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4); }
        .modal-content { background-color: #fefefe; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 700px; border-radius: 8px; max-height: 70vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .close { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
        .close:hover { color: black; }
        .shift-list { max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; }
        .shift-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #eee; }
        .shift-item:last-child { border-bottom: none; }
        .shift-info { flex-grow: 1; }
        .shift-title { font-weight: bold; }
        .shift-details { font-size: 0.85em; color: #666; }
        .assigned-shifts { margin-bottom: 20px; }
        .assigned-shifts h4 { margin-bottom: 10px; }
        .no-shifts { text-align: center; color: #666; padding: 20px; }
      </style>
    </head>
    <body>
      ${getAdminNavigation('volunteers')}
      
      <!-- Main Content -->
      <div class="main-content">
        <div class="page-header">
          <h1 class="page-title">Manage Participants</h1>
          <div class="page-actions">
            <a href="/admin/volunteers/new" class="btn btn-primary">Add New Participant</a>
          </div>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Signup Link</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${volunteers.map(volunteer => `
                <tr>                  <td>${volunteer.id}</td>
                  <td><strong>${volunteer.name}</strong></td>
                  <td>${volunteer.email || 'N/A'}</td>
                  <td>${volunteer.phone || 'N/A'}</td>                  <td>
                    <div class="signup-url-container">
                      <input type="text" class="signup-url" value="/volunteer/signup/${volunteer.id}" readonly id="url-${volunteer.id}" data-full-url="">
                      <button class="copy-btn" onclick="copySignupUrl(${volunteer.id})" id="copy-btn-${volunteer.id}">Copy</button>
                    </div>
                  </td>
                  <td>
                    <div class="table-actions">
                      <button onclick="manageShifts(${volunteer.id}, '${volunteer.name.replace(/'/g, "\\'")}'))" class="btn btn-sm btn-info">Shifts</button>
                      <a href="/admin/volunteers/${volunteer.id}/edit" class="btn btn-sm btn-secondary">Edit</a>
                      <button onclick="deleteVolunteer(${volunteer.id}, '${volunteer.name.replace(/'/g, "\\'")}'))" class="btn btn-sm btn-danger">Delete</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Shift Assignment Modal -->
      <div id="shiftModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="modalTitle">Manage Shifts</h3>
            <span class="close" onclick="closeModal()">&times;</span>
          </div>
          
          <div class="assigned-shifts">
            <h4>Currently Assigned Shifts</h4>
            <div id="assignedShiftsList" class="shift-list">
              <!-- Assigned shifts will be loaded here -->
            </div>
          </div>
          
          <h4>Available Shifts</h4>
          <div id="availableShiftsList" class="shift-list">
            <!-- Available shifts will be loaded here -->
          </div>
        </div>
      </div>      <script src="/src/utils/modal.js"></script>
      ${getAdminScripts()}
      <script src="/src/views/admin/volunteers.js"></script>
      <script>
        // Set full URLs and copy function
        document.addEventListener('DOMContentLoaded', function() {
          // Set full URLs for all signup links
          const urlInputs = document.querySelectorAll('.signup-url');
          urlInputs.forEach(input => {
            const relativeUrl = input.value;
            const fullUrl = globalThis.location.origin + relativeUrl;
            input.setAttribute('data-full-url', fullUrl);
            input.value = fullUrl;
          });
        });
        
        async function copySignupUrl(volunteerId) {
          const input = document.getElementById(\`url-\${volunteerId}\`);
          const button = document.getElementById(\`copy-btn-\${volunteerId}\`);
          const fullUrl = input.getAttribute('data-full-url') || input.value;
          
          try {
            await navigator.clipboard.writeText(fullUrl);
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.classList.add('copied');
            
            setTimeout(() => {
              button.textContent = originalText;
              button.classList.remove('copied');
            }, 2000);
          } catch (err) {
            // Fallback for older browsers
            input.select();
            document.execCommand('copy');
            button.textContent = 'Copied!';
            button.classList.add('copied');
            
            setTimeout(() => {
              button.textContent = 'Copy';
              button.classList.remove('copied');
            }, 2000);
          }
        }
      </script>
    </body>
    </html>
  `;
}
