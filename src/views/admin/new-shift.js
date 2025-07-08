document.addEventListener('DOMContentLoaded', function () {
  const defaultRoles = [
    'FOH Manager',
    'FOH 2IC',
    'Usher 1 (Can see show)',
    'Usher 2 (Can see show)',
    'Usher 3 (Can see show)',
    'Tea and Coffee 1 (Can see show)',
    'Tea and Coffee 2 (Can see show)',
    'Raffle Ticket Selling',
    'Box Office'
  ];
  const customRoles = [];
  const allRoles = [...defaultRoles];
  // Load default roles
  function loadDefaultRoles() {
    const container = document.getElementById('defaultRolesList');
    container.innerHTML = defaultRoles.map((role, index) => `
      <div class="checkbox-item">
        <input type="checkbox" id="role_default_${index}" value="${role}">
        <label for="role_default_${index}">${role}</label>
      </div>
    `).join('');
  }

  // Show selector changed
  document.getElementById('show_id').addEventListener('change', async function () {
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
              ${DateTimeFormat.formatDate(date.date)} - 
              ${DateTimeFormat.formatTime(date.start_time)} to ${DateTimeFormat.formatTime(date.end_time)}
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

  // Show time picker on focus for better mobile experience
  document.getElementById('arrive_time').addEventListener('focus', function () {
    if (this.showPicker) {
      this.showPicker();
    }
  });

  document.getElementById('depart_time').addEventListener('focus', function () {
    if (this.showPicker) {
      this.showPicker();
    }
  });

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
  document.getElementById('addCustomRole').addEventListener('click', function () {
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
      <input type="checkbox" id="role_custom_${customRoles.length}" value="${roleName}" checked>
      <label for="role_custom_${customRoles.length}">${roleName}</label>
    `;
    container.appendChild(newRole);

    input.value = '';
    document.getElementById('customRoleWarning').style.display = 'none';
  });

  // Show warning when custom role is typed but not added
  document.getElementById('customRole').addEventListener('input', function () {
    const warning = document.getElementById('customRoleWarning');
    if (this.value.trim()) {
      warning.style.display = 'block';
    } else {
      warning.style.display = 'none';
    }
  });

  // Allow Enter key to add custom role
  document.getElementById('customRole').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('addCustomRole').click();
    }
  });
  // Form submission
  document.getElementById('shiftForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Check if there's an unsaved custom role
    const customRoleInput = document.getElementById('customRole');
    if (customRoleInput.value.trim()) {
      const confirmAdd = confirm('You have entered a custom role name but haven\'t added it yet. Would you like to add it now?');
      if (confirmAdd) {
        document.getElementById('addCustomRole').click();
        // Don't proceed with form submission yet, let user review
        return;
      } else {
        const confirmProceed = confirm('Are you sure you want to proceed without adding the custom role?');
        if (!confirmProceed) {
          return;
        }
      }
    }

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
    // Get selected roles - use more specific selectors to avoid the '8' issue
    const selectedRoles = Array.from(document.querySelectorAll('#defaultRolesList input:checked, #customRolesList input:checked'))
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
        const totalDates = selectedDates.length;
        const totalRoles = selectedRoles.length;

        showSuccess(`Successfully created ${successCount} shifts across ${totalDates} performance date${totalDates > 1 ? 's' : ''} and ${totalRoles} role${totalRoles > 1 ? 's' : ''}`);

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
