import { getAdminNavigation, getAdminStyles, getAdminScripts } from "../components/navigation.ts";

export interface Volunteer {
  id: number;
  name: string;
  email: string;
  phone: string;
  approved: boolean;
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
        
        /* Toggle switch styles */
        .approval-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: #28a745;
        }
        input:checked + .slider:before {
          transform: translateX(26px);
        }
        .approval-status {
          font-size: 0.875rem;
          font-weight: 500;
        }
        .approval-status.approved {
          color: #28a745;
        }
        .approval-status.pending {
          color: #dc3545;
        }
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
                <th>Login Enabled</th>
                <th>Signup Link</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${volunteers.map(volunteer => `
                <tr>
                  <td>${volunteer.id}</td>
                  <td><strong>${volunteer.name}</strong></td>
                  <td>${volunteer.email || 'N/A'}</td>
                  <td>${volunteer.phone || 'N/A'}</td>
                  <td>
                    <div class="approval-toggle">
                      <label class="switch">
                        <input type="checkbox" ${volunteer.approved ? 'checked' : ''} 
                               onchange="toggleApproval('${volunteer.id}', this.checked, '${volunteer.name.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\\/g, '\\\\')}')">
                        <span class="slider"></span>
                      </label>
                      <span class="approval-status ${volunteer.approved ? 'approved' : 'pending'}">${volunteer.approved ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </td>
                  <td>
                    <div class="signup-url-container">
                      <input type="text" class="signup-url" value="/volunteer/signup/${volunteer.id}" readonly id="url-${volunteer.id}" data-full-url="">
                      <button class="copy-btn" onclick="copySignupUrl('${volunteer.id}')" id="copy-btn-${volunteer.id}">Copy</button>
                    </div>
                  </td>
                  <td>
                    <div class="table-actions">
                      <a href="/admin/volunteers/${volunteer.id}/shifts" class="btn btn-sm btn-info">Shifts</a>
                      <a href="/admin/volunteers/${volunteer.id}/edit" class="btn btn-sm btn-secondary">Edit</a>
                      <button class="send-pdf-btn btn btn-sm btn-success" data-volunteer-id="${volunteer.id}" data-volunteer-name="${volunteer.name}" data-volunteer-email="${volunteer.email || ''}" ${!volunteer.email ? 'disabled title="No email address"' : ''}>📧 Send PDF</button>
                      <button onclick="deleteVolunteer('${volunteer.id}', '${volunteer.name.replace(/'/g, "\\'")}')" class="btn btn-sm btn-danger">Delete</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <script src="/src/utils/modal.js"></script>
      <script src="/src/utils/timezone-client.js"></script>
      <script src="/src/views/admin/volunteers.js"></script>
      ${getAdminScripts()}
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

          // Add event listeners for Send PDF buttons
          const sendPdfButtons = document.querySelectorAll('.send-pdf-btn');
          sendPdfButtons.forEach(button => {
            button.addEventListener('click', function() {
              const volunteerId = this.getAttribute('data-volunteer-id');
              const volunteerName = this.getAttribute('data-volunteer-name');
              const volunteerEmail = this.getAttribute('data-volunteer-email');
              
              console.log('Send PDF clicked:', { volunteerId, volunteerName, volunteerEmail });
              
              if (volunteerId && volunteerName) {
                sendSchedulePDF(volunteerId, volunteerName, volunteerEmail);
              }
            });
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
        
        // Toggle approval status
        async function toggleApproval(volunteerId, approved, volunteerName) {
          try {
            // If disabling, check for outstanding shifts first
            if (!approved) {
              const shiftsResponse = await fetch(\`/admin/api/volunteers/\${volunteerId}/shifts/simple\`, {
                credentials: 'include'
              });
              
              if (shiftsResponse.ok) {
                const shifts = await shiftsResponse.json();
                if (shifts.length > 0) {
                  // Show modal with shift details
                  const shiftsList = shifts.map(shift => {
                    // Use date string directly without timezone conversion
                    const shiftDate = shift.date;
                    
                    return \`<li>• \${shift.show_name} - \${shift.role} (\${shiftDate} at \${shift.time})</li>\`;
                  }).join('');
                  
                  const modalContent = \`
                    <p><strong>\${volunteerName}</strong> has \${shifts.length} outstanding shift\${shifts.length > 1 ? 's' : ''}:</p>
                    <ul style="margin: 1rem 0; padding-left: 1.5rem;">\${shiftsList}</ul>
                    <p><strong>Warning:</strong> Disabling login will remove them from these shifts and generate a PDF report for your records.</p>
                    <p>Do you want to continue?</p>
                  \`;
                  
                  // Show confirmation modal
                  if (typeof Modal !== 'undefined') {
                    Modal.confirm(
                      'Disable Login Access',
                      modalContent,
                      async () => {
                        // User confirmed - proceed with disabling
                        await proceedWithDisabling(volunteerId, approved, volunteerName, shifts);
                      },
                      () => {
                        // User cancelled - revert the toggle
                        const checkbox = document.querySelector(\`input[onchange*="toggleApproval(\${volunteerId}"]\`);
                        if (checkbox) checkbox.checked = true;
                      }
                    );
                  } else {
                    // Fallback to browser confirm if Modal is not available
                    const shiftSummary = shifts.map(shift => \`\${shift.show_name} - \${shift.role}\`).join(', ');
                    const message = \`\${volunteerName} has \${shifts.length} outstanding shift(s): \${shiftSummary}. Disabling login will remove them from these shifts. Continue?\`;
                    if (confirm(message)) {
                      await proceedWithDisabling(volunteerId, approved, volunteerName, shifts);
                    } else {
                      const checkbox = document.querySelector(\`input[onchange*="toggleApproval(\${volunteerId}"]\`);
                      if (checkbox) checkbox.checked = true;
                    }
                  }
                  return; // Exit early to wait for modal response
                }
              }
            }
            
            // No shifts or enabling - proceed directly
            await updateApprovalStatus(volunteerId, approved, volunteerName);
          } catch (error) {
            console.error('Error updating approval:', error);
            revertToggle(volunteerId, approved);
            
            if (typeof Modal !== 'undefined') {
              Modal.error('Error', 'Error updating approval status');
            } else {
              alert('Error updating approval status');
            }
          }
        }
        
        // Helper function to proceed with disabling after confirmation
        async function proceedWithDisabling(volunteerId, approved, volunteerName, shifts) {
          try {
            // Generate and download PDF before proceeding
            await generateShiftRemovalPDF(volunteerId, volunteerName, shifts);
            
            // Update approval status
            await updateApprovalStatus(volunteerId, approved, volunteerName);
          } catch (error) {
            console.error('Error disabling volunteer:', error);
            revertToggle(volunteerId, approved);
            
            if (typeof Modal !== 'undefined') {
              Modal.error('Error', 'Error disabling volunteer access');
            } else {
              alert('Error disabling volunteer access');
            }
          }
        }
        
        // Helper function to update approval status
        async function updateApprovalStatus(volunteerId, approved, volunteerName) {
          const response = await fetch(\`/admin/api/volunteers/\${volunteerId}/approval\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approved }),
            credentials: 'include'
          });
          
          if (response.ok) {
            // Update the status text
            const statusSpan = document.querySelector(\`input[onchange*="toggleApproval(\${volunteerId}"] + .slider + .approval-status\`);
            if (statusSpan) {
              statusSpan.textContent = approved ? 'Enabled' : 'Disabled';
              statusSpan.className = \`approval-status \${approved ? 'approved' : 'pending'}\`;
            }
            
            // Show success message
            if (typeof Modal !== 'undefined') {
              Modal.success('Success', \`Login \${approved ? 'enabled' : 'disabled'} for \${volunteerName}\`);
            }
          } else {
            // Revert the toggle on error
            revertToggle(volunteerId, approved);
            
            if (typeof Modal !== 'undefined') {
              Modal.error('Error', 'Failed to update approval status');
            } else {
              alert('Failed to update approval status');
            }
          }
        }
        
        // Helper function to revert toggle state
        function revertToggle(volunteerId, approved) {
          const checkbox = document.querySelector(\`input[onchange*="toggleApproval(\${volunteerId}"]\`);
          if (checkbox) checkbox.checked = !approved;
        }
        
        // Generate PDF for removed shifts
        async function generateShiftRemovalPDF(volunteerId, volunteerName, shifts) {
          try {
            const response = await fetch(\`/admin/api/volunteers/\${volunteerId}/shifts/removal-pdf\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ shifts }),
              credentials: 'include'
            });
            
            if (response.ok) {
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = \`shift-removal-\${volunteerName.replace(/[^a-zA-Z0-9]/g, '-')}-\${new Date().toISOString().split('T')[0]}.txt\`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            }
          } catch (error) {
            console.error('Error generating PDF:', error);
            // Continue anyway - the PDF is nice to have but not critical
          }
        }
        
        // Send schedule PDF via email
        async function sendSchedulePDF(volunteerId, volunteerName, volunteerEmail) {
          console.log('sendSchedulePDF called with:', { volunteerId, volunteerName, volunteerEmail });
          
          if (!volunteerEmail) {
            if (typeof Modal !== 'undefined') {
              Modal.error('Cannot Send PDF', 'This volunteer does not have an email address on file.');
            } else {
              alert('Cannot send PDF: No email address on file');
            }
            return;
          }
          
          // Generate the confirmation message fresh each time
          console.log('Generating modal with:', { volunteerName, volunteerEmail });
          
          if (typeof Modal !== 'undefined') {
            // Generate unique modal ID to prevent caching issues
            const uniqueModalId = \`send-pdf-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
            const modalTitle = 'Send Schedule PDF';
            const modalMessage = \`Send \${volunteerName}'s schedule PDF to \${volunteerEmail}?\`;
            
            console.log('Modal message will be:', modalMessage);
            console.log('Using modal ID:', uniqueModalId);
            
            // Use showModal with unique ID instead of confirm method
            Modal.showModal(uniqueModalId, {
              title: modalTitle,
              body: \`<p>\${modalMessage}</p>\`,
              buttons: [
                {
                  text: 'Cancel',
                  className: 'modal-btn-outline',
                  action: 'cancel',
                  handler: () => {
                    console.log('Send PDF cancelled');
                  }
                },
                {
                  text: 'Send PDF',
                  className: 'modal-btn-primary',
                  action: 'confirm',
                  handler: async () => {
                    // Capture the variables at modal confirmation time
                    const currentVolunteerId = volunteerId;
                    const currentVolunteerEmail = volunteerEmail;
                    const currentVolunteerName = volunteerName;
                    
                    try {
                      console.log('Modal confirmed, sending to:', { currentVolunteerId, currentVolunteerName, currentVolunteerEmail });
                      
                      const response = await fetch(\`/admin/api/volunteers/\${currentVolunteerId}/email-schedule-pdf\`, {
                        method: 'POST',
                        credentials: 'include'
                      });
                      
                      if (response.ok) {
                        const result = await response.json();
                        const message = result.hasShifts 
                          ? \`Schedule PDF sent to \${currentVolunteerEmail}! They have \${result.shiftsCount} upcoming shifts.\`
                          : \`Schedule PDF sent to \${currentVolunteerEmail}! They currently have no assigned shifts for future dates.\`;
                          
                        Modal.success('PDF Sent', message);
                      } else {
                        const error = await response.json();
                        Modal.error('Error', 'Failed to send PDF: ' + (error.error || 'Unknown error'));
                      }
                    } catch (error) {
                      console.error('Error sending PDF:', error);
                      Modal.error('Error', 'Error sending schedule PDF');
                    }
                  }
                }
              ]
            });
          } else {
            const confirmMessage = \`Send \${volunteerName}'s schedule PDF to \${volunteerEmail}?\`;
            if (confirm(confirmMessage)) {
              try {
                const response = await fetch(\`/admin/api/volunteers/\${volunteerId}/email-schedule-pdf\`, {
                  method: 'POST',
                  credentials: 'include'
                });
                
                if (response.ok) {
                  const result = await response.json();
                  const message = result.hasShifts 
                    ? \`Schedule PDF sent to \${volunteerEmail}! They have \${result.shiftsCount} upcoming shifts.\`
                    : \`Schedule PDF sent to \${volunteerEmail}! They currently have no assigned shifts for future dates.\`;
                    
                  alert(message);
                } else {
                  const error = await response.json();
                  alert('Failed to send PDF: ' + (error.error || 'Unknown error'));
                }
              } catch (error) {
                console.error('Error sending PDF:', error);
                alert('Error sending schedule PDF');
              }
            }
          }
        }
      </script>
    </body>
    </html>
  `;
}
