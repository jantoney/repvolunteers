// Get shift ID from script tag data attribute
const shiftId = document.currentScript.getAttribute('data-shift-id');

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('shiftForm');
  const deleteBtn = document.getElementById('deleteShiftBtn');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const data = {
        show_date_id: formData.get('show_date_id'),
        role: formData.get('role'),
        arrive_time: formData.get('arrive_time'),
        depart_time: formData.get('depart_time')
      };
      
      try {
        const response = await fetch(`/admin/api/shifts/${shiftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          credentials: 'include'
        });
          if (response.ok) {
          globalThis.location.href = '/admin/shifts';
        } else {
          if (typeof Modal !== 'undefined') {
            Modal.error('Error', 'Failed to update shift');
          } else {
            alert('Failed to update shift');
          }
        }
      } catch (_error) {
        if (typeof Modal !== 'undefined') {
          Modal.error('Error', 'Error updating shift');
        } else {
          alert('Error updating shift');
        }
      }
    });
  }

  // Handle delete button
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      if (typeof Modal !== 'undefined') {
        Modal.confirm(
          'Delete Shift', 
          'Are you sure you want to delete this shift? This action cannot be undone.',
          async function() {
            try {
              const response = await fetch(`/admin/api/shifts/${shiftId}`, {
                method: 'DELETE',
                credentials: 'include'
              });
              
              if (response.ok) {
                Modal.success('Success', 'Shift deleted successfully', function() {
                  globalThis.location.href = '/admin/shifts';
                });
              } else {
                Modal.error('Error', 'Failed to delete shift');
              }
            } catch (_error) {
              Modal.error('Error', 'Error deleting shift');
            }
          }
        );
      } else {
        // Fallback to confirm dialog if Modal is not available
        if (confirm('Are you sure you want to delete this shift? This action cannot be undone.')) {
          deleteShift();
        }
      }
    });
  }

  // Fallback delete function for when Modal is not available
  async function deleteShift() {
    try {
      const response = await fetch(`/admin/api/shifts/${shiftId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        alert('Shift deleted successfully');
        globalThis.location.href = '/admin/shifts';
      } else {
        alert('Failed to delete shift');
      }
    } catch (_error) {
      alert('Error deleting shift');
    }
  }
});
