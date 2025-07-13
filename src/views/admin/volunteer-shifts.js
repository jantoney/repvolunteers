// Volunteer Shifts JavaScript functionality
// This file handles the removeShift and swapShift functions for the volunteer shifts page

// Global variables
let volunteerId, volunteerName;

// Extract volunteer ID from URL path
function getVolunteerIdFromUrl() {
  const path = globalThis.location.pathname;
  const match = path.match(/\/admin\/volunteers\/([^\/]+)\/shifts/);
  return match ? match[1] : null;
}

// Initialize the page functionality
function _initVolunteerShifts(volId, volName, _shifts) {
  volunteerId = volId || getVolunteerIdFromUrl(); // Fallback to URL if volId is undefined
  volunteerName = volName;
}

// Remove shift function - globally accessible
globalThis.removeShift = function(buttonElement) {
  try {
    const shiftId = buttonElement.getAttribute('data-shift-id');
    const role = buttonElement.getAttribute('data-role');
    const showName = buttonElement.getAttribute('data-show-name');
    
    // Ensure we have a volunteer ID - get from URL if not set
    const currentVolunteerId = volunteerId || getVolunteerIdFromUrl();
    
    if (!currentVolunteerId) {
      alert('Volunteer ID not found. Please refresh the page.');
      return;
    }
    
    if (typeof Modal === 'undefined') {
      alert('Modal library not loaded. Please refresh the page.');
      return;
    }
    
    Modal.confirm(
      'Remove Shift Assignment',
      'Are you sure you want to remove <strong>' + (volunteerName || 'this volunteer') + '</strong> from the <strong>' + role + '</strong> shift for <strong>' + showName + '</strong>?',
      async () => {
        // User confirmed - proceed with removal
        try {
          const apiUrl = '/admin/api/volunteers/' + currentVolunteerId + '/shifts/' + shiftId;
          
          const response = await fetch(apiUrl, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          if (response.ok) {
            Modal.success('Success', 'Shift assignment removed successfully');
            setTimeout(() => globalThis.location.reload(), 1500);
          } else {
            const error = await response.text();
            Modal.error('Error', 'Failed to remove shift assignment: ' + error);
          }
        } catch (error) {
          console.error('Error removing shift:', error);
          alert('Failed to remove shift assignment');
        }
      },
      () => {
        // User cancelled - do nothing
      }
    );
  } catch (error) {
    console.error('Error removing shift:', error);
    alert('Failed to remove shift assignment');
  }
}

// Swap shift function - globally accessible
globalThis.swapShift = async function(buttonElement) {
  try {
    const shiftId = buttonElement.getAttribute('data-shift-id');
    const role = buttonElement.getAttribute('data-role');
    const showName = buttonElement.getAttribute('data-show-name');
    
    if (typeof Modal === 'undefined') {
      alert('Modal library not loaded. Please refresh the page.');
      return;
    }
    
    // First, get list of other roles available for the same performance
    const response = await fetch('/admin/api/shifts/' + shiftId + '/available-roles', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      Modal.error('Error', 'Failed to load available roles for swap');
      return;
    }
    
    const availableRoles = await response.json();
    
    if (availableRoles.length === 0) {
      Modal.alert('No Available Roles', 'There are no other available roles for this performance that you can swap to.');
      return;
    }
    
    // Create role selection modal content
    const roleOptions = availableRoles.map(roleShift => 
      '<option value="' + roleShift.id + '">' + roleShift.role + '</option>'
    ).join('');
    
    const modalContent = 
      '<p>Select a role to swap to for <strong>' + showName + '</strong>:</p>' +
      '<p>Current role: <strong>' + role + '</strong></p>' +
      '<select id="swapRoleSelect" class="form-control" style="width: 100%; margin: 1rem 0;">' +
        '<option value="">Select a role...</option>' +
        roleOptions +
      '</select>';
    
    Modal.confirm(
      'Swap to Different Role',
      modalContent,
      () => {
        const newShiftId = document.getElementById('swapRoleSelect').value;
        if (!newShiftId) {
          Modal.error('Error', 'Please select a role to swap to');
          return;
        }
        
        globalThis.performRoleSwap(shiftId, newShiftId, role, showName);
      }
    );
    
  } catch (error) {
    console.error('Error initiating role swap:', error);
    alert('Failed to initiate role swap');
  }
}

// Perform the actual role swap - globally accessible
globalThis.performRoleSwap = async function(currentShiftId, newShiftId, _currentRole, _showName) {
  try {
    // Remove from current role
    let response = await fetch('/admin/api/volunteers/' + (volunteerId || getVolunteerIdFromUrl()) + '/shifts/' + currentShiftId, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      Modal.error('Error', 'Failed to remove current assignment');
      return;
    }
    
    // Assign to new role
    response = await fetch('/admin/api/volunteer-shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        volunteerId: volunteerId || getVolunteerIdFromUrl(), 
        shiftId: newShiftId 
      }),
      credentials: 'include'
    });
    
    if (response.ok) {
      Modal.success('Success', 'Role swapped successfully');
      setTimeout(() => globalThis.location.reload(), 1500);
    } else {
      // Try to reassign original role if new assignment failed
      await fetch('/admin/api/volunteer-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          volunteerId: volunteerId || getVolunteerIdFromUrl(), 
          shiftId: currentShiftId 
        }),
        credentials: 'include'
      });
      
      Modal.error('Error', 'Failed to assign new role. Original assignment restored.');
    }
  } catch (error) {
    console.error('Error performing role swap:', error);
    alert('Failed to complete role swap');
  }
}

// Initialize function that will be called from the template
globalThis.initVolunteerShifts = function(volId, volName, shifts) {
  return _initVolunteerShifts(volId, volName, shifts);
};

// Make sure functions are available immediately
