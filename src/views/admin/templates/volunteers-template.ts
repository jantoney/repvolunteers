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
        }
        .signup-url { 
          display: none; /* Hide the input box */
        }
        .copy-btn, .open-btn {
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
        .copy-btn:hover, .open-btn:hover {
          background: #218838;
        }
        .copy-btn.copied {
          background: #17a2b8;
        }
        .open-btn {
          background: #007bff;
        }
        .open-btn:hover {
          background: #0056b3;
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
        
        /* Modal button styles */
        .modal-btn-secondary {
          background-color: #6c757d !important;
          border-color: #6c757d !important;
          color: white !important;
        }
        .modal-btn-secondary:hover {
          background-color: #5a6268 !important;
          border-color: #545b62 !important;
        }
        .modal-btn-danger {
          background-color: #dc3545 !important;
          border-color: #dc3545 !important;
          color: white !important;
        }
        .modal-btn-danger:hover {
          background-color: #c82333 !important;
          border-color: #bd2130 !important;
        }
        
        /* Force Mode Notification Banner */
        .force-mode-banner {
          background: linear-gradient(135deg, #ff6b35, #f9ca24);
          border: 2px solid #ff6b35;
          border-radius: 8px;
          margin: 1rem 0;
          box-shadow: 0 4px 6px rgba(255, 107, 53, 0.2);
          animation: pulse-orange 2s infinite;
        }
        .force-mode-content {
          display: flex;
          align-items: center;
          padding: 1rem 1.5rem;
          gap: 1rem;
        }
        .force-mode-icon {
          font-size: 1.5rem;
          filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));
        }
        .force-mode-text {
          flex: 1;
          color: #2c2c2c;
          font-weight: 600;
          text-shadow: 1px 1px 2px rgba(255,255,255,0.5);
        }
        .force-mode-disable {
          background: rgba(255,255,255,0.9);
          border: 2px solid #2c2c2c;
          color: #2c2c2c;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .force-mode-disable:hover {
          background: #fff;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        @keyframes pulse-orange {
          0%, 100% { 
            box-shadow: 0 4px 6px rgba(255, 107, 53, 0.2);
          }
          50% { 
            box-shadow: 0 6px 12px rgba(255, 107, 53, 0.4);
          }
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

        <!-- Force Mode Notification Banner -->
        <div id="forceModeNotification" class="force-mode-banner" style="display: none;">
          <div class="force-mode-content">
            <span class="force-mode-icon">⚠️</span>
            <span class="force-mode-text">
              <strong>FORCE PRODUCTION MODE ACTIVE</strong> - Emails will be sent even in development mode
            </span>
            <button id="disableForceModeBtn" class="force-mode-disable">Remove ?force=true</button>
          </div>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
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
                    </div>
                  </td>
                  <td>
                    <div class="signup-url-container">
                      <input type="text" class="signup-url" value="/volunteer/signup/${volunteer.id}" readonly id="url-${volunteer.id}" data-full-url="">
                      <button class="copy-btn" onclick="copySignupUrl('${volunteer.id}')" id="copy-btn-${volunteer.id}">Copy</button>
                      <button class="open-btn" onclick="openSignupUrl('${volunteer.id}')" id="open-btn-${volunteer.id}">Open</button>
                    </div>
                  </td>
                  <td>
                    <div class="table-actions">
                      <a href="/admin/volunteers/${volunteer.id}/shifts" class="btn btn-sm btn-info">Shifts</a>
                      <a href="/admin/volunteers/${volunteer.id}/edit" class="btn btn-sm btn-secondary">Edit</a>
                      <button class="send-pdf-btn btn btn-sm btn-success" data-volunteer-id="${volunteer.id}" data-volunteer-name="${volunteer.name}" data-volunteer-email="${volunteer.email || ''}" ${!volunteer.email ? 'disabled title="No email address"' : ''}>📧 Send PDF</button>
                      <button class="send-show-week-btn btn btn-sm btn-warning" data-volunteer-id="${volunteer.id}" data-volunteer-name="${volunteer.name}" data-volunteer-email="${volunteer.email || ''}" ${!volunteer.email ? 'disabled title="No email address"' : ''}>🎭 Show Week</button>
                      <button class="send-last-minute-btn btn btn-sm" style="background-color:#ff6b35;color:white;" data-volunteer-id="${volunteer.id}" data-volunteer-name="${volunteer.name}" data-volunteer-email="${volunteer.email || ''}" ${!volunteer.email ? 'disabled title="No email address"' : ''}>🚨 Last Minute</button>
                      <button class="email-history-btn btn btn-sm btn-info" data-volunteer-id="${volunteer.id}" data-volunteer-name="${volunteer.name}">📧 History</button>
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
        // Utility function to check for force parameter and modify API URLs
        function getAPIURL(baseUrl) {
          const urlParams = new URLSearchParams(window.location.search);
          const forceParam = urlParams.get('force');
          if (forceParam === 'true') {
            return baseUrl + '?force=true';
          }
          return baseUrl;
        }
        
        // Check and show force mode notification
        function checkForceMode() {
          const urlParams = new URLSearchParams(window.location.search);
          const forceParam = urlParams.get('force');
          const notification = document.getElementById('forceModeNotification');
          
          if (forceParam === 'true' && notification) {
            notification.style.display = 'block';
            
            // Add click handler for disable button
            const disableBtn = document.getElementById('disableForceModeBtn');
            if (disableBtn) {
              disableBtn.addEventListener('click', function() {
                // Remove force parameter from URL
                const newUrl = new URL(window.location);
                newUrl.searchParams.delete('force');
                window.location.href = newUrl.toString();
              });
            }
          }
        }
        
        // Set full URLs and copy function
        document.addEventListener('DOMContentLoaded', function() {
          // Check and show force mode notification
          checkForceMode();
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
          
          // Add event listeners for Show Week buttons
          const sendShowWeekButtons = document.querySelectorAll('.send-show-week-btn');
          sendShowWeekButtons.forEach(button => {
            button.addEventListener('click', function() {
              const volunteerId = this.getAttribute('data-volunteer-id');
              const volunteerName = this.getAttribute('data-volunteer-name');
              const volunteerEmail = this.getAttribute('data-volunteer-email');
              
              console.log('Send Show Week clicked:', { volunteerId, volunteerName, volunteerEmail });
              
              if (volunteerId && volunteerName) {
                sendShowWeekEmail(volunteerId, volunteerName, volunteerEmail);
              }
            });
          });
          
          // Add event listeners for Last Minute Shifts buttons
          const sendLastMinuteButtons = document.querySelectorAll('.send-last-minute-btn');
          sendLastMinuteButtons.forEach(button => {
            button.addEventListener('click', function() {
              const volunteerId = this.getAttribute('data-volunteer-id');
              const volunteerName = this.getAttribute('data-volunteer-name');
              const volunteerEmail = this.getAttribute('data-volunteer-email');
              
              console.log('Send Last Minute clicked:', { volunteerId, volunteerName, volunteerEmail });
              
              if (volunteerId && volunteerName) {
                sendLastMinuteShiftsEmail(volunteerId, volunteerName, volunteerEmail);
              }
            });
          });
          
          // Add event listeners for Email History buttons
          const emailHistoryButtons = document.querySelectorAll('.email-history-btn');
          emailHistoryButtons.forEach(button => {
            button.addEventListener('click', function() {
              const volunteerId = this.getAttribute('data-volunteer-id');
              const volunteerName = this.getAttribute('data-volunteer-name');
              
              console.log('Email History clicked:', { volunteerId, volunteerName });
              
              if (volunteerId && volunteerName) {
                showEmailHistory(volunteerId, volunteerName);
              }
            });
          });
        });
        
        async function copySignupUrl(volunteerId) {
          const input = document.getElementById(\`url-\${volunteerId}\`);
          const fullUrl = input.getAttribute('data-full-url') || input.value;
          
          try {
            await navigator.clipboard.writeText(fullUrl);
            if (typeof Toast !== 'undefined') {
              Toast.success('Signup URL copied to clipboard!', 2000);
            }
          } catch (err) {
            // Fallback for older browsers
            input.select();
            document.execCommand('copy');
            if (typeof Toast !== 'undefined') {
              Toast.success('Signup URL copied to clipboard!', 2000);
            }
          }
        }
        
        function openSignupUrl(volunteerId) {
          const input = document.getElementById(\`url-\${volunteerId}\`);
          const fullUrl = input.getAttribute('data-full-url') || globalThis.location.origin + input.value;
          globalThis.open(fullUrl, '_blank');
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
                    <p>What would you like to do with their shifts?</p>
                  \`;
                  
                  // Show confirmation modal with shift options
                  if (typeof Modal !== 'undefined') {
                    Modal.showModal(\`disable-volunteer-\${volunteerId}\`, {
                      title: 'Disable Login Access',
                      body: modalContent,
                      buttons: [
                        {
                          text: 'Cancel',
                          className: 'modal-btn-outline',
                          action: 'cancel',
                          handler: () => {
                            // User cancelled - revert the toggle
                            const checkbox = document.querySelector(\`input[onchange*="toggleApproval(\${volunteerId}"]\`);
                            if (checkbox) checkbox.checked = true;
                          }
                        },
                        {
                          text: 'Keep Shifts',
                          className: 'modal-btn-secondary',
                          action: 'keep-shifts',
                          handler: async () => {
                            // Disable but keep shifts
                            await updateApprovalStatus(volunteerId, approved, volunteerName, false);
                            // Close the modal
                            Modal.closeModal(\`disable-volunteer-\${volunteerId}\`);
                          }
                        },
                        {
                          text: 'Remove Shifts',
                          className: 'modal-btn-danger',
                          action: 'remove-shifts',
                          handler: async () => {
                            // Disable and remove shifts
                            await proceedWithDisabling(volunteerId, approved, volunteerName, shifts);
                            // Close the modal
                            Modal.closeModal(\`disable-volunteer-\${volunteerId}\`);
                          }
                        }
                      ]
                    });
                  } else {
                    // Fallback to browser confirm if Modal is not available
                    const shiftSummary = shifts.map(shift => \`\${shift.show_name} - \${shift.role}\`).join(', ');
                    const keepShiftsMessage = \`\${volunteerName} has \${shifts.length} outstanding shift(s): \${shiftSummary}.\n\nChoose an option:\n- OK: Keep shifts (disable login only)\n- Cancel: Remove shifts and generate PDF\`;
                    if (confirm(keepShiftsMessage)) {
                      // Keep shifts - just disable login
                      await updateApprovalStatus(volunteerId, approved, volunteerName, false);
                    } else {
                      // Remove shifts
                      const confirmRemoval = confirm('This will remove them from all shifts and generate a PDF report. Continue?');
                      if (confirmRemoval) {
                        await proceedWithDisabling(volunteerId, approved, volunteerName, shifts);
                      } else {
                        // User cancelled completely - revert the toggle
                        const checkbox = document.querySelector(\`input[onchange*="toggleApproval(\${volunteerId}"]\`);
                        if (checkbox) checkbox.checked = true;
                      }
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
            
            if (typeof Toast !== 'undefined') {
              Toast.error('Error updating approval status');
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
            
            // Update approval status and remove shifts
            await updateApprovalStatus(volunteerId, approved, volunteerName, true);
          } catch (error) {
            console.error('Error disabling volunteer:', error);
            revertToggle(volunteerId, approved);
            
            if (typeof Toast !== 'undefined') {
              Toast.error('Error disabling volunteer access');
            } else {
              alert('Error disabling volunteer access');
            }
          }
        }
        
        // Helper function to update approval status
        async function updateApprovalStatus(volunteerId, approved, volunteerName, removeShifts = true) {
          const response = await fetch(\`/admin/api/volunteers/\${volunteerId}/approval\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approved, removeShifts }),
            credentials: 'include'
          });
          
          if (response.ok) {
            
            // Show success message
            if (typeof Toast !== 'undefined') {
              if (approved) {
                // For enabling, show a brief toast that disappears
                Toast.success(\`\${volunteerName} enabled\`);
              } else {
                // For disabling, show a toast notification
                const actionText = removeShifts ? 'disabled and removed from shifts' : 'disabled (shifts kept)';
                Toast.success(\`\${volunteerName} \${actionText}\`);
              }
            }
          } else {
            // Revert the toggle on error
            revertToggle(volunteerId, approved);
            
            if (typeof Toast !== 'undefined') {
              Toast.error('Failed to update approval status');
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
                    // Capture the variables at modal confirmation time to ensure they're current
                    const currentVolunteerId = volunteerId;
                    const currentVolunteerEmail = volunteerEmail;
                    const currentVolunteerName = volunteerName;
                    
                    try {
                      console.log('Modal confirmed, sending to:', { 
                        currentVolunteerId, 
                        currentVolunteerName, 
                        currentVolunteerEmail,
                        originalArgs: { volunteerId, volunteerName, volunteerEmail }
                      });
                      
                      const response = await fetch(getAPIURL(\`/admin/api/volunteers/\${currentVolunteerId}/email-schedule-pdf\`), {
                        method: 'POST',
                        credentials: 'include'
                      });
                      
                      if (response.ok) {
                        const result = await response.json();
                        console.log('PDF send response:', result);
                        const message = result.hasShifts 
                          ? \`Schedule PDF sent to \${currentVolunteerEmail}! They have \${result.shiftsCount} upcoming shifts.\`
                          : \`Schedule PDF sent to \${currentVolunteerEmail}! They currently have no assigned shifts for future dates.\`;
                          
                        Toast.success(message, 4000);
                      } else {
                        const error = await response.json();
                        Toast.error('Failed to send PDF: ' + (error.error || 'Unknown error'));
                      }
                    } catch (error) {
                      console.error('Error sending PDF:', error);
                      Toast.error('Error sending schedule PDF');
                    }
                  }
                }
              ]
            });
          } else {
            const confirmMessage = \`Send \${volunteerName}'s schedule PDF to \${volunteerEmail}?\`;
            if (confirm(confirmMessage)) {
              try {
                const response = await fetch(getAPIURL(\`/admin/api/volunteers/\${volunteerId}/email-schedule-pdf\`), {
                  method: 'POST',
                  credentials: 'include'
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('PDF send response (fallback):', result);
                  const message = result.hasShifts 
                    ? \`Schedule PDF sent to \${volunteerEmail}! They have \${result.shiftsCount} upcoming shifts.\`
                    : \`Schedule PDF sent to \${volunteerEmail}! They currently have no assigned shifts for future dates.\`;
                    
                  if (typeof Toast !== 'undefined') {
                    Toast.success(message, 4000);
                  } else {
                    alert(message);
                  }
                } else {
                  const error = await response.json();
                  if (typeof Toast !== 'undefined') {
                    Toast.error('Failed to send PDF: ' + (error.error || 'Unknown error'));
                  } else {
                    alert('Failed to send PDF: ' + (error.error || 'Unknown error'));
                  }
                }
              } catch (error) {
                console.error('Error sending PDF:', error);
                if (typeof Toast !== 'undefined') {
                  Toast.error('Error sending schedule PDF');
                } else {
                  alert('Error sending schedule PDF');
                }
              }
            }
          }
        }
        
        // Send Show Week email via email
        async function sendShowWeekEmail(volunteerId, volunteerName, volunteerEmail) {
          console.log('sendShowWeekEmail called with:', { volunteerId, volunteerName, volunteerEmail });
          
          if (!volunteerEmail) {
            if (typeof Modal !== 'undefined') {
              Modal.error('Cannot Send Show Week Email', 'This volunteer does not have an email address on file.');
            } else {
              alert('Cannot send Show Week email: No email address on file');
            }
            return;
          }
          
          // Generate the confirmation message fresh each time
          console.log('Generating modal with:', { volunteerName, volunteerEmail });
          
          if (typeof Modal !== 'undefined') {
            // Generate unique modal ID to prevent caching issues
            const uniqueModalId = \`send-show-week-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
            const modalTitle = "Send It's Show Week Email";
            const modalMessage = \`Send "It's Show Week" email to \${volunteerName} at \${volunteerEmail}?\`;
            
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
                    console.log('Show Week email cancelled');
                  }
                },
                {
                  text: 'Send Email',
                  className: 'modal-btn-primary',
                  action: 'send',
                  handler: async () => {
                    // Close the modal immediately so user can continue working
                    Modal.closeModal(uniqueModalId);
                    
                    // Capture the variables at modal confirmation time to ensure they're current
                    const currentVolunteerId = volunteerId;
                    const currentVolunteerEmail = volunteerEmail;
                    const currentVolunteerName = volunteerName;
                    
                    try {
                      console.log('Modal confirmed, sending to:', { 
                        currentVolunteerId, 
                        currentVolunteerName, 
                        currentVolunteerEmail,
                        originalArgs: { volunteerId, volunteerName, volunteerEmail }
                      });
                      
                      const response = await fetch(getAPIURL(\`/admin/api/volunteers/\${currentVolunteerId}/email-show-week\`), {
                        method: 'POST',
                        credentials: 'include'
                      });
                      
                      if (response.ok) {
                        const result = await response.json();
                        console.log('Show Week email send response:', result);
                        const message = result.hasShifts 
                          ? \`Show Week email sent to \${currentVolunteerEmail}! They have \${result.shiftsCount} upcoming shifts.\`
                          : \`Show Week email sent to \${currentVolunteerEmail}! They currently have no assigned shifts for future dates.\`;
                          
                        Toast.success(message, 4000);
                      } else {
                        const error = await response.json();
                        Toast.error('Failed to send Show Week email: ' + (error.error || 'Unknown error'));
                      }
                    } catch (error) {
                      console.error('Error sending Show Week email:', error);
                      Toast.error('Error sending Show Week email');
                    }
                  }
                }
              ]
            });
          } else {
            const confirmMessage = \`Send "It's Show Week" email to \${volunteerName} at \${volunteerEmail}?\`;
            if (confirm(confirmMessage)) {
              try {
                const response = await fetch(getAPIURL(\`/admin/api/volunteers/\${volunteerId}/email-show-week\`), {
                  method: 'POST',
                  credentials: 'include'
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('Show Week email send response (fallback):', result);
                  const message = result.hasShifts 
                    ? \`Show Week email sent to \${volunteerEmail}! They have \${result.shiftsCount} upcoming shifts.\`
                    : \`Show Week email sent to \${volunteerEmail}! They currently have no assigned shifts for future dates.\`;
                    
                  if (typeof Toast !== 'undefined') {
                    Toast.success(message, 4000);
                  } else {
                    alert(message);
                  }
                } else {
                  const error = await response.json();
                  if (typeof Toast !== 'undefined') {
                    Toast.error('Failed to send Show Week email: ' + (error.error || 'Unknown error'));
                  } else {
                    alert('Failed to send Show Week email: ' + (error.error || 'Unknown error'));
                  }
                }
              } catch (error) {
                console.error('Error sending Show Week email:', error);
                if (typeof Toast !== 'undefined') {
                  Toast.error('Error sending Show Week email');
                } else {
                  alert('Error sending Show Week email');
                }
              }
            }
          }
        }
        
        // Send Last Minute Shifts email via email
        async function sendLastMinuteShiftsEmail(volunteerId, volunteerName, volunteerEmail) {
          console.log('sendLastMinuteShiftsEmail called with:', { volunteerId, volunteerName, volunteerEmail });
          
          if (!volunteerEmail) {
            if (typeof Modal !== 'undefined') {
              Modal.error('Cannot Send Last Minute Email', 'This volunteer does not have an email address on file.');
            } else {
              alert('Cannot send Last Minute Shifts email: No email address on file');
            }
            return;
          }
          
          // Generate the confirmation message fresh each time
          console.log('Generating modal with:', { volunteerName, volunteerEmail });
          
          if (typeof Modal !== 'undefined') {
            // Generate unique modal ID to prevent caching issues
            const uniqueModalId = \`send-last-minute-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
            const modalTitle = "Send Last Minute Shifts Email";
            const modalMessage = \`Send "Last Minute Shifts" email to \${volunteerName} at \${volunteerEmail}?\`;
            
            console.log('Modal message will be:', modalMessage);
            console.log('Using modal ID:', uniqueModalId);
            
            // Use showModal with unique ID instead of confirm method
            Modal.showModal(uniqueModalId, {
              title: modalTitle,
              body: \`<p>\${modalMessage}</p><p><small>This will include a PDF with the next 10 outstanding shifts that need volunteers.</small></p>\`,
              buttons: [
                {
                  text: 'Cancel',
                  className: 'modal-btn-outline',
                  action: 'cancel',
                  handler: () => {
                    console.log('Last Minute Shifts email cancelled');
                  }
                },
                {
                  text: 'Send Email',
                  className: 'modal-btn-primary',
                  action: 'send',
                  handler: async () => {
                    // Close the modal immediately so user can continue working
                    Modal.closeModal(uniqueModalId);
                    
                    // Capture the variables at modal confirmation time to ensure they're current
                    const currentVolunteerId = volunteerId;
                    const currentVolunteerEmail = volunteerEmail;
                    const currentVolunteerName = volunteerName;
                    
                    try {
                      console.log('Modal confirmed, sending to:', { 
                        currentVolunteerId, 
                        currentVolunteerName, 
                        currentVolunteerEmail,
                        originalArgs: { volunteerId, volunteerName, volunteerEmail }
                      });
                      
                      const response = await fetch(getAPIURL(\`/admin/api/volunteers/\${currentVolunteerId}/email-last-minute-shifts\`), {
                        method: 'POST',
                        credentials: 'include'
                      });
                      
                      if (response.ok) {
                        const result = await response.json();
                        console.log('Last Minute Shifts email send response:', result);
                        const message = result.hasShifts 
                          ? \`Last Minute Shifts email sent to \${currentVolunteerEmail}! There are \${result.shiftsCount} outstanding shifts.\`
                          : \`Last Minute Shifts email sent to \${currentVolunteerEmail}! All shifts are currently filled.\`;
                          
                        Toast.success(message, 4000);
                      } else {
                        const error = await response.json();
                        Toast.error('Failed to send Last Minute Shifts email: ' + (error.error || 'Unknown error'));
                      }
                    } catch (error) {
                      console.error('Error sending Last Minute Shifts email:', error);
                      Toast.error('Error sending Last Minute Shifts email');
                    }
                  }
                }
              ]
            });
          } else {
            const confirmMessage = \`Send "Last Minute Shifts" email to \${volunteerName} at \${volunteerEmail}?\`;
            if (confirm(confirmMessage)) {
              try {
                const response = await fetch(getAPIURL(\`/admin/api/volunteers/\${volunteerId}/email-last-minute-shifts\`), {
                  method: 'POST',
                  credentials: 'include'
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('Last Minute Shifts email send response (fallback):', result);
                  const message = result.hasShifts 
                    ? \`Last Minute Shifts email sent to \${volunteerEmail}! There are \${result.shiftsCount} outstanding shifts.\`
                    : \`Last Minute Shifts email sent to \${volunteerEmail}! All shifts are currently filled.\`;
                    
                  if (typeof Toast !== 'undefined') {
                    Toast.success(message, 4000);
                  } else {
                    alert(message);
                  }
                } else {
                  const error = await response.json();
                  if (typeof Toast !== 'undefined') {
                    Toast.error('Failed to send Last Minute Shifts email: ' + (error.error || 'Unknown error'));
                  } else {
                    alert('Failed to send Last Minute Shifts email: ' + (error.error || 'Unknown error'));
                  }
                }
              } catch (error) {
                console.error('Error sending Last Minute Shifts email:', error);
                if (typeof Toast !== 'undefined') {
                  Toast.error('Error sending Last Minute Shifts email');
                } else {
                  alert('Error sending Last Minute Shifts email');
                }
              }
            }
          }
        }
        
        // Show email history for a volunteer
        async function showEmailHistory(volunteerId, volunteerName) {
          console.log('Loading email history for:', { volunteerId, volunteerName });
          
          try {
            const response = await fetch(getAPIURL(\`/admin/api/volunteers/\${volunteerId}/emails\`), {
              method: 'GET',
              credentials: 'include'
            });
            
            if (response.ok) {
              const result = await response.json();
              const emails = result.emails || [];
              
              // Create modal content
              let modalContent = \`
                <div class="email-history-modal">
                  <h3>Email History for \${escapeHtml(volunteerName)}</h3>
                  <div class="email-history-list">
              \`;
              
              if (emails.length === 0) {
                modalContent += \`
                  <div class="no-emails">
                    <p style="color: #666; text-align: center; padding: 2rem;">
                      📧 No emails have been sent to this volunteer yet.
                    </p>
                  </div>
                \`;
              } else {
                emails.forEach(email => {
                  const sentDate = new Date(email.sent_at).toLocaleDateString('en-AU', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  
                  const typeIcon = {
                    'volunteer_login': '🔑',
                    'volunteer_schedule': '📅',
                    'show_week': '🎭',
                    'last_minute_shifts': '🚨'
                  }[email.email_type] || '📧';
                  
                  const statusIcon = {
                    'sent': '✅',
                    'delivered': '✅',
                    'failed': '❌',
                    'simulated': '🧪'
                  }[email.delivery_status] || '❓';
                  
                  modalContent += \`
                    <div class="email-entry">
                      <div class="email-header">
                        <span class="email-type">\${typeIcon} \${email.email_type.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}</span>
                        <span class="email-date">\${sentDate}</span>
                        <span class="email-status">\${statusIcon} \${email.delivery_status}</span>
                      </div>
                      <div class="email-subject">\${escapeHtml(email.subject)}</div>
                      <div class="email-to">To: \${escapeHtml(email.to_email)}</div>
                      \${email.attachment_count > 0 ? \`<div class="email-attachments">📎 \${email.attachment_count} attachment(s)</div>\` : ''}
                    </div>
                  \`;
                });
              }
              
              modalContent += \`
                  </div>
                </div>
                <style>
                  .email-history-modal {
                    max-width: 600px;
                    max-height: 500px;
                    overflow-y: auto;
                  }
                  .email-history-list {
                    margin-top: 1rem;
                  }
                  .email-entry {
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    padding: 1rem;
                    margin-bottom: 0.5rem;
                    background: #f9f9f9;
                  }
                  .email-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                  }
                  .email-type {
                    font-weight: bold;
                    color: #007bff;
                  }
                  .email-date {
                    font-size: 0.9rem;
                    color: #666;
                  }
                  .email-status {
                    font-size: 0.9rem;
                  }
                  .email-subject {
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                  }
                  .email-to {
                    font-size: 0.9rem;
                    color: #666;
                  }
                  .email-attachments {
                    font-size: 0.9rem;
                    color: #007bff;
                    margin-top: 0.5rem;
                  }
                  .no-emails {
                    text-align: center;
                    padding: 2rem;
                  }
                </style>
              \`;
              
              if (typeof Modal !== 'undefined') {
                const uniqueModalId = \`email-history-\${Date.now()}\`;
                Modal.showModal(uniqueModalId, {
                  title: \`Email History - \${volunteerName}\`,
                  body: modalContent,
                  buttons: [
                    {
                      text: 'Close',
                      className: 'modal-btn-outline',
                      action: 'cancel'
                    }
                  ]
                });
              } else {
                // Fallback for browsers without modal support
                const newWindow = window.open('', '_blank', 'width=700,height=600,scrollbars=yes');
                newWindow.document.write(\`
                  <html>
                    <head>
                      <title>Email History - \${escapeHtml(volunteerName)}</title>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .email-entry { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
                        .email-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
                        .email-type { font-weight: bold; color: #007bff; }
                        .email-date { color: #666; }
                        .email-subject { font-weight: bold; margin-bottom: 5px; }
                        .email-to { color: #666; }
                        .email-attachments { color: #007bff; margin-top: 5px; }
                      </style>
                    </head>
                    <body>
                      \${modalContent}
                    </body>
                  </html>
                \`);
                newWindow.document.close();
              }
              
            } else {
              const error = await response.json();
              if (typeof Toast !== 'undefined') {
                Toast.error('Failed to load email history: ' + (error.error || 'Unknown error'));
              } else {
                alert('Failed to load email history: ' + (error.error || 'Unknown error'));
              }
            }
          } catch (error) {
            console.error('Error loading email history:', error);
            if (typeof Toast !== 'undefined') {
              Toast.error('Error loading email history');
            } else {
              alert('Error loading email history');
            }
          }
        }
        
        // HTML escape function
        function escapeHtml(text) {
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }
      </script>
    </body>
    </html>
  `;
}
