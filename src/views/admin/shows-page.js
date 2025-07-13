// Script for admin shows page
// Global variable for tracking expanded shows
var expandedShows = new Set();
// Display and update current Adelaide time
function updateAdelaideTime() {
  const timeElement = document.getElementById('currentAdelaideTime');
  if (timeElement) {
    const adelaideTZ = window.DateTimeFormat?.ADELAIDE_TIMEZONE;
    const now = new Date();
    const adelaideTime = window.DateTimeFormat?.formatDateTime?.(now);
    // Optionally display adelaideTime
  }
}
updateAdelaideTime();
setInterval(updateAdelaideTime, 60000);
// Global function for toggling show dates
window.toggleDates = async function(showId) {
  const row = document.getElementById(`dates-${showId}`);
  const content = document.getElementById(`dates-content-${showId}`);
  if (expandedShows.has(showId)) {
    row.classList.remove('expanded');
    expandedShows.delete(showId);
  } else {
    row.classList.add('expanded');
    expandedShows.add(showId);
    if (content.textContent === 'Loading dates...') {
      try {
        const response = await fetch(`/admin/api/shows/${showId}/dates`, {
          credentials: 'include'
        });
        if (response.ok) {
          const dates = await response.json();
          if (dates.length === 0) {
            content.innerHTML = '<em>No performance dates set</em>';
          } else {
            let tableRows = '';
            if (Array.isArray(dates)) {
              tableRows = dates.map(date => {
                const fillPercentage = date.total_shifts > 0 ? (date.filled_shifts / date.total_shifts) * 100 : 0;
                let trafficColor = 'grey';
                if (date.total_shifts > 0) {
                  if (fillPercentage >= 80) trafficColor = 'green';
                  else if (fillPercentage >= 50) trafficColor = 'yellow';
                  else trafficColor = 'red';
                }
                const dateForInput = (new Date(date.start_time)).toISOString().split('T')[0];
                const start = new Date(date.start_time);
                const end = new Date(date.end_time);
                const showTimeRange = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
                return `<tr>
                  <td style="padding: 0.5rem; border: none;">${start.toLocaleDateString('en-AU', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td style="padding: 0.5rem; border: none;">${showTimeRange}</td>
                  <td style="padding: 0.5rem; border: none;">
                    <span class="traffic-light ${trafficColor}" style="width: 16px; height: 16px; margin-right: 6px;" 
                          title="${date.total_shifts > 0 ? date.filled_shifts + '/' + date.total_shifts + ' filled' : 'No shifts'}"></span>
                    ${date.total_shifts > 0 ? date.filled_shifts + '/' + date.total_shifts : 'No shifts'}
                  </td>
                  <td style="padding: 0.5rem; border: none;">
                    ${date.total_shifts > 0
                      ? `<a href="/admin/shifts?shows=${showId}&date=${dateForInput}" class="performance-link">View Shifts</a>
                         <button class="btn btn-sm btn-info" style="margin-left:8px;" onclick="window.open('/admin/api/show-dates/${date.id}/run-sheet', '_blank')">Run Sheet PDF</button>`
                      : '<span style="color: #6c757d;">No shifts</span>'
                    }
                  </td>
                </tr>`;
              }).join('');
            }
            content.innerHTML = `<table style="width: 100%; margin: 0;">
              <thead>
                <tr style="background: none;">
                  <th style="padding: 0.5rem; border: none;">Date</th>
                  <th style="padding: 0.5rem; border: none;">Show Time</th>
                  <th style="padding: 0.5rem; border: none;">Shifts</th>
                  <th style="padding: 0.5rem; border: none;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>`;
          }
        } else {
          content.innerHTML = '<em>Error loading dates</em>';
        }
      } catch (error) {
        console.error('Error:', error);
        content.innerHTML = '<em>Error loading dates</em>';
      }
    }
  }
}
// Global function for deleting shows
window.deleteShow = async function(id, name) {
  if (!confirm(`Are you sure you want to delete the show "${name}"? This will also delete all associated performance dates and shifts.`)) {
    return;
  }
  try {
    const response = await fetch(`/admin/api/shows/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (response.ok) {
      location.reload();
    } else {
      Modal.error('Error', 'Failed to delete show');
    }
  } catch (error) {
    console.error('Error:', error);
    Modal.error('Error', 'Error deleting show');
  }
}
