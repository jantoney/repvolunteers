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
        
        /* Calendar Styles */
        .calendar { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin: 1rem 0; background: #f9f9f9; }
        .calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .calendar-nav { background: #007bff; color: white; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer; }
        .calendar-nav:hover { background: #0056b3; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }
        .calendar-day { 
          padding: 0.75rem; 
          text-align: center; 
          background: white; 
          border: 1px solid #ddd; 
          cursor: pointer; 
          transition: background-color 0.2s;
        }
        .calendar-day:hover { background: #e9ecef; }
        .calendar-day.selected { background: #007bff; color: white; }
        .calendar-day.other-month { color: #ccc; background: #f8f9fa; }
        .calendar-day.today { border: 2px solid #007bff; }
        .calendar-header-day { padding: 0.5rem; text-align: center; font-weight: bold; background: #e9ecef; }
        
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
                <label for="startTime">Start Time:</label>
                <input type="time" id="startTime" name="startTime" required>
              </div>
              
              <div class="form-group">
                <label for="endTime">End Time:</label>
                <input type="time" id="endTime" name="endTime" required>
              </div>
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
              .map(date => \`<span class="selected-date-item">\${new Date(date).toLocaleDateString()}</span>\`)
              .join('');
          }
        }
        
        function clearForm() {
          document.getElementById('name').value = '';
          document.getElementById('startTime').value = '';
          document.getElementById('endTime').value = '';
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
          
          const dates = selectedDates.map(date => ({
            date: date,
            start_time: startTime,
            end_time: endTime
          }));
          
          try {
            const response = await fetch('/admin/api/shows', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                name: showName, 
                dates,
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
              document.getElementById('startTime').value = '';
              document.getElementById('endTime').value = '';
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
        
        // Initialize calendar
        renderCalendar();
        updateSelectedDatesDisplay();
      </script>
    </body>
    </html>
  `;
}
