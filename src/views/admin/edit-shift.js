// Get shift ID from script tag data attribute
const shiftId = document.currentScript.getAttribute('data-shift-id');

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('shiftForm');
  
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
});
