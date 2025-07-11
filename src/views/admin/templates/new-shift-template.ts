import { getAdminNavigation, getAdminStyles, getAdminScripts } from "../components/navigation.ts";

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
        .time-select { 
          padding: 0.375rem;
          border: 1px solid #ced4da;
          border-radius: 0.25rem;
          font-size: 1rem;
        }
        .hour-select, .minute-select { width: 70px; }
        .ampm-select { width: 70px; }
        .time-select-container {
          margin-bottom: 0.5rem;
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
          .checkbox-group { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 0.75rem; margin-top: 1rem; }
        .checkbox-item { 
          display: flex; 
          align-items: center; 
          background: white;
          padding: 0.75rem;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          transition: all 0.2s ease;
          cursor: pointer;
          user-select: none;
          position: relative;
          min-height: 50px;
          overflow: hidden;
        }
        .checkbox-item:hover {
          border-color: #007bff;
          background: #f8f9fa;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
        }
        .checkbox-item:active {
          transform: translateY(0);
          box-shadow: 0 1px 4px rgba(0, 123, 255, 0.2);
        }
        .checkbox-item.checked {
          border-color: #007bff;
          background: #e3f2fd;
        }
        .checkbox-item input[type="checkbox"] { 
          margin-right: 0.5rem; 
          transform: scale(0.9);
          cursor: pointer;
          pointer-events: none;
          flex-shrink: 0;
          width: 16px;
          height: 16px;
        }
        .checkbox-item label {
          cursor: pointer;
          margin: 0;
          font-weight: 500;
          color: #495057;
          pointer-events: none;
          flex: 1;
          word-wrap: break-word;
          line-height: 1.3;
        }
          .roles-section { background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; }
        .show-dates-section { background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; }
        
        .help-text { 
          color: #6c757d; 
          font-size: 0.9rem; 
          margin: 0.5rem 0 1rem 0; 
          font-style: italic; 
        }
        .form-text { 
          color: #6c757d; 
          font-size: 0.85rem; 
          margin-top: 0.25rem; 
          display: block; 
        }
        
        .custom-role-group { margin-top: 1.5rem; }
        .custom-role-input { display: flex; gap: 0.5rem; align-items: center; max-width: 400px; }
        .custom-role-input input { flex: 1; max-width: 250px; }
        .custom-role-input button { padding: 0.5rem 1rem; white-space: nowrap; }
        
        .custom-role-warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          margin-top: 0.5rem;
          font-size: 0.9rem;
          display: none;
        }
        
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
              <p class="help-text">Select the performance dates for this shift. Each selected date will get its own shift with the times specified below.</p>
              
              <div class="filter-actions" id="dateFilterActions" style="margin-bottom: 1rem; display: none;">
                <button type="button" class="filter-btn" onclick="selectAllDates()">Select All</button>
                <button type="button" class="filter-btn" onclick="selectNoDates()">Select None</button>
                <div id="timeGroupActions" style="display: inline-block; margin-left: 1rem;">
                  <!-- Time group buttons will be added here dynamically -->
                </div>
              </div>
              
              <div id="showDatesList" class="checkbox-group">
              </div>
            </div>
              <div class="time-group">
              <div class="form-group">
                <label for="arrive_time">Arrive Time:</label>
                <input type="time" id="arrive_time" name="arrive_time" required>
                <small class="form-text">Time to arrive on each selected performance date (15-minute increments)</small>
              </div>
              
              <div class="form-group">
                <label for="depart_time">Depart Time:</label>
                <input type="time" id="depart_time" name="depart_time" required>
                <small class="form-text">Time to depart on each selected performance date (15-minute increments)</small>
              </div>
            </div>
              <div id="nextDayWarning" class="warning-message">
              ⚠️ <strong>Following Day:</strong> Depart time is before arrive time, so the depart time will be saved as the next day for each selected performance date.
            </div>
            
            <div class="roles-section">
              <label>Roles:</label>
              <div id="defaultRolesList" class="checkbox-group">
                <!-- Default roles will be loaded here -->
              </div>
                <div class="custom-role-group">
                <label for="customRole">Custom Role:</label>
                <div class="custom-role-input">
                  <input type="text" id="customRole" placeholder="Enter custom role name" maxlength="50">
                  <button type="button" id="addCustomRole" class="btn btn-secondary">Add Role</button>
                </div>
                <div id="customRoleWarning" class="custom-role-warning">
                  ⚠️ You have entered a custom role name but haven't added it yet. Click "Add Role" to include it.
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
      ${getAdminScripts()}
      <script src="/src/views/admin/new-shift.js"></script>
      <script>
        // Function to create time dropdowns with 15-minute increments
        function setupTimeInputs() {
          const timeInputs = ['arrive_time', 'depart_time'];
          
          timeInputs.forEach(inputId => {
            const originalInput = document.getElementById(inputId);
            const originalContainer = originalInput.parentNode;
            
            // Create custom select elements
            const hourSelect = document.createElement('select');
            hourSelect.id = \`\${inputId}-hour\`;
            hourSelect.className = 'time-select hour-select';
            hourSelect.required = true;
            
            const minuteSelect = document.createElement('select');
            minuteSelect.id = \`\${inputId}-minute\`;
            minuteSelect.className = 'time-select minute-select';
            minuteSelect.required = true;
            
            const ampmSelect = document.createElement('select');
            ampmSelect.id = \`\${inputId}-ampm\`;
            ampmSelect.className = 'time-select ampm-select';
            
            // Add hours (12-hour format)
            for (let i = 1; i <= 12; i++) {
              const option = document.createElement('option');
              option.value = i === 12 ? '0' : String(i).padStart(2, '0');
              option.textContent = String(i);
              hourSelect.appendChild(option);
            }
            
            // Add minutes (00, 15, 30, 45)
            ['00', '15', '30', '45'].forEach(minute => {
              const option = document.createElement('option');
              option.value = minute;
              option.textContent = minute;
              minuteSelect.appendChild(option);
            });
            
            // Add AM/PM
            ['AM', 'PM'].forEach(period => {
              const option = document.createElement('option');
              option.value = period;
              option.textContent = period;
              ampmSelect.appendChild(option);
            });
            
            // Create container for selects
            const timeSelectContainer = document.createElement('div');
            timeSelectContainer.className = 'time-select-container';
            
            // Create hidden input to store the actual time value
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = inputId;
            hiddenInput.id = originalInput.id;
            
            // Hide the original input
            originalInput.style.display = 'none';
            originalInput.id = \`\${inputId}-original\`;
            
            // Function to update the hidden input value and check for next day condition
            function updateTimeValue() {
              const hour = parseInt(hourSelect.value);
              const minute = minuteSelect.value;
              const ampm = ampmSelect.value;
              
              // Convert to 24-hour format
              let hour24 = hour;
              if (ampm === 'PM' && hour < 12) hour24 += 12;
              if (ampm === 'AM' && hour === 12) hour24 = 0;
              
              // Format as HH:MM
              const timeValue = \`\${String(hour24).padStart(2, '0')}:\${minute}\`;
              hiddenInput.value = timeValue;
              originalInput.value = timeValue;
              
              // Check for next day warning
              checkNextDayWarning();
            }
            
            // Add event listeners
            hourSelect.addEventListener('change', updateTimeValue);
            minuteSelect.addEventListener('change', updateTimeValue);
            ampmSelect.addEventListener('change', updateTimeValue);
            
            // Add elements to the container
            timeSelectContainer.appendChild(hourSelect);
            timeSelectContainer.appendChild(document.createTextNode(':'));
            timeSelectContainer.appendChild(minuteSelect);
            timeSelectContainer.appendChild(ampmSelect);
            
            // Replace the original input with our custom selector
            originalContainer.insertBefore(timeSelectContainer, originalInput.nextSibling);
            originalContainer.insertBefore(hiddenInput, originalInput);
            
            // Set default values
            // Arrive time default to 6:30 PM
            if (inputId === 'arrive_time') {
              hourSelect.value = '06';
              minuteSelect.value = '30';
              ampmSelect.value = 'PM';
            } 
            // Depart time default to 10:00 PM
            else {
              hourSelect.value = '10';
              minuteSelect.value = '00';
              ampmSelect.value = 'PM';
            }
            
            // Initialize the hidden input
            updateTimeValue();
          });
        }
        
        // Function to check if depart time is before arrive time (next day warning)
        function checkNextDayWarning() {
          const arriveTimeInput = document.getElementById('arrive_time');
          const departTimeInput = document.getElementById('depart_time');
          const nextDayWarning = document.getElementById('nextDayWarning');
          
          if (arriveTimeInput && departTimeInput && arriveTimeInput.value && departTimeInput.value) {
            if (departTimeInput.value < arriveTimeInput.value) {
              nextDayWarning.style.display = 'block';
            } else {
              nextDayWarning.style.display = 'none';
            }
          }
        }
        
        // Initialize time inputs when page loads
        document.addEventListener('DOMContentLoaded', function() {
          setupTimeInputs();
          // Since we replaced the event listeners on the original time inputs,
          // we need to make sure any other scripts that might use these elements
          // still work correctly
          const originalArrive = document.getElementById('arrive_time-original');
          const originalDepart = document.getElementById('depart_time-original');
          originalArrive.addEventListener('change', checkNextDayWarning);
          originalDepart.addEventListener('change', checkNextDayWarning);
        });
        
        // Date selection functions
        function selectAllDates() {
          const checkboxes = document.querySelectorAll('#showDatesList input[type="checkbox"]');
          checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            const checkboxItem = checkbox.closest('.checkbox-item');
            if (checkboxItem) {
              checkboxItem.classList.add('checked');
            }
          });
        }
        
        function selectNoDates() {
          const checkboxes = document.querySelectorAll('#showDatesList input[type="checkbox"]');
          checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            const checkboxItem = checkbox.closest('.checkbox-item');
            if (checkboxItem) {
              checkboxItem.classList.remove('checked');
            }
          });
        }
        
        function selectTimeGroup(startTime, endTime, showStartTime, showEndTime) {
          const checkboxes = document.querySelectorAll('#showDatesList input[type="checkbox"]');
          checkboxes.forEach(checkbox => {
            const label = checkbox.nextElementSibling;
            if (label && label.textContent.includes(\`\${startTime} to \${endTime}\`)) {
              checkbox.checked = true;
              const checkboxItem = checkbox.closest('.checkbox-item');
              if (checkboxItem) {
                checkboxItem.classList.add('checked');
              }
            }
          });
          
          // Auto-set arrive and depart times
          if (showStartTime && showEndTime) {
            setArriveTime(showStartTime, -60); // 1 hour before show start
            setDepartTime(showEndTime, 30);    // 30 minutes after show end
          }
        }
        
        function setArriveTime(showStartTime, offsetMinutes) {
          // Extract time portion from datetime string (e.g., "2025-07-17T19:30:00" -> "19:30:00")
          const timeOnly = showStartTime.includes('T') ? showStartTime.split('T')[1] : showStartTime;
          const [hours24, minutes] = timeOnly.split(':').map(Number);
          
          // Create date object and add offset
          const showStart = new Date();
          showStart.setHours(hours24, minutes, 0, 0);
          const arriveTime = new Date(showStart.getTime() + (offsetMinutes * 60000));
          
          // Get final hour and minute values
          let finalHour = arriveTime.getHours();
          let finalMinute = arriveTime.getMinutes();
          
          // Round to nearest 15-minute increment
          const roundedMinute = Math.round(finalMinute / 15) * 15;
          if (roundedMinute === 60) {
            finalMinute = 0;
            finalHour += 1;
          } else {
            finalMinute = roundedMinute;
          }
          
          // Convert to 12-hour format for the dropdowns
          const ampm = finalHour >= 12 ? 'PM' : 'AM';
          let hour12 = finalHour;
          if (finalHour > 12) {
            hour12 = finalHour - 12;
          } else if (finalHour === 0) {
            hour12 = 12;
          }
          
          // Get the time selector elements
          const hourSelect = document.getElementById('arrive_time-hour');
          const minuteSelect = document.getElementById('arrive_time-minute');
          const ampmSelect = document.getElementById('arrive_time-ampm');
          
          if (!hourSelect || !minuteSelect || !ampmSelect) {
            console.error('Time selectors not found');
            return;
          }
          
          // For hour dropdown: 12 uses '0', others use their actual value as string
          const hourValue = hour12 === 12 ? '0' : String(hour12).padStart(2, '0');
          const minuteValue = String(finalMinute).padStart(2, '0');
          
          // Update the selectors
          hourSelect.value = hourValue;
          minuteSelect.value = minuteValue;
          ampmSelect.value = ampm;
          
          // Trigger the update function
          hourSelect.dispatchEvent(new Event('change'));
        }
        
        function setDepartTime(showEndTime, offsetMinutes) {
          // Extract time portion from datetime string (e.g., "2025-07-17T21:30:00" -> "21:30:00")
          const timeOnly = showEndTime.includes('T') ? showEndTime.split('T')[1] : showEndTime;
          const [hours24, minutes] = timeOnly.split(':').map(Number);
          
          // Create date object and add offset
          const showEnd = new Date();
          showEnd.setHours(hours24, minutes, 0, 0);
          const departTime = new Date(showEnd.getTime() + (offsetMinutes * 60000));
          
          // Get final hour and minute values
          let finalHour = departTime.getHours();
          let finalMinute = departTime.getMinutes();
          
          // Round to nearest 15-minute increment
          const roundedMinute = Math.round(finalMinute / 15) * 15;
          if (roundedMinute === 60) {
            finalMinute = 0;
            finalHour += 1;
          } else {
            finalMinute = roundedMinute;
          }
          
          // Convert to 12-hour format for the dropdowns
          const ampm = finalHour >= 12 ? 'PM' : 'AM';
          let hour12 = finalHour;
          if (finalHour > 12) {
            hour12 = finalHour - 12;
          } else if (finalHour === 0) {
            hour12 = 12;
          }
          
          // Get the time selector elements
          const hourSelect = document.getElementById('depart_time-hour');
          const minuteSelect = document.getElementById('depart_time-minute');
          const ampmSelect = document.getElementById('depart_time-ampm');
          
          if (!hourSelect || !minuteSelect || !ampmSelect) {
            console.error('Time selectors not found');
            return;
          }
          
          // For hour dropdown: 12 uses '0', others use their actual value as string
          const hourValue = hour12 === 12 ? '0' : String(hour12).padStart(2, '0');
          const minuteValue = String(finalMinute).padStart(2, '0');
          
          // Update the selectors
          hourSelect.value = hourValue;
          minuteSelect.value = minuteValue;
          ampmSelect.value = ampm;
          
          // Trigger the update function
          hourSelect.dispatchEvent(new Event('change'));
        }
        
        function deselectTimeGroup(startTime, endTime) {
          const checkboxes = document.querySelectorAll('#showDatesList input[type="checkbox"]');
          checkboxes.forEach(checkbox => {
            const label = checkbox.nextElementSibling;
            if (label && label.textContent.includes(\`\${startTime} to \${endTime}\`)) {
              checkbox.checked = false;
              const checkboxItem = checkbox.closest('.checkbox-item');
              if (checkboxItem) {
                checkboxItem.classList.remove('checked');
              }
            }
          });
        }
      </script>
    </body>
    </html>
  `;
}
