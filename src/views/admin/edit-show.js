// Get show ID from script tag data attribute
const showId = document.currentScript.getAttribute('data-show-id');

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('showForm');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const data = { name: formData.get('name') };
      
      try {
        const response = await fetch(`/admin/api/shows/${showId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          credentials: 'include'
        });
        
        if (response.ok) {
          showSuccess('Show name updated successfully');
        } else {
          showError('Failed to update show name');
        }
      } catch (_error) {
        showError('Error updating show name');
      }
    });
  }
  
  // Load intervals when page loads
  loadIntervals();
});

function showError(message) {
  const element = document.getElementById('errorMessage');
  element.textContent = message;
  element.style.display = 'block';
  setTimeout(() => element.style.display = 'none', 5000);
}

function showSuccess(message) {
  const element = document.getElementById('successMessage');
  element.textContent = message;
  element.style.display = 'block';
  setTimeout(() => element.style.display = 'none', 3000);
}

async function updateShowDate(dateId) {
  const startDateTime = document.getElementById(`start_${dateId}`).value;
  const endDateTime = document.getElementById(`end_${dateId}`).value;
  
  if (!startDateTime || !endDateTime) {
    showError('Both start and end date/times are required');
    return;
  }
  
  try {
    const response = await fetch(`/admin/api/show-dates/${dateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_time: startDateTime, end_time: endDateTime }),
      credentials: 'include'
    });
    
    if (response.ok) {
      showSuccess('Performance updated successfully');
    } else {
      showError('Failed to update performance');
    }
  } catch (_error) {
    showError('Error updating show date');
  }
}

async function deleteShowDate(dateId) {
  if (!confirm('Are you sure you want to delete this show date?')) {
    return;
  }
  
  try {
    const response = await fetch(`/admin/api/show-dates/${dateId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      document.querySelector(`[data-date-id="${dateId}"]`).remove();
      showSuccess('Show date deleted successfully');
    } else {
      showError('Failed to delete show date');
    }
  } catch (_error) {
    showError('Error deleting show date');
  }
}

async function addNewDate() {
  const startDateTime = document.getElementById('newStartDateTime').value;
  const endDateTime = document.getElementById('newEndDateTime').value;
  
  if (!startDateTime || !endDateTime) {
    showError('Both start and end date/times are required');
    return;
  }
  
  try {
    const response = await fetch('/admin/api/show-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        show_id: showId, 
        start_time: startDateTime, 
        end_time: endDateTime 
      }),
      credentials: 'include'
    });
    
    if (response.ok) {
      showSuccess('New performance added successfully');
      // Clear form
      document.getElementById('newStartDateTime').value = '';
      document.getElementById('newEndDateTime').value = '';
      // Reload page to show new performance
      setTimeout(() => globalThis.location.reload(), 1000);
    } else {
      showError('Failed to add new performance');
    }
  } catch (_error) {
    showError('Error adding new performance');
  }
}

// Make functions globally available for inline onclick handlers
globalThis.updateShowDate = updateShowDate;
globalThis.deleteShowDate = deleteShowDate;
globalThis.addNewDate = addNewDate;
globalThis.addNewInterval = addNewInterval;
globalThis.updateInterval = updateInterval;
globalThis.deleteInterval = deleteInterval;

// Interval management functions
async function loadIntervals() {
  try {
    const response = await fetch(`/admin/api/shows/${showId}/intervals`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const intervals = await response.json();
      renderIntervals(intervals);
    } else {
      console.error('Failed to load intervals');
    }
  } catch (error) {
    console.error('Error loading intervals:', error);
  }
}

function renderIntervals(intervals) {
  const container = document.getElementById('intervalsList');
  
  if (intervals.length === 0) {
    container.innerHTML = '<p><em>No intervals configured for this show.</em></p>';
    return;
  }
  
  container.innerHTML = intervals.map(interval => {
    const startHours = Math.floor(interval.start_minutes / 60);
    const startMins = interval.start_minutes % 60;
    const startTime = startHours > 0 ? `${startHours}h ${startMins}m` : `${startMins}m`;
    const endMinutes = interval.start_minutes + interval.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMinsDisplay = endMinutes % 60;
    const endTime = endHours > 0 ? `${endHours}h ${endMinsDisplay}m` : `${endMinsDisplay}m`;
    
    return `
      <div class="interval-item" data-interval-id="${interval.id}">
        <div class="interval-header">
          <strong>Interval: ${startTime} - ${endTime} (${interval.duration_minutes} minutes)</strong>
          <button type="button" class="btn btn-danger btn-sm" onclick="deleteInterval(${interval.id})">Delete</button>
        </div>
        <div class="time-group">
          <div class="form-group">
            <label>Start (minutes from show start):</label>
            <input type="number" id="intervalStart_${interval.id}" value="${interval.start_minutes}" min="0" max="300" onchange="updateInterval(${interval.id})">
          </div>
          <div class="form-group">
            <label>Duration (minutes):</label>
            <input type="number" id="intervalDuration_${interval.id}" value="${interval.duration_minutes}" min="1" max="60" onchange="updateInterval(${interval.id})">
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function addNewInterval() {
  const startMinutes = document.getElementById('intervalStart').value;
  const duration = document.getElementById('intervalDuration').value;
  
  if (!startMinutes || !duration) {
    showError('Both start time and duration are required');
    return;
  }
  
  if (parseInt(startMinutes) < 0 || parseInt(duration) < 1) {
    showError('Please enter valid positive numbers');
    return;
  }
  
  try {
    const response = await fetch(`/admin/api/shows/${showId}/intervals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        start_minutes: parseInt(startMinutes), 
        duration_minutes: parseInt(duration)
      }),
      credentials: 'include'
    });
    
    if (response.ok) {
      showSuccess('Interval added successfully');
      // Clear form
      document.getElementById('intervalStart').value = '';
      document.getElementById('intervalDuration').value = '';
      // Reload intervals
      loadIntervals();
    } else {
      showError('Failed to add interval');
    }
  } catch (_error) {
    showError('Error adding interval');
  }
}

async function updateInterval(intervalId) {
  const startMinutes = document.getElementById(`intervalStart_${intervalId}`).value;
  const duration = document.getElementById(`intervalDuration_${intervalId}`).value;
  
  if (!startMinutes || !duration) {
    showError('Both start time and duration are required');
    return;
  }
  
  if (parseInt(startMinutes) < 0 || parseInt(duration) < 1) {
    showError('Please enter valid positive numbers');
    return;
  }
  
  try {
    const response = await fetch(`/admin/api/intervals/${intervalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        start_minutes: parseInt(startMinutes), 
        duration_minutes: parseInt(duration)
      }),
      credentials: 'include'
    });
    
    if (response.ok) {
      showSuccess('Interval updated successfully');
      // Reload intervals to refresh display
      loadIntervals();
    } else {
      showError('Failed to update interval');
    }
  } catch (_error) {
    showError('Error updating interval');
  }
}

async function deleteInterval(intervalId) {
  if (!confirm('Are you sure you want to delete this interval?')) {
    return;
  }
  
  try {
    const response = await fetch(`/admin/api/intervals/${intervalId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      showSuccess('Interval deleted successfully');
      loadIntervals();
    } else {
      showError('Failed to delete interval');
    }
  } catch (_error) {
    showError('Error deleting interval');
  }
}
