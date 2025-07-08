import { getAdminNavigation, getAdminStyles, getAdminScripts } from "../components/navigation.ts";

export interface NewShowPageData {
  existingShows: Array<{
    id: number;
    name: string;
  }>;
}

export function renderNewShowTemplate(data: NewShowPageData): string {
  const { existingShows } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Add New Show - Theatre Shifts</title>
      <!-- PWA Manifest -->
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}
      <style>
        /* Show Selection */
        .show-selection { background: #f8f9fa; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; }
        .radio-group { display: flex; gap: 1rem; margin-bottom: 1rem; }
        .radio-group label { display: flex; align-items: center; margin-bottom: 0; }
        .radio-group input[type="radio"] { margin-right: 0.5rem; width: auto; }
        
        /* Time Group */
        .time-group { display: flex; gap: 1rem; }
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
        }
        
        /* Calendar Styles */
        .calendar { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin: 1rem 0; background: #f9f9f9; max-width: 100%; }
        .calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .calendar-nav { background: #007bff; color: white; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer; }
        .calendar-nav:hover { background: #0056b3; }
        .calendar-grid { 
          display: grid; 
          grid-template-columns: repeat(7, minmax(40px, 1fr)); 
          gap: 4px; 
        }
        .calendar-day { 
          padding: 0.75rem; 
          text-align: center; 
          background: white; 
          border: 1px solid #ddd; 
          cursor: pointer; 
          transition: background-color 0.2s;
          min-width: 40px;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .calendar-day:hover { background: #e9ecef; }
        .calendar-day.selected { background: #007bff; color: white; }
        .calendar-day.other-month { color: #ccc; background: #f8f9fa; }
        .calendar-day.today { border: 2px solid #007bff; }
        .calendar-header-day { 
          padding: 0.5rem; 
          text-align: center; 
          font-weight: bold; 
          background: #e9ecef; 
          min-width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .selected-dates { margin: 1rem 0; }
        .selected-date-item { 
          display: inline-block; 
          background: #e9ecef; 
          padding: 0.25rem 0.5rem; 
          margin: 0.25rem; 
          border-radius: 4px; 
          font-size: 0.875rem;
        }
        
        .success-message { 
          background: #d4edda; 
          border: 1px solid #c3e6cb; 
          color: #155724; 
          padding: 1rem; 
          border-radius: 4px; 
          margin-bottom: 1rem; 
          display: none;
        }
        
        .error-message { 
          background: #f8d7da; 
          border: 1px solid #f5c6cb; 
          color: #721c24; 
          padding: 1rem; 
          border-radius: 4px; 
          margin-bottom: 1rem; 
          display: none;
        }
        
        .hidden { display: none; }
        
        .form-text {
          color: #6c757d;
          font-size: 0.875rem;
          margin-top: -0.5rem;
        }
      </style>
    </head>
    <body>
      ${getAdminNavigation('shows')}
      
      <!-- Main Content -->
      <div class="main-content">
        <div class="page-header">
          <h1 class="page-title">Add New Show</h1>
          <div class="page-actions">
            <a href="/admin/shows" class="btn btn-secondary">Back to Shows</a>
          </div>
        </div>

        <div class="content-card">
          <div id="successMessage" class="success-message"></div>
          <div id="errorMessage" class="error-message"></div>

          <form id="showForm">
            <div class="show-selection">
              <div class="radio-group">
                <label>
                  <input type="radio" name="showType" value="new" checked>
                  Create New Show
                </label>
                <label>
                  <input type="radio" name="showType" value="existing">
                  Add to Existing Show
                </label>
              </div>
              
              <div class="form-group" id="newShowName">
                <label for="name">Show Name:</label>
                <input type="text" id="name" name="name" required>
              </div>
              
              <div class="form-group hidden" id="existingShowSelect">
                <label for="existingShow">Select Show:</label>
                <select id="existingShow" name="existingShow">
                  <option value="">-- Select a Show --</option>
                  ${existingShows.map(show => `<option value="${show.id}">${show.name}</option>`).join('')}
                </select>
              </div>
            </div>
            
            <div class="time-group">
              <div class="form-group">
                <label for="startTime">Start Time: <small>(Adelaide time)</small></label>
                <input type="time" id="startTime" name="startTime" required>
              </div>
              
              <div class="form-group">
                <label for="endTime">End Time: <small>(Adelaide time)</small></label>
                <input type="time" id="endTime" name="endTime" required>
              </div>
            </div>
            <div class="form-text text-muted small mb-3">
              All times are stored in Adelaide, Australia timezone regardless of your local time.
            </div>
            
            <div class="form-group">
              <label>Select Show Dates:</label>
              <div class="calendar">
                <div class="calendar-header">
                  <button type="button" class="calendar-nav" id="prevMonth">‹ Previous</button>
                  <h3 id="currentMonth"></h3>
                  <button type="button" class="calendar-nav" id="nextMonth">Next ›</button>
                </div>
                <div class="calendar-grid" id="calendarGrid"></div>
              </div>
              
              <div class="selected-dates">
                <strong>Selected Dates:</strong>
                <div id="selectedDatesDisplay"></div>
              </div>
            </div>
            
            <div class="form-group">
              <button type="submit" class="btn btn-primary">Add Show</button>
              <button type="button" id="clearForm" class="btn btn-secondary">Clear Form</button>
              <a href="/admin/shows" class="btn btn-outline">Cancel</a>
            </div>
          </form>
        </div>
      </div>

      <script src="/src/utils/modal.js"></script>
      <script src="/src/utils/timezone-client.js"></script>
      ${getAdminScripts()}
      <script>
        let currentDate = new Date();
        let selectedDates = [];
        let lastCreatedShowId = null;
        
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Function to create time dropdowns with 15-minute increments
        function setupTimeInputs() {
          const timeInputs = ['startTime', 'endTime'];
          
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
            timeSelectContainer.style.display = 'flex';
            timeSelectContainer.style.gap = '0.5rem';
            timeSelectContainer.style.alignItems = 'center';
            
            // Create hidden input to store the actual time value
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = inputId;
            hiddenInput.id = originalInput.id;
            
            // Hide the original input
            originalInput.style.display = 'none';
            originalInput.id = \`\${inputId}-original\`;
            
            // Function to update the hidden input value
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
            originalContainer.insertBefore(timeSelectContainer, originalInput);
            originalContainer.insertBefore(hiddenInput, originalInput);
            
            // Set default values (12:00 PM for start, 1:00 PM for end)
            if (inputId === 'startTime') {
              hourSelect.value = '12';
              minuteSelect.value = '00';
              ampmSelect.value = 'PM';
            } else {
              hourSelect.value = '01';
              minuteSelect.value = '00';
              ampmSelect.value = 'PM';
            }
            
            // Initialize the hidden input
            updateTimeValue();
          });
        }
        
        // Handle show type radio button changes
        document.querySelectorAll('input[name="showType"]').forEach(radio => {
          radio.addEventListener('change', function() {
            const newShowName = document.getElementById('newShowName');
            const existingShowSelect = document.getElementById('existingShowSelect');
            const nameInput = document.getElementById('name');
            const existingShowInput = document.getElementById('existingShow');
            
            if (this.value === 'new') {
              newShowName.classList.remove('hidden');
              existingShowSelect.classList.add('hidden');
              nameInput.required = true;
              existingShowInput.required = false;
            } else {
              newShowName.classList.add('hidden');
              existingShowSelect.classList.remove('hidden');
              nameInput.required = false;
              existingShowInput.required = true;
            }
          });
        });
        
        function renderCalendar() {
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();
          
          document.getElementById('currentMonth').textContent = \`\${monthNames[month]} \${year}\`;
          
          const firstDay = new Date(year, month, 1);
          const lastDay = new Date(year, month + 1, 0);
          const startDate = new Date(firstDay);
          startDate.setDate(startDate.getDate() - firstDay.getDay());
          
          const calendarGrid = document.getElementById('calendarGrid');
          calendarGrid.innerHTML = '';
          
          // Add day headers
          for (const dayName of dayNames) {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-header-day';
            dayHeader.textContent = dayName;
            calendarGrid.appendChild(dayHeader);
          }
          
          // Add calendar days
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          for (let i = 0; i < 42; i++) {
            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = currentDay.getDate();
            
            const dateString = currentDay.toISOString().split('T')[0];
            
            if (currentDay.getMonth() !== month) {
              dayElement.classList.add('other-month');
            }
            
            if (currentDay.getTime() === today.getTime()) {
              dayElement.classList.add('today');
            }
            
            if (selectedDates.includes(dateString)) {
              dayElement.classList.add('selected');
            }
            
            dayElement.addEventListener('click', () => selectDate(dateString, dayElement));
            calendarGrid.appendChild(dayElement);
          }
        }
        
        function selectDate(dateString, element) {
          const index = selectedDates.indexOf(dateString);
          if (index > -1) {
            selectedDates.splice(index, 1);
            element.classList.remove('selected');
          } else {
            selectedDates.push(dateString);
            element.classList.add('selected');
          }
          updateSelectedDatesDisplay();
        }
        
        function updateSelectedDatesDisplay() {
          const display = document.getElementById('selectedDatesDisplay');
          if (selectedDates.length === 0) {
            display.innerHTML = '<em>No dates selected</em>';
          } else {
            display.innerHTML = selectedDates
              .sort()
              .map(date => \`<span class="selected-date-item">\${AdelaideTime.formatDateAdelaide(date)}</span>\`)
              .join('');
          }
        }
        
        function clearForm() {
          document.getElementById('name').value = '';
          // Reset custom time selects to default values
          document.getElementById(\`startTime-hour\`).value = '12';
          document.getElementById(\`startTime-minute\`).value = '00';
          document.getElementById(\`startTime-ampm\`).value = 'PM';
          document.getElementById(\`endTime-hour\`).value = '01';
          document.getElementById(\`endTime-minute\`).value = '00';
          document.getElementById(\`endTime-ampm\`).value = 'PM';
          // Update hidden inputs
          document.getElementById('startTime').value = '12:00';
          document.getElementById('endTime').value = '13:00';
          document.getElementById('existingShow').value = '';
          selectedDates = [];
          
          // Reset to "Create New Show" option unless we just created a show
          if (lastCreatedShowId === null) {
            document.querySelector('input[name="showType"][value="new"]').checked = true;
            document.getElementById('newShowName').classList.remove('hidden');
            document.getElementById('existingShowSelect').classList.add('hidden');
            document.getElementById('name').required = true;
            document.getElementById('existingShow').required = false;
          }
          
          renderCalendar();
          updateSelectedDatesDisplay();
          hideMessages();
        }
        
        function hideMessages() {
          document.getElementById('successMessage').style.display = 'none';
          document.getElementById('errorMessage').style.display = 'none';
        }
        
        function showSuccess(message) {
          const element = document.getElementById('successMessage');
          element.textContent = message;
          element.style.display = 'block';
          setTimeout(() => element.style.display = 'none', 5000);
        }
        
        function showError(message) {
          const element = document.getElementById('errorMessage');
          element.textContent = message;
          element.style.display = 'block';
        }
        
        // Event listeners
        document.getElementById('prevMonth').addEventListener('click', () => {
          currentDate.setMonth(currentDate.getMonth() - 1);
          renderCalendar();
        });
        
        document.getElementById('nextMonth').addEventListener('click', () => {
          currentDate.setMonth(currentDate.getMonth() + 1);
          renderCalendar();
        });
        
        document.getElementById('clearForm').addEventListener('click', clearForm);
        
        document.getElementById('showForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          hideMessages();
          
          const showType = document.querySelector('input[name="showType"]:checked').value;
          const startTime = document.getElementById('startTime').value;
          const endTime = document.getElementById('endTime').value;
          
          if (selectedDates.length === 0) {
            showError('Please select at least one date.');
            return;
          }
          
          if (!startTime || !endTime) {
            showError('Please fill in all fields.');
            return;
          }
          
          let showName, showId;
          
          if (showType === 'new') {
            showName = document.getElementById('name').value;
            if (!showName) {
              showError('Please enter a show name.');
              return;
            }
          } else {
            showId = document.getElementById('existingShow').value;
            if (!showId) {
              showError('Please select a show.');
              return;
            }
            // Find the show name from the dropdown
            const selectElement = document.getElementById('existingShow');
            showName = selectElement.options[selectElement.selectedIndex].text;
          }
          
          // For each selected date, combine with the start and end times and convert to Adelaide timezone
          const performances = selectedDates.map(date => {
            // Convert times to Adelaide timezone timestamps
            // This ensures times are recorded in Adelaide timezone regardless of user's local timezone
            const startTimestamp = AdelaideTime.saveTimeAsAdelaideTZ(startTime, date);
            const endTimestamp = AdelaideTime.saveTimeAsAdelaideTZ(endTime, date);
            
            if (!startTimestamp || !endTimestamp) {
              console.error("Failed to convert times to Adelaide timezone for date " + date);
              // Fallback to direct concatenation if conversion fails
              return {
                start_time: date + "T" + startTime + ":00",
                end_time: date + "T" + endTime + ":00"
              };
            }
            
            return {
              start_time: startTimestamp,
              end_time: endTimestamp
            };
          });
          
          try {
            const response = await fetch('/admin/api/shows', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                name: showName, 
                performances,
                existingShowId: showType === 'existing' ? parseInt(showId) : null
              }),
              credentials: 'include'
            });
            
            if (response.ok) {
              const result = await response.json();
              const successful = result.results.filter(r => r.success);
              const failed = result.results.filter(r => !r.success);
              
              let message = \`Successfully added \${successful.length} date(s) to "\${showName}".\`;
              if (failed.length > 0) {
                message += \` \${failed.length} date(s) were skipped (duplicates).\`;
              }
              
              showSuccess(message);
              
              // Store the created/updated show ID
              lastCreatedShowId = result.showId;
              
              // Switch to "Add to Existing Show" and select the show we just worked with
              document.querySelector('input[name="showType"][value="existing"]').checked = true;
              document.getElementById('newShowName').classList.add('hidden');
              document.getElementById('existingShowSelect').classList.remove('hidden');
              document.getElementById('name').required = false;
              document.getElementById('existingShow').required = true;
              document.getElementById('existingShow').value = lastCreatedShowId;
              
              // Clear only the dates and times, keep the show selected
              document.getElementById(\`startTime-hour\`).value = '12';
              document.getElementById(\`startTime-minute\`).value = '00';
              document.getElementById(\`startTime-ampm\`).value = 'PM';
              document.getElementById(\`endTime-hour\`).value = '01';
              document.getElementById(\`endTime-minute\`).value = '00';
              document.getElementById(\`endTime-ampm\`).value = 'PM';
              document.getElementById('startTime').value = '12:00';
              document.getElementById('endTime').value = '13:00';
              selectedDates = [];
              renderCalendar();
              updateSelectedDatesDisplay();
            } else {
              showError('Failed to create show. Please try again.');
            }
          } catch (error) {
            showError('Error creating show. Please try again.');
          }
        });
        
        // Initialize calendar and time inputs
        renderCalendar();
        updateSelectedDatesDisplay();
        setupTimeInputs();
        
        // Display current Adelaide timezone info
        const tzInfo = document.querySelector('.form-text.text-muted.small');
        if (tzInfo) {
          const adelaideTZ = AdelaideTime.getAdelaideTimezoneOffset();
          const adelaideNow = AdelaideTime.formatTimeAdelaide(new Date(), { hour12: true });
          tzInfo.innerHTML += " Current Adelaide time: <strong>" + adelaideNow + " " + adelaideTZ + "</strong>";
        }
</script>
  </body>
  </html>
    `;
}
