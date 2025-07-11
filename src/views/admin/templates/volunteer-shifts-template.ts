import { getAdminNavigation, getAdminStyles, getAdminScripts } from "../components/navigation.ts";

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
}

export function renderVolunteerShiftsTemplate(data: VolunteerShiftsPageData): string {
  const { volunteer, assignedShifts } = data;
  
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
      </style>
    </head>
    <body>
      ${getAdminNavigation('volunteers')}
      
      <!-- Main Content -->
      <div class="main-content">
        <div class="back-link">
          <a href="/admin/volunteers">← Back to Participants</a>
        </div>
        
        <div class="volunteer-header">
          <div class="volunteer-info">
            <h2>${volunteer.name}</h2>
            <p><strong>Email:</strong> ${volunteer.email || 'N/A'}</p>
            <p><strong>Participant ID:</strong> ${volunteer.id}</p>
          </div>
        </div>
        
        <div class="summary-stats">
          <div class="stat-card">
            <div class="stat-number">${assignedShifts.length}</div>
            <div class="stat-label">Upcoming Assigned Shifts</div>
          </div>
        </div>
        
        <!-- Assigned Shifts Section -->
        <section>
          <div class="section-header">
            <h3>Upcoming Assigned Shifts</h3>
          </div>
          
          <div class="shifts-grid">
            ${assignedShifts.length === 0 ? 
              '<div class="no-shifts">No upcoming shifts currently assigned</div>' :
              assignedShifts.map(shift => `
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
                    <button class="btn btn-sm btn-danger" onclick="removeShift(${shift.id}, '${shift.role.replace(/'/g, "\\'")}', '${shift.show_name.replace(/'/g, "\\'")}')">
                      Remove
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="swapShift(${shift.id}, '${shift.role.replace(/'/g, "\\'")}', '${shift.show_name.replace(/'/g, "\\'")}')">
                      Swap
                    </button>
                  </div>
                </div>
              `).join('')
            }
          </div>
        </section>
      </div>

      <script src="/src/utils/modal.js"></script>
      <script src="/src/utils/timezone-client.js"></script>
      ${getAdminScripts()}
      <script>
        const volunteerId = ${volunteer.id};
        const volunteerName = "${volunteer.name.replace(/"/g, '\\"')}";
        const allShifts = ${JSON.stringify(assignedShifts)};
        
        // No timezone filtering or conversion. Display as received.
        
        // Remove shift function - make it globally accessible
        window.removeShift = async function(shiftId, role, showName) {
          const confirmed = await Modal.confirm(
            'Remove Shift Assignment',
            'Are you sure you want to remove <strong>' + volunteerName + '</strong> from the <strong>' + role + '</strong> shift for <strong>' + showName + '</strong>?',
            () => true,
            () => false
          );
          
          if (!confirmed) return;
          
          try {
            const response = await fetch('/admin/api/volunteers/' + volunteerId + '/shifts/' + shiftId, {
              method: 'DELETE',
              credentials: 'include'
            });
            
            if (response.ok) {
              Modal.success('Success', 'Shift assignment removed successfully');
              setTimeout(() => window.location.reload(), 1500);
            } else {
              const error = await response.text();
              Modal.error('Error', 'Failed to remove shift assignment: ' + error);
            }
          } catch (error) {
            console.error('Error removing shift:', error);
            Modal.error('Error', 'Failed to remove shift assignment');
          }
        }
        
        // Swap shift function - swap with another role on the same performance - make it globally accessible
        window.swapShift = async function(shiftId, role, showName) {
          try {
            // First, get list of other roles available for the same performance
            const response = await fetch('/admin/api/shifts/' + shiftId + '/available-roles', {
              credentials: 'include'
            });
            
            if (!response.ok) {
              Modal.error('Error', 'Failed to load available roles for swap');
              return;
            }
            
            const availableRoles = await response.json();
            
            if (availableRoles.length === 0) {
              Modal.alert('No Available Roles', 'There are no other available roles for this performance that you can swap to.');
              return;
            }
            
            // Create role selection modal content
            const roleOptions = availableRoles.map(roleShift => 
              '<option value="' + roleShift.id + '">' + roleShift.role + '</option>'
            ).join('');
            
            const modalContent = 
              '<p>Select a role to swap to for <strong>' + showName + '</strong>:</p>' +
              '<p>Current role: <strong>' + role + '</strong></p>' +
              '<select id="swapRoleSelect" class="form-control" style="width: 100%; margin: 1rem 0;">' +
                '<option value="">Select a role...</option>' +
                roleOptions +
              '</select>';
            
            Modal.confirm(
              'Swap to Different Role',
              modalContent,
              () => {
                const newShiftId = document.getElementById('swapRoleSelect').value;
                if (!newShiftId) {
                  Modal.error('Error', 'Please select a role to swap to');
                  return;
                }
                
                window.performRoleSwap(shiftId, newShiftId, role, showName);
              }
            );
            
          } catch (error) {
            console.error('Error initiating role swap:', error);
            Modal.error('Error', 'Failed to initiate role swap');
          }
        }
        
        // Perform the actual role swap - make it globally accessible
        window.performRoleSwap = async function(currentShiftId, newShiftId, currentRole, showName) {
          try {
            // Remove from current role
            let response = await fetch('/admin/api/volunteers/' + volunteerId + '/shifts/' + currentShiftId, {
              method: 'DELETE',
              credentials: 'include'
            });
            
            if (!response.ok) {
              Modal.error('Error', 'Failed to remove current assignment');
              return;
            }
            
            // Assign to new role
            response = await fetch('/admin/api/volunteer-shifts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                volunteerId: volunteerId, 
                shiftId: newShiftId 
              }),
              credentials: 'include'
            });
            
            if (response.ok) {
              Modal.success('Success', 'Role swapped successfully');
              setTimeout(() => window.location.reload(), 1500);
            } else {
              // Try to reassign original role if new assignment failed
              await fetch('/admin/api/volunteer-shifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  volunteerId: volunteerId, 
                  shiftId: currentShiftId 
                }),
                credentials: 'include'
              });
              
              Modal.error('Error', 'Failed to assign new role. Original assignment restored.');
            }
          } catch (error) {
            console.error('Error performing role swap:', error);
            Modal.error('Error', 'Failed to complete role swap');
          }
        }
      </script>
    </body>
    </html>
  `;
}
