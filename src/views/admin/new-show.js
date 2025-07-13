// Global variables
let currentDate = new Date();
let selectedDates = [];
let lastCreatedShowId = null;
let showIntervals = []; // Store intervals temporarily until show is created

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
    hourSelect.id = inputId + "-hour";
    hourSelect.className = 'time-select hour-select';
    hourSelect.required = true;
    
    const minuteSelect = document.createElement('select');
    minuteSelect.id = inputId + "-minute";
    minuteSelect.className = 'time-select minute-select';
    minuteSelect.required = true;
    
    const ampmSelect = document.createElement('select');
    ampmSelect.id = inputId + "-ampm";
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
    originalInput.id = inputId + "-original";
    
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
      const timeValue = String(hour24).padStart(2, '0') + ":" + minute;
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
function initializeShowTypeHandlers() {
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
}

function renderCalendar() {
  console.log("Starting renderCalendar function");
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const currentMonthElement = document.getElementById('currentMonth');
  if (!currentMonthElement) {
    console.error("Cannot find #currentMonth element");
    return;
  }
  
  currentMonthElement.textContent = monthNames[month] + " " + year;

  const firstDay = new Date(year, month, 1);
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
    
    const dateString = currentDay.getFullYear() + "-" + String(currentDay.getMonth() + 1).padStart(2, '0') + "-" + String(currentDay.getDate()).padStart(2, '0');
    
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
  console.log("Updating selected dates display");
  const display = document.getElementById('selectedDatesDisplay');
  if (!display) {
    console.error("Cannot find #selectedDatesDisplay element");
    return;
  }
  
  if (selectedDates.length === 0) {
    display.innerHTML = '<em>No dates selected</em>';
  } else {
    display.innerHTML = selectedDates
      .sort()
      .map(dateString => {
        // Format YYYY-MM-DD to DD/MM/YYYY without timezone conversion
        const [year, month, day] = dateString.split('-');
        const formatted = day + '/' + month + '/' + year;
        return '<span class="selected-date-item">' + formatted + '</span>';
      })
      .join('');
  }
}

// Interval management functions
function renderIntervals() {
  const container = document.getElementById('intervalsList');
  
  if (showIntervals.length === 0) {
    container.innerHTML = '<p><em>No intervals added yet.</em></p>';
    return;
  }
  
  container.innerHTML = showIntervals.map((interval, index) => {
    const startHours = Math.floor(interval.start_minutes / 60);
    const startMins = interval.start_minutes % 60;
    const startTime = startHours > 0 ? `${startHours}h ${startMins}m` : `${startMins}m`;
    const endMinutes = interval.start_minutes + interval.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMinsDisplay = endMinutes % 60;
    const endTime = endHours > 0 ? `${endHours}h ${endMinsDisplay}m` : `${endMinsDisplay}m`;
    
    return `
      <div class="interval-item">
        <span>Interval: ${startTime} - ${endTime} (${interval.duration_minutes} min)</span>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeInterval(${index})">Remove</button>
      </div>
    `;
  }).join('');
}

globalThis.addInterval = function() {
  const startMinutes = document.getElementById('newIntervalStart').value;
  const duration = document.getElementById('newIntervalDuration').value;
  
  if (!startMinutes || !duration) {
    showError('Both start time and duration are required');
    return;
  }
  
  if (parseInt(startMinutes) < 0 || parseInt(duration) < 1) {
    showError('Please enter valid positive numbers');
    return;
  }
  
  // Check for overlapping intervals
  const newStart = parseInt(startMinutes);
  const newEnd = newStart + parseInt(duration);
  
  for (const existing of showIntervals) {
    const existingStart = existing.start_minutes;
    const existingEnd = existingStart + existing.duration_minutes;
    
    if ((newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)) {
      showError('This interval overlaps with an existing interval');
      return;
    }
  }
  
  showIntervals.push({
    start_minutes: parseInt(startMinutes),
    duration_minutes: parseInt(duration)
  });
  
  // Clear form
  document.getElementById('newIntervalStart').value = '';
  document.getElementById('newIntervalDuration').value = '';
  
  renderIntervals();
  showSuccess('Interval added successfully');
};

