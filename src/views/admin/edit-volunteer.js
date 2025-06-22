// Get volunteer ID from script tag data attribute
const volunteerId = document.currentScript.getAttribute('data-volunteer-id');

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('volunteerForm');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const data = {
        name: formData.get('name'),
        email: formData.get('email') || null,
        phone: formData.get('phone') || null
      };
      
      try {
        const response = await fetch(`/admin/api/volunteers/${volunteerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          credentials: 'include'
        });
        
        if (response.ok) {
          globalThis.location.href = '/admin/volunteers';
        } else {
          if (typeof Modal !== 'undefined') {
            Modal.error('Error', 'Failed to update volunteer');
          } else {
            alert('Failed to update volunteer');
          }
        }
      } catch (_error) {
        if (typeof Modal !== 'undefined') {
          Modal.error('Error', 'Error updating volunteer');
        } else {
          alert('Error updating volunteer');
        }
      }
    });
  }
});
