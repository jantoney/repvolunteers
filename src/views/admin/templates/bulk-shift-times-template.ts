import {
  getAdminNavigation,
  getAdminScripts,
  getAdminStyles,
} from "../components/navigation.ts";

export interface BulkShiftTimesPageData {
  shows: { id: number; name: string }[];
}

export function renderBulkShiftTimesTemplate(
  data: BulkShiftTimesPageData
): string {
  const { shows } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Bulk Update Shift Times - Theatre Shifts</title>
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}
      <style>
        .content-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .filters-grid {
          display: grid;
          gap: 1rem;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .field-group label {
          font-weight: 600;
          color: #333;
        }

        .field-inline {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .field-inline .field-group {
          flex: 1 1 200px;
        }

        .helper-text {
          font-size: 0.9rem;
          color: #666;
        }

        .dates-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 0.75rem;
          margin-top: 0.75rem;
        }

        .date-item {
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f8f9fa;
        }

        .date-item input {
          margin: 0;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 0.75rem;
          border-bottom: 1px solid #e9ecef;
          text-align: left;
          vertical-align: top;
        }

        th {
          background: #f8f9fa;
          font-weight: 600;
        }

        tr.selected-row {
          background: rgba(0, 123, 255, 0.08);
        }

        .roles-list, .dates-summary {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.9rem;
        }

        .roles-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .roles-selector label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.6rem;
          border: 1px solid #ced4da;
          border-radius: 4px;
          background: #f8f9fa;
          cursor: pointer;
        }

        .roles-selector input {
          margin: 0;
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .info-banner {
          background: #e9f5fd;
          border: 1px solid #c5e5fc;
          border-left: 4px solid #007bff;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .info-banner strong {
          color: #0056b3;
        }

        @media (max-width: 768px) {
          .field-inline {
            flex-direction: column;
          }

          .roles-selector {
            flex-direction: column;
          }
        }
      </style>
    </head>
    <body>
      ${getAdminNavigation("shifts-bulk-update")}
      <div class="main-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">Bulk Update Shift Times</h1>
            <p class="page-subtitle">Adjust existing shift times across multiple performances in one action.</p>
          </div>
        </div>

        <div class="info-banner">
          <span><strong>All times use Adelaide (Australia) timezone.</strong> Select a show, choose the performances to include, pick a time block, then enter the new arrival and departure times.</span>
        </div>

        <div class="content-card">
          <div class="filters-grid">
            <div class="field-group">
              <label for="bulkShowSelect">Show</label>
              <select id="bulkShowSelect" class="form-control">
                <option value="">Select a show...</option>
                ${shows
                  .map(
                    (show) => `
                      <option value="${show.id}">${show.name}</option>
                    `
                  )
                  .join("")}
              </select>
              <p class="helper-text">Start by selecting the show you want to update.</p>
            </div>
          </div>
        </div>

        <div class="content-card" id="showDatesSection" style="display: none;">
          <div class="field-group">
            <label>Performances Included</label>
            <p class="helper-text">Choose which performances are part of this update. All are selected by default.</p>
            <div class="form-actions" style="margin-bottom: 0.75rem;">
              <button type="button" class="btn btn-sm btn-secondary" id="selectAllDatesBtn">Select All</button>
              <button type="button" class="btn btn-sm btn-outline" id="clearAllDatesBtn">Clear</button>
            </div>
            <div class="dates-list" id="showDateList"></div>
          </div>
        </div>

        <div class="content-card" id="shiftGroupsSection" style="display: none;">
          <div class="field-group" style="margin-bottom: 1rem;">
            <label>Current Shift Time Blocks</label>
            <p class="helper-text">Pick a row to prefill the update form. Counts show how many shifts share the same arrival and departure times.</p>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="width: 110px;">Action</th>
                  <th>Current Times</th>
                  <th>Total Shifts</th>
                  <th>Roles</th>
                  <th>Performances</th>
                </tr>
              </thead>
              <tbody id="groupsTableBody">
                <tr>
                  <td colspan="5" style="text-align: center; padding: 1.5rem; color: #6c757d;">Select a show to load shift time groups.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="content-card" id="updateFormSection" style="display: none;">
          <form id="bulkUpdateForm">
            <div class="field-group">
              <label>Selected Time Block</label>
              <p id="selectedGroupSummary" class="helper-text">No time block selected yet.</p>
            </div>

            <div class="field-group" id="roleSelectionWrapper" style="display: none;">
              <label>Roles Included</label>
              <p class="helper-text">Uncheck roles to exclude them from this update.</p>
              <div class="roles-selector" id="roleCheckboxContainer"></div>
            </div>

            <div class="field-inline" style="margin: 1.5rem 0;">
              <div class="field-group">
                <label for="newArriveTime">New Arrive Time</label>
                <input type="time" id="newArriveTime" required>
              </div>
              <div class="field-group">
                <label for="newDepartTime">New Depart Time</label>
                <input type="time" id="newDepartTime" required>
              </div>
            </div>

            <input type="hidden" id="targetArriveTime">
            <input type="hidden" id="targetDepartTime">

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" id="applyUpdateBtn">Update Shift Times</button>
              <button type="button" class="btn btn-secondary" id="resetSelectionBtn">Reset Selection</button>
            </div>
          </form>
        </div>
      </div>

      ${getAdminScripts()}
      <script>
        (function () {
          const showSelect = document.getElementById('bulkShowSelect');
          const showDatesSection = document.getElementById('showDatesSection');
          const shiftGroupsSection = document.getElementById('shiftGroupsSection');
          const updateFormSection = document.getElementById('updateFormSection');
          const groupsTableBody = document.getElementById('groupsTableBody');
          const showDateList = document.getElementById('showDateList');
          const selectAllDatesBtn = document.getElementById('selectAllDatesBtn');
          const clearAllDatesBtn = document.getElementById('clearAllDatesBtn');
          const bulkUpdateForm = document.getElementById('bulkUpdateForm');
          const selectedGroupSummary = document.getElementById('selectedGroupSummary');
          const targetArriveTimeInput = document.getElementById('targetArriveTime');
          const targetDepartTimeInput = document.getElementById('targetDepartTime');
          const newArriveTimeInput = document.getElementById('newArriveTime');
          const newDepartTimeInput = document.getElementById('newDepartTime');
          const resetSelectionBtn = document.getElementById('resetSelectionBtn');
          const roleSelectionWrapper = document.getElementById('roleSelectionWrapper');
          const roleCheckboxContainer = document.getElementById('roleCheckboxContainer');

          let selectedShowId = null;
          let selectedDateIds = [];
          let selectedGroupKey = null;
          let lastLoadedGroups = [];

          function formatDate(displayDate) {
            if (!displayDate) {
              return '';
            }
            const isoValue = displayDate.includes('T')
              ? displayDate
              : displayDate + 'T00:00:00';
            const date = new Date(isoValue);
            if (Number.isNaN(date.getTime())) {
              return displayDate;
            }
            return date.toLocaleDateString('en-AU', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
            });
          }

          function formatTimeRange(arrive, depart, isNextDay) {
            return isNextDay
              ? arrive + ' - ' + depart + ' (+1 day)'
              : arrive + ' - ' + depart;
          }

          function clearSelectionState() {
            selectedGroupKey = null;
            selectedGroupSummary.textContent = 'No time block selected yet.';
            targetArriveTimeInput.value = '';
            targetDepartTimeInput.value = '';
            newArriveTimeInput.value = '';
            newDepartTimeInput.value = '';
            roleCheckboxContainer.innerHTML = '';
            roleSelectionWrapper.style.display = 'none';
            updateFormSection.style.display = 'none';
            Array.from(groupsTableBody.querySelectorAll('tr')).forEach((row) => {
              row.classList.remove('selected-row');
            });
          }

          function renderDateCheckboxes(dates) {
            showDateList.innerHTML = '';
            if (!dates.length) {
              showDateList.innerHTML = '<p style="color: #6c757d;">No performances found for this show.</p>';
              return;
            }
            dates.forEach((date) => {
              const wrapper = document.createElement('label');
              wrapper.className = 'date-item';
              const checkbox = document.createElement('input');
              checkbox.type = 'checkbox';
              checkbox.value = String(date.id);
              checkbox.checked = selectedDateIds.includes(date.id);
              checkbox.addEventListener('change', handleDateSelectionChange);
              const text = document.createElement('span');
              text.textContent = formatDate(date.date);
              wrapper.appendChild(checkbox);
              wrapper.appendChild(text);
              showDateList.appendChild(wrapper);
            });
          }

          function renderGroupsTable(groups) {
            groupsTableBody.innerHTML = '';
            if (!groups.length) {
              groupsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 1.5rem; color: #6c757d;">No shift groups match the current filters.</td></tr>';
              return;
            }

            groups.forEach((group) => {
              const rowKey = group.arrive_time + '|' + group.depart_time;
              const row = document.createElement('tr');
              if (rowKey === selectedGroupKey) {
                row.classList.add('selected-row');
              }

              const actionCell = document.createElement('td');
              const selectButton = document.createElement('button');
              selectButton.type = 'button';
              selectButton.className = 'btn btn-sm btn-outline';
              selectButton.textContent = 'Select';
              selectButton.addEventListener('click', () => {
                setSelectedGroup(group);
                Array.from(groupsTableBody.querySelectorAll('tr')).forEach((r) => r.classList.remove('selected-row'));
                row.classList.add('selected-row');
              });
              actionCell.appendChild(selectButton);

              const timesCell = document.createElement('td');
              timesCell.textContent = formatTimeRange(group.arrive_time, group.depart_time, group.is_next_day);

              const totalCell = document.createElement('td');
              totalCell.textContent = String(group.total_shifts);

              const rolesCell = document.createElement('td');
              const rolesContainer = document.createElement('div');
              rolesContainer.className = 'roles-list';
              group.roles.forEach((role) => {
                const span = document.createElement('span');
                span.textContent = role.name + ' (' + role.count + ')';
                rolesContainer.appendChild(span);
              });
              rolesCell.appendChild(rolesContainer);

              const datesCell = document.createElement('td');
              const datesContainer = document.createElement('div');
              datesContainer.className = 'dates-summary';
              group.show_dates.forEach((date) => {
                const span = document.createElement('span');
                span.textContent = formatDate(date.date) + ' (' + date.shift_count + ')';
                datesContainer.appendChild(span);
              });
              datesCell.appendChild(datesContainer);

              row.appendChild(actionCell);
              row.appendChild(timesCell);
              row.appendChild(totalCell);
              row.appendChild(rolesCell);
              row.appendChild(datesCell);

              groupsTableBody.appendChild(row);
            });
          }

          function setSelectedGroup(group) {
            selectedGroupKey = group.arrive_time + '|' + group.depart_time;
            targetArriveTimeInput.value = group.arrive_time;
            targetDepartTimeInput.value = group.depart_time;
            newArriveTimeInput.value = group.arrive_time;
            newDepartTimeInput.value = group.depart_time;
            selectedGroupSummary.textContent = 'Updating shifts from ' + formatTimeRange(group.arrive_time, group.depart_time, group.is_next_day) + '.';
            renderRoleCheckboxes(group.roles);
            updateFormSection.style.display = 'block';
          }

          function renderRoleCheckboxes(roles) {
            roleCheckboxContainer.innerHTML = '';
            if (!roles.length) {
              roleSelectionWrapper.style.display = 'none';
              return;
            }
            roleSelectionWrapper.style.display = 'block';
            roles.forEach((role) => {
              const label = document.createElement('label');
              const checkbox = document.createElement('input');
              checkbox.type = 'checkbox';
              checkbox.value = role.name;
              checkbox.checked = true;
              label.appendChild(checkbox);
              const text = document.createElement('span');
              text.textContent = role.name + ' (' + role.count + ')';
              label.appendChild(text);
              roleCheckboxContainer.appendChild(label);
            });
          }

          function getSelectedRoles() {
            const checkboxes = roleCheckboxContainer.querySelectorAll('input[type="checkbox"]');
            const roles = [];
            checkboxes.forEach((checkbox) => {
              if (checkbox.checked) {
                roles.push(checkbox.value);
              }
            });
            return roles;
          }

          function handleDateSelectionChange() {
            const checkboxes = showDateList.querySelectorAll('input[type="checkbox"]');
            const selected = [];
            checkboxes.forEach((checkbox) => {
              if (checkbox.checked) {
                selected.push(Number(checkbox.value));
              }
            });
            selectedDateIds = selected;
            loadShiftGroups();
          }

          async function loadShowDates() {
            if (!selectedShowId) {
              showDateList.innerHTML = '';
              showDatesSection.style.display = 'none';
              return;
            }
            try {
              const response = await fetch('/admin/api/shows/' + selectedShowId + '/dates', { credentials: 'include' });
              if (!response.ok) {
                throw new Error('Failed to load performances');
              }
              const dates = await response.json();
              selectedDateIds = dates.map((date) => date.id);
              showDatesSection.style.display = dates.length ? 'block' : 'none';
              renderDateCheckboxes(dates);
              await loadShiftGroups();
            } catch (error) {
              console.error(error);
              Toast.error('Could not load performances for this show.');
              showDatesSection.style.display = 'none';
            }
          }

          async function loadShiftGroups() {
            if (!selectedShowId) {
              return;
            }
            const params = new URLSearchParams();
            if (selectedDateIds.length) {
              params.set('showDateIds', selectedDateIds.join(','));
            }
            try {
              const response = await fetch('/admin/api/shows/' + selectedShowId + '/shift-time-groups?' + params.toString(), { credentials: 'include' });
              if (!response.ok) {
                throw new Error('Failed to load shift groups');
              }
              const data = await response.json();
              lastLoadedGroups = data.groups || [];
              shiftGroupsSection.style.display = 'block';
              renderGroupsTable(lastLoadedGroups);
              if (selectedGroupKey) {
                const matching = lastLoadedGroups.find((group) => group.arrive_time + '|' + group.depart_time === selectedGroupKey);
                if (!matching) {
                  clearSelectionState();
                }
              }
            } catch (error) {
              console.error(error);
              Toast.error('Could not load shift groups.');
              shiftGroupsSection.style.display = 'none';
            }
          }

          showSelect.addEventListener('change', () => {
            const value = showSelect.value;
            selectedShowId = value ? Number(value) : null;
            clearSelectionState();
            if (selectedShowId) {
              loadShowDates();
            } else {
              showDatesSection.style.display = 'none';
              shiftGroupsSection.style.display = 'none';
            }
          });

          selectAllDatesBtn.addEventListener('click', () => {
            const checkboxes = showDateList.querySelectorAll('input[type="checkbox"]');
            selectedDateIds = [];
            checkboxes.forEach((checkbox) => {
              checkbox.checked = true;
              selectedDateIds.push(Number(checkbox.value));
            });
            loadShiftGroups();
          });

          clearAllDatesBtn.addEventListener('click', () => {
            const checkboxes = showDateList.querySelectorAll('input[type="checkbox"]');
            selectedDateIds = [];
            checkboxes.forEach((checkbox) => {
              checkbox.checked = false;
            });
            loadShiftGroups();
          });

          resetSelectionBtn.addEventListener('click', () => {
            clearSelectionState();
          });

          bulkUpdateForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!selectedShowId) {
              Toast.error('Please choose a show first.');
              return;
            }
            if (!selectedGroupKey) {
              Toast.error('Select a time block to update.');
              return;
            }
            if (!selectedDateIds.length) {
              Toast.error('Select at least one performance to update.');
              return;
            }
            const newArrive = newArriveTimeInput.value;
            const newDepart = newDepartTimeInput.value;
            const targetArrive = targetArriveTimeInput.value;
            const targetDepart = targetDepartTimeInput.value;
            if (!newArrive || !newDepart) {
              Toast.error('Enter both new arrival and departure times.');
              return;
            }
            if (newArrive === targetArrive && newDepart === targetDepart) {
              Toast.info('Times are unchanged. Enter different values to update.');
              return;
            }
            const payload = {
              showId: selectedShowId,
              targetArriveTime: targetArrive,
              targetDepartTime: targetDepart,
              newArriveTime: newArrive,
              newDepartTime: newDepart,
              showDateIds: selectedDateIds,
              roles: getSelectedRoles(),
            };
            try {
              const response = await fetch('/admin/api/shifts/bulk-update-times', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
              });
              if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Bulk update failed.' }));
                throw new Error(error.error || 'Bulk update failed.');
              }
              const result = await response.json();
              Toast.success('Updated ' + (result.updatedCount || 0) + ' shifts.');
              clearSelectionState();
              await loadShiftGroups();
            } catch (error) {
              console.error(error);
              Toast.error(error.message || 'Bulk update failed.');
            }
          });
        })();
      </script>
    </body>
    </html>
  `;
}
