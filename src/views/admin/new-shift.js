document.addEventListener('DOMContentLoaded', function() {
  const defaultRoles = [
    'FOH Manager', 'Bar Manager', 'Bartender', 'Usher', 'Box Office',
    'Merchandise', 'Cleaning', 'Sound Operator', 'Lighting Operator'
  ];
    const customRoles = [];
  const allRoles = [...defaultRoles];
  
  // Load default roles
  function loadDefaultRoles() {
    const container = document.getElementById('defaultRolesList');
    container.innerHTML = defaultRoles.map(role => `
      <div class="checkbox-item">
        <input type="checkbox" id="role_${role}" value="${role}">
        <label for="role_${role}">${role}</label>
      </div>
    `).join('');
  }
  
  // Show selector changed
  document.getElementById('show_id').addEventListener('change', async function() {
    const showId = this.value;
    const section = document.getElementById('showDatesSection');
    const container = document.getElementById('showDatesList');
    
    if (!showId) {
      section.style.display = 'none';
      return;
    }
    
    try {
      const response = await fetch(`/admin/api/shows/${showId}/dates`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const dates = await response.json();
        container.innerHTML = dates.map(date => `
          <div class="checkbox-item">
            <input type="checkbox" id="date_${date.id}" value="${date.id}" checked>
            <label for="date_${date.id}">
              ${typeof AdelaideTime !== 'undefined' ? AdelaideTime.formatDateAdelaide(date.date) : new Date(date.date).toLocaleDateString()} - 
              ${date.start_time} to ${date.end_time}
            </label>
          </div>
        `).join('');
        section.style.display = 'block';
      }
    } catch (_error) {
      console.error('Error loading show dates:', _error);
    }
  });
  
  // Time change handlers
  document.getElementById('arrive_time').addEventListener('change', checkNextDay);
  document.getElementById('depart_time').addEventListener('change', checkNextDay);
  
  function checkNextDay() {
    const arriveTime = document.getElementById('arrive_time').value;
    const departTime = document.getElementById('depart_time').value;
    const warning = document.getElementById('nextDayWarning');
    
    if (arriveTime && departTime && departTime < arriveTime) {
      warning.style.display = 'block';
    } else {
      warning.style.display = 'none';
    }
  }
  
  // Add custom role
  document.getElementById('addCustomRole').addEventListener('click', function() {
    const input = document.getElementById('customRole');
    const roleName = input.value.trim();
    
    if (!roleName) return;
    
    if (allRoles.includes(roleName)) {
      if (typeof Modal !== 'undefined') {
        Modal.error('Error', 'Role already exists');
      } else {
        alert('Role already exists');
      }
      return;
    }
    
    customRoles.push(roleName);
    allRoles.push(roleName);
    
    const container = document.getElementById('customRolesList');
    const newRole = document.createElement('div');
    newRole.className = 'checkbox-item';
    newRole.innerHTML = `
      <input type="checkbox" id="role_${roleName}" value="${roleName}" checked>
      <label for="role_${roleName}">${roleName}</label>
    `;
    container.appendChild(newRole);
    
    input.value = '';
  });
  
  // Allow Enter key to add custom role
  document.getElementById('customRole').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('addCustomRole').click();
    }
  });
  
  // Form submission
  document.getElementById('shiftForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const showId = formData.get('show_id');
    const arriveTime = formData.get('arrive_time');
    const departTime = formData.get('depart_time');
    
    // Get selected show dates
    const selectedDates = Array.from(document.querySelectorAll('#showDatesList input:checked'))
      .map(input => input.value);
    
    if (selectedDates.length === 0) {
      showError('Please select at least one show date');
      return;
    }
    
    // Get selected roles
    const selectedRoles = Array.from(document.querySelectorAll('.checkbox-group input:checked'))
      .map(input => input.value);
    
    if (selectedRoles.length === 0) {
      showError('Please select at least one role');
      return;
    }
    
    const data = {
      showId: parseInt(showId),
      showDateIds: selectedDates.map(id => parseInt(id)),
      arriveTime,
      departTime,
      roles: selectedRoles
    };
    
    try {
      const response = await fetch('/admin/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        const successCount = result.results.filter(r => r.success).length;
        showSuccess(`Successfully created ${successCount} shifts`);
        
        // Show next day warning if applicable
        const nextDayShifts = result.results.filter(r => r.nextDay && r.success);
        if (nextDayShifts.length > 0) {
          showSuccess(`Note: ${nextDayShifts.length} shifts were saved with depart time on the following day`);
        }
        
        // Reset form after short delay
        setTimeout(() => {
          globalThis.location.href = '/admin/shifts';
        }, 2000);
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to create shifts');
      }
    } catch (_error) {
      console.error('Error creating shifts:', _error);
      showError('Error creating shifts');
    }
  });
  
  function showSuccess(message) {
    const el = document.getElementById('successMessage');
    el.textContent = message;
    el.style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
  }
  
  function showError(message) {
    const el = document.getElementById('errorMessage');
    el.textContent = message;
    el.style.display = 'block';
    document.getElementById('successMessage').style.display = 'none';
  }
  
  // Initialize
  loadDefaultRoles();
});
