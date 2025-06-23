document.addEventListener('DOMContentLoaded', function() {
  // Initialize the page
  console.log('Shifts page loaded');
});

function updateShowFilter() {
  // This function is called when checkboxes change
  // No immediate action needed, form will be submitted manually
}

function selectAllShows() {
  const checkboxes = document.querySelectorAll('input[name="shows"]');
  checkboxes.forEach(checkbox => checkbox.checked = true);
}

function selectNoShows() {
  const checkboxes = document.querySelectorAll('input[name="shows"]');
  checkboxes.forEach(checkbox => checkbox.checked = false);
}

// Handle form submission to collect checked show IDs
document.getElementById('shiftsFilterForm').addEventListener('submit', function(e) {
  const checkedShows = Array.from(document.querySelectorAll('input[name="shows"]:checked'))
    .map(checkbox => checkbox.value);
  
  // Create a hidden input with comma-separated show IDs
  const existingInput = document.querySelector('input[name="shows"][type="hidden"]');
  if (existingInput) {
    existingInput.remove();
  }
  
  if (checkedShows.length > 0) {
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'shows';
    hiddenInput.value = checkedShows.join(',');
    this.appendChild(hiddenInput);
  }
});

async function deleteShift(id, role) {
  if (!confirm(`Are you sure you want to delete the shift "${role}"? This will also unassign any participants.`)) {
    return;
  }
  
  try {
    const response = await fetch(`/admin/api/shifts/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      location.reload();
    } else {
      Modal.error('Error', 'Failed to delete shift');
    }
  } catch (error) {
    console.error('Error:', error);
    Modal.error('Error', 'Error deleting shift');
  }
}

async function viewShiftDetails(shiftId) {
  try {
    const response = await fetch(`/admin/api/shifts/${shiftId}/volunteers`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const participants = await response.json();
      
      let content = '';
      if (participants.length === 0) {
        content = '<p>No participants assigned to this shift.</p>';
      } else {
        const participantList = participants.map(p => 
          `<li>
            ${p.name}${p.email ? ` (${p.email})` : ''}
            <button class="btn btn-sm btn-danger" style="margin-left: 10px;" onclick="unassignParticipant(${shiftId}, ${p.id}, '${p.name}')">Remove</button>
          </li>`
        ).join('');
        
        content = `
          <p><strong>Assigned Participants:</strong></p>
          <ul style="list-style: none; padding: 0;">${participantList}</ul>
        `;
      }
      
      content += `
        <hr style="margin: 1rem 0;">
        <button class="btn btn-primary" onclick="showAssignParticipant(${shiftId})">Assign Participant</button>
      `;
      
      Modal.info('Shift Details', content);
    } else {
      Modal.error('Error', 'Failed to load shift details');
    }
  } catch (error) {
    console.error('Error:', error);
    Modal.error('Error', 'Error loading shift details');
  }
}

async function showAssignParticipant(shiftId) {
  try {
    const response = await fetch(`/admin/api/shifts/${shiftId}/available-volunteers`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const volunteers = await response.json();
      console.log('Available volunteers:', volunteers); // Debug log
      
      if (volunteers.length === 0) {
        Modal.info('Assign Participant', 'No available participants found. All participants may already be assigned to this shift.');
        return;
      }
      
      // Store volunteers data for filtering
      window.currentVolunteers = volunteers;
      window.currentShiftId = shiftId;
      
      // Build the volunteer list HTML
      let volunteerListHtml = '';
      volunteers.forEach(v => {
        const email = v.email || 'No email';
        const phone = v.phone ? ` | ${v.phone}` : '';
        const safeName = v.name.replace(/'/g, "\\'");
        
        volunteerListHtml += `
          <div class="volunteer-item" data-name="${v.name.toLowerCase()}" data-email="${email.toLowerCase()}" data-phone="${(v.phone || '').toLowerCase()}">
            <div class="volunteer-info">
              <div class="volunteer-name">${v.name}</div>
              <div class="volunteer-details">${email}${phone}</div>
            </div>
            <button class="btn btn-sm btn-primary" onclick="assignParticipant(${shiftId}, ${v.id}, '${safeName}')">Assign</button>
          </div>
        `;
      });
      
      const modalContent = `
        <input type="text" id="volunteerSearch" class="volunteer-search" placeholder="Search volunteers by name, email, or phone..." onkeyup="filterVolunteers()">
        <div class="volunteer-list-container" id="volunteerList">
          ${volunteerListHtml}
        </div>
        <div class="no-results" id="noResults" style="display: none;">
          No volunteers match your search criteria.
        </div>
      `;
      
      console.log('Modal content:', modalContent); // Debug log
      Modal.html('Assign Participant to Shift', modalContent, null, 'large');
      
      // Focus the search input after modal opens
      setTimeout(() => {
        const searchInput = document.getElementById('volunteerSearch');
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    } else {
      Modal.error('Error', 'Failed to load available participants');
    }
  } catch (error) {
    console.error('Error:', error);
    Modal.error('Error', 'Error loading available participants');
  }
}

function filterVolunteers() {
  const searchInput = document.getElementById('volunteerSearch');
  const volunteerList = document.getElementById('volunteerList');
  const noResults = document.getElementById('noResults');
  
  if (!searchInput || !volunteerList || !noResults) {
    return;
  }
  
  const searchTerm = searchInput.value.toLowerCase().trim();
  const volunteerItems = volunteerList.querySelectorAll('.volunteer-item');
  let visibleCount = 0;
  
  volunteerItems.forEach(item => {
    const name = item.dataset.name || '';
    const email = item.dataset.email || '';
    const phone = item.dataset.phone || '';
    
    const matches = name.includes(searchTerm) || 
                   email.includes(searchTerm) || 
                   phone.includes(searchTerm);
    
    if (matches) {
      item.classList.remove('hidden');
      visibleCount++;
    } else {
      item.classList.add('hidden');
    }
  });
  
  // Show/hide no results message
  if (visibleCount === 0 && searchTerm !== '') {
    noResults.style.display = 'block';
  } else {
    noResults.style.display = 'none';
  }
}

async function assignParticipant(shiftId, volunteerId, volunteerName) {
  try {
    const response = await fetch('/admin/api/volunteer-shifts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        volunteerId: volunteerId,
        shiftId: shiftId
      })
    });
    
    if (response.ok) {
      Modal.success('Success', `Successfully assigned ${volunteerName} to the shift.`);
      // Refresh the page to show updated counts
      setTimeout(() => location.reload(), 1500);
    } else {
      const error = await response.json();
      Modal.error('Error', 'Failed to assign participant: ' + (error.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error:', error);
    Modal.error('Error', 'Error assigning participant');
  }
}

async function unassignParticipant(shiftId, volunteerId, volunteerName) {
  if (!confirm(`Are you sure you want to remove ${volunteerName} from this shift?`)) {
    return;
  }
  
  try {
    const response = await fetch(`/admin/api/volunteers/${volunteerId}/shifts/${shiftId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      Modal.success('Success', `Successfully removed ${volunteerName} from the shift.`);
      // Refresh the page to show updated counts
      setTimeout(() => location.reload(), 1500);
    } else {
      Modal.error('Error', 'Failed to remove participant from shift');
    }
  } catch (error) {
    console.error('Error:', error);
    Modal.error('Error', 'Error removing participant from shift');
  }
}
