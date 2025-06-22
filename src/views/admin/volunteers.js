document.addEventListener('DOMContentLoaded', function() {
  let currentVolunteerId = null;
  
  // Make functions globally available for inline onclick handlers
  globalThis.manageShifts = manageShifts;
  globalThis.deleteVolunteer = deleteVolunteer;
  globalThis.closeModal = closeModal;
  globalThis.assignShift = assignShift;
  globalThis.unassignShift = unassignShift;
  
  async function manageShifts(volunteerId, volunteerName) {
    currentVolunteerId = volunteerId;
    document.getElementById('modalTitle').textContent = `Manage Shifts for ${volunteerName}`;
    
    // Load assigned shifts
    try {
      const assignedResponse = await fetch(`/admin/api/volunteers/${volunteerId}/shifts`, {
        credentials: 'include'
      });
      const assignedShifts = await assignedResponse.json();
      
      const assignedContainer = document.getElementById('assignedShiftsList');
      if (assignedShifts.length === 0) {
        assignedContainer.innerHTML = '<div class="no-shifts">No shifts assigned</div>';
      } else {
        assignedContainer.innerHTML = assignedShifts.map(shift => `
          <div class="shift-item">
            <div class="shift-info">
              <div class="shift-title">${shift.show_name} - ${shift.role}</div>
              <div class="shift-details">${shift.date} at ${shift.time}</div>
            </div>
            <button class="btn btn-sm btn-danger" onclick="unassignShift(${shift.id})">Remove</button>
          </div>
        `).join('');
      }
      
      // Load available shifts
      const availableResponse = await fetch('/admin/api/shifts/available', {
        credentials: 'include'
      });
      const availableShifts = await availableResponse.json();
      
      const availableContainer = document.getElementById('availableShiftsList');
      if (availableShifts.length === 0) {
        availableContainer.innerHTML = '<div class="no-shifts">No available shifts</div>';
      } else {
        availableContainer.innerHTML = availableShifts.map(shift => `
          <div class="shift-item">
            <div class="shift-info">
              <div class="shift-title">${shift.show_name} - ${shift.role}</div>
              <div class="shift-details">${shift.date} at ${shift.time}</div>
            </div>
            <button class="btn btn-sm btn-success" onclick="assignShift(${shift.id})">Assign</button>
          </div>
        `).join('');
      }
      
      document.getElementById('shiftModal').style.display = 'block';
    } catch (_error) {
      console.error('Error loading shifts:', _error);
      if (typeof Modal !== 'undefined') {
        Modal.error('Error', 'Failed to load shifts');
      } else {
        alert('Failed to load shifts');
      }
    }
  }
  
  async function assignShift(shiftId) {
    try {
      const response = await fetch(`/admin/api/shifts/${shiftId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: currentVolunteerId }),
        credentials: 'include'
      });
      
      if (response.ok) {
        // Refresh the modal content
        const modalTitle = document.getElementById('modalTitle').textContent;
        const volunteerName = modalTitle.replace('Manage Shifts for ', '');
        await manageShifts(currentVolunteerId, volunteerName);
      } else {
        if (typeof Modal !== 'undefined') {
          Modal.error('Error', 'Failed to assign shift');
        } else {
          alert('Failed to assign shift');
        }
      }
    } catch (_error) {
      console.error('Error assigning shift:', _error);
      if (typeof Modal !== 'undefined') {
        Modal.error('Error', 'Error assigning shift');
      } else {
        alert('Error assigning shift');
      }
    }
  }
  
  async function unassignShift(shiftId) {
    try {
      const response = await fetch(`/admin/api/shifts/${shiftId}/unassign`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Refresh the modal content
        const modalTitle = document.getElementById('modalTitle').textContent;
        const volunteerName = modalTitle.replace('Manage Shifts for ', '');
        await manageShifts(currentVolunteerId, volunteerName);
      } else {
        if (typeof Modal !== 'undefined') {
          Modal.error('Error', 'Failed to unassign shift');
        } else {
          alert('Failed to unassign shift');
        }
      }
    } catch (_error) {
      console.error('Error unassigning shift:', _error);
      if (typeof Modal !== 'undefined') {
        Modal.error('Error', 'Error unassigning shift');
      } else {
        alert('Error unassigning shift');
      }
    }
  }
  
  async function deleteVolunteer(id, name) {
    if (!confirm(`Are you sure you want to delete ${name}? This will also unassign them from all shifts.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/admin/api/volunteers/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        globalThis.location.reload();
      } else {
        if (typeof Modal !== 'undefined') {
          Modal.error('Error', 'Failed to delete participant');
        } else {
          alert('Failed to delete participant');
        }
      }
    } catch (_error) {
      console.error('Error:', _error);
      if (typeof Modal !== 'undefined') {
        Modal.error('Error', 'Error deleting participant');
      } else {
        alert('Error deleting participant');
      }
    }
  }
  
  function closeModal() {
    document.getElementById('shiftModal').style.display = 'none';
  }
  
  // Close modal when clicking outside of it
  globalThis.onclick = function(event) {
    const modal = document.getElementById('shiftModal');
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
});