globalThis.removeInterval = function(index) {
  showIntervals.splice(index, 1);
  renderIntervals();
  showSuccess('Interval removed successfully');
};

async function addIntervalsToShow(showId) {
  for (const interval of showIntervals) {
    try {
      await fetch(`/admin/api/shows/${showId}/intervals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interval),
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error adding interval:', error);
    }
  }
}

function clearForm() {
  document.getElementById('name').value = '';
  // Reset custom time selects to default values
  document.getElementById('startTime-hour').value = '12';
  document.getElementById('startTime-minute').value = '00';
  document.getElementById('startTime-ampm').value = 'PM';
  document.getElementById('endTime-hour').value = '01';
  document.getElementById('endTime-minute').value = '00';
  document.getElementById('endTime-ampm').value = 'PM';
  // Update hidden inputs
  document.getElementById('startTime').value = '12:00';
  document.getElementById('endTime').value = '13:00';
  document.getElementById('existingShow').value = '';
  selectedDates = [];
  showIntervals = []; // Clear intervals
  
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
  renderIntervals();
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

function initializeEventListeners() {
  // Calendar navigation
  document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });
  
  document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
  
  // Form buttons
  document.getElementById('clearForm').addEventListener('click', clearForm);
  
  // Form submission
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
    
    // For each selected date, combine with the start and end times
    const performances = selectedDates.map(date => {
      return {
        start_time: date + "T" + startTime + ":00",
        end_time: date + "T" + endTime + ":00"
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
        
        let message = "Successfully added " + successful.length + " date(s) to '" + showName + "'.";
        if (failed.length > 0) {
          message += " " + failed.length + " date(s) were skipped (duplicates).";
        }
        
        // Store the created/updated show ID
        lastCreatedShowId = result.showId;
        
        // Add intervals if any were defined
        if (showIntervals.length > 0) {
          await addIntervalsToShow(lastCreatedShowId);
          message += " " + showIntervals.length + " interval(s) added.";
        }
        
        showSuccess(message);
        
        // Switch to "Add to Existing Show" and select the show we just worked with
        document.querySelector('input[name="showType"][value="existing"]').checked = true;
        document.getElementById('newShowName').classList.add('hidden');
        document.getElementById('existingShowSelect').classList.remove('hidden');
        document.getElementById('name').required = false;
        document.getElementById('existingShow').required = true;
        document.getElementById('existingShow').value = lastCreatedShowId;
        
        // Clear only the dates and times, keep the show selected
        document.getElementById('startTime-hour').value = '12';
        document.getElementById('startTime-minute').value = '00';
        document.getElementById('startTime-ampm').value = 'PM';
        document.getElementById('endTime-hour').value = '01';
        document.getElementById('endTime-minute').value = '00';
        document.getElementById('endTime-ampm').value = 'PM';
        document.getElementById('startTime').value = '12:00';
        document.getElementById('endTime').value = '13:00';
        selectedDates = [];
        // Don't clear intervals in case user wants to add more performances with same intervals
        renderCalendar();
        updateSelectedDatesDisplay();
      } else {
        showError('Failed to create show. Please try again.');
      }
    } catch (_error) {
      showError('Error creating show. Please try again.');
    }
  });
}

// Initialize the page
function initializePage() {
  try {
    console.log("Initializing new show page...");
    renderCalendar();
    console.log("Calendar rendered successfully");
    updateSelectedDatesDisplay();
    renderIntervals();
    console.log("Setting up time inputs...");
    setupTimeInputs();
    console.log("Time inputs set up successfully");
    initializeShowTypeHandlers();
    initializeEventListeners();
    console.log("Page initialization complete");
  } catch (error) {
    console.error("Error initializing page:", error);
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}
