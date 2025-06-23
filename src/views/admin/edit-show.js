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
