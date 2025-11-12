import {
  getAdminNavigation,
  getAdminStyles,
  getAdminScripts,
} from "../components/navigation.ts";

export function renderBulkEmailTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Bulk Email - Theatre Shifts</title>
      <!-- PWA Manifest -->
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}
      <style>
        /* Email type tabs */
        .email-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid #e9ecef;
        }

        .email-tab {
          background: none;
          border: none;
          padding: 1rem 1.5rem;
          cursor: pointer;
          color: #666;
          font-size: 1rem;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }

        .email-tab.active {
          color: #007bff;
          border-bottom-color: #007bff;
          background: #f8f9fa;
        }

        .email-tab:hover {
          background: #f8f9fa;
        }

        /* Email content */
        .email-content {
          display: none;
        }

        .email-content.active {
          display: block;
        }

        /* Volunteer list */
        .volunteer-list {
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 1rem;
          background: #f8f9fa;
        }

        .volunteer-item {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          background: white;
          border-radius: 4px;
          border: 1px solid #e9ecef;
        }

        .volunteer-checkbox {
          margin-right: 1rem;
          transform: scale(1.2);
        }

        .volunteer-info {
          flex-grow: 1;
        }

        .volunteer-name {
          font-weight: bold;
          color: #333;
        }

        .volunteer-details {
          font-size: 0.9rem;
          color: #666;
        }

        .volunteer-table-container {
          padding: 0;
          background: #ffffff;
        }

        .volunteer-search {
          margin-bottom: 1.5rem;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }

        .volunteer-table-wrapper {
          padding: 0.75rem;
          overflow-x: auto;
        }

        .volunteer-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          min-width: 640px;
        }

        .volunteer-table th,
        .volunteer-table td {
          padding: 0.75rem 0.5rem;
          border-bottom: 1px solid #e9ecef;
          text-align: left;
          vertical-align: middle;
          font-size: 0.95rem;
          color: #333;
        }

        .volunteer-table thead {
          background: #f8f9fa;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .volunteer-table tbody tr:hover {
          background: #f1f5ff;
        }

        .volunteer-table .col-checkbox {
          width: 48px;
          text-align: center;
        }

        .volunteer-table .col-email,
        .volunteer-table .col-phone {
          word-break: break-word;
        }

        .volunteer-table .volunteer-checkbox {
          margin: 0 auto;
          display: block;
          transform: scale(1.05);
        }

        /* Action buttons */
        .volunteer-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        /* Loading state */
        .loading {
          display: none;
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .loading.active {
          display: block;
        }

        /* Status messages */
        .status-message {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          display: none;
        }

        .status-message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .status-message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .status-message.active {
          display: block;
        }

        .hidden {
          display: none !important;
        }

        /* Selection summary */
        .selection-summary {
          background: #e3f2fd;
          border: 1px solid #bbdefb;
          border-radius: 4px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .selection-count {
          font-weight: bold;
          color: #1976d2;
        }

        .info-message {
          margin-bottom: 1rem;
          padding: 1rem;
          border-radius: 4px;
          background: #fff3cd;
          border: 1px solid #ffeeba;
          color: #856404;
        }

        .empty-state {
          padding: 1.5rem;
          text-align: center;
          color: #666;
          background: #f8f9fa;
          border: 1px dashed #d0d7de;
          border-radius: 4px;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .email-tabs {
            flex-direction: column;
            gap: 0;
          }

          .email-tab {
            text-align: center;
            border-bottom: 1px solid #e9ecef;
            border-radius: 0;
          }

          .volunteer-actions {
            flex-direction: column;
          }
        }
      </style>
    </head>
    <body>
      ${getAdminNavigation("bulk-email")}

      <!-- Main Content -->
      <div class="main-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">Bulk Email</h1>
            <p class="page-subtitle">Send emails to groups of volunteers based on their assignments</p>
          </div>
        </div>

        <!-- Status Messages -->
        <div id="statusMessage" class="status-message"></div>

        <!-- Email Type Selection -->
        <div class="section-content">
          <div class="email-tabs">
            <button class="email-tab active" data-email-type="show-week">
              📅 Show Week Email
            </button>
            <button class="email-tab" data-email-type="wizard">
              🧙 Wizard Invitations
            </button>
            <button class="email-tab" data-email-type="unfilled-shifts">
              🚨 Unfilled Shifts Email
            </button>
          </div>

          <!-- Show Week Email Content -->
          <div class="email-content active" id="show-week-content">
            <h3 id="showEmailHeading">Show Week Email</h3>
            <p id="showWeekDescription">Send "It's Show Week!" emails to volunteers who have shifts for a selected show. This includes their schedule PDF attachment.</p>
            <p id="wizardDescription" class="hidden">Send the multi-step shift selection wizard invitation to selected volunteers. On local development servers the emails are simulated and logged instead of being sent.</p>
            
            <div class="form-group">
              <label class="form-label" for="showSelect">Select Show:</label>
              <select class="form-select" id="showSelect">
                <option value="">-- Select a show --</option>
              </select>
            </div>

            <div id="showVolunteersSection" style="display: none;">
              <div class="selection-summary">
                <div class="selection-count" id="showSelectionCount">0 volunteers selected</div>
              </div>

              <div class="volunteer-search">
                <label class="form-label" for="volunteerSearch">Search volunteers:</label>
                <input type="search" class="form-input" id="volunteerSearch" placeholder="Search by name, email, phone">
              </div>

              <div class="volunteer-actions">
                <button class="btn btn-secondary" onclick="selectAllShowVolunteers()">Select All</button>
                <button class="btn btn-secondary" onclick="deselectAllShowVolunteers()">Deselect All</button>
                <button class="btn btn-primary" onclick="sendShowWeekEmails()" id="sendShowWeekBtn" disabled>
                  Send Show Week Emails
                </button>
                <button class="btn btn-secondary hidden" onclick="sendWizardEmails()" id="sendWizardBtn" disabled>
                  Send Wizard Invitations
                </button>
              </div>

              <div class="volunteer-list volunteer-table-container" id="showVolunteersList">
                <!-- Volunteers will be loaded here -->
              </div>
            </div>
          </div>

          <!-- Unfilled Shifts Email Content -->
          <div class="email-content" id="unfilled-shifts-content">
            <h3>Unfilled Shifts Email</h3>
            <p>Send "Last Minute Shifts" emails to volunteers asking them to help fill outstanding shifts. This includes a PDF of the next 10 unfilled shifts.</p>
            
            <div class="selection-summary">
              <div class="selection-count" id="unfilledSelectionCount">0 volunteers selected</div>
            </div>

            <div class="volunteer-actions">
              <button class="btn btn-secondary" onclick="selectAllUnfilledVolunteers()">Select All</button>
              <button class="btn btn-secondary" onclick="deselectAllUnfilledVolunteers()">Deselect All</button>
              <button class="btn btn-primary" onclick="sendUnfilledShiftsEmails()" id="sendUnfilledBtn" disabled>
                Send Unfilled Shifts Emails
              </button>
            </div>

            <div class="volunteer-list" id="unfilledVolunteersList">
              <!-- Volunteers will be loaded here -->
            </div>
          </div>

          <!-- Loading State -->
          <div id="loadingState" class="loading">
            <div>Loading volunteers...</div>
          </div>
        </div>
      </div>

      <script>
        // Global state
        let currentEmailType = 'show-week';
        let showVolunteers = [];
        let unfilledVolunteers = [];
        let wizardVolunteers = [];
        let selectedShowVolunteers = new Set();
        let selectedUnfilledVolunteers = new Set();
        let volunteerSearchTerm = '';

        function getFirstName(name) {
          if (!name) {
            return '';
          }
          return name.trim().split(/\s+/)[0]?.toLowerCase() || '';
        }

        function sortVolunteersByFirstName(volunteers) {
          return Array.isArray(volunteers)
            ? [...volunteers].sort((a, b) => {
                const firstA = getFirstName(a?.name);
                const firstB = getFirstName(b?.name);
                if (firstA === firstB) {
                  return (a?.name || '').localeCompare(b?.name || '');
                }
                return firstA.localeCompare(firstB);
              })
            : [];
        }

        function formatVolunteerDetails(volunteer) {
          if (!volunteer) {
            return '';
          }

          if ('shift_count' in volunteer) {
            const shiftCount = volunteer.shift_count ?? 0;
            const nextShift = volunteer.next_shift_date || 'N/A';
            const pluralSuffix = shiftCount === 1 ? '' : 's';
            return shiftCount + ' shift' + pluralSuffix + ' • Next: ' + nextShift;
          }

          const totalShifts = volunteer.total_shifts ?? 0;
          const upcomingShifts = volunteer.upcoming_shifts ?? 0;
          return 'Total shifts: ' + totalShifts + ' • Upcoming: ' + upcomingShifts;
        }

        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
          loadShows();
          loadUnfilledVolunteers();
          setupEventListeners();
          switchEmailType(currentEmailType);
        });

        function setupEventListeners() {
          // Email type tabs
          document.querySelectorAll('.email-tab').forEach(tab => {
            tab.addEventListener('click', function() {
              const emailType = this.dataset.emailType;
              switchEmailType(emailType);
            });
          });

          // Show selection
          document.getElementById('showSelect').addEventListener('change', function() {
            const showId = this.value;
            if (showId) {
              loadShowVolunteers(showId);
            } else {
              document.getElementById('showVolunteersSection').style.display = 'none';
              resetVolunteerSearch();
              selectedShowVolunteers.clear();
              updateShowSelectionCount();
              const listContainer = document.getElementById('showVolunteersList');
              if (listContainer) {
                listContainer.innerHTML = '';
              }
            }
          });

          const searchInput = document.getElementById('volunteerSearch');
          if (searchInput) {
            searchInput.addEventListener('input', function() {
              volunteerSearchTerm = this.value.trim().toLowerCase();
              renderShowVolunteers({ preserveSelection: true });
            });
          }
        }

        function switchEmailType(emailType) {
          currentEmailType = emailType;
          
          // Update tab styles
          document.querySelectorAll('.email-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.emailType === emailType);
          });

          // Update content visibility
          const contentId = emailType === 'wizard' ? 'show-week-content' : emailType + '-content';
          document.querySelectorAll('.email-content').forEach(content => {
            content.classList.toggle('active', content.id === contentId);
          });

          const heading = document.getElementById('showEmailHeading');
          const showWeekDescription = document.getElementById('showWeekDescription');
          const wizardDescription = document.getElementById('wizardDescription');
          const showWeekButton = document.getElementById('sendShowWeekBtn');
          const wizardButton = document.getElementById('sendWizardBtn');

          if (heading) {
            heading.textContent = emailType === 'wizard' ? 'Wizard Invitations' : 'Show Week Email';
          }

          if (showWeekDescription && wizardDescription && showWeekButton && wizardButton) {
            const wizardMode = emailType === 'wizard';
            showWeekDescription.classList.toggle('hidden', wizardMode);
            wizardDescription.classList.toggle('hidden', !wizardMode);
            showWeekButton.classList.toggle('hidden', wizardMode);
            wizardButton.classList.toggle('hidden', !wizardMode);
          }

          updateShowSelectionCount();

          if (document.getElementById('showVolunteersSection').style.display !== 'none') {
            renderShowVolunteers({ preserveSelection: true });
          }
        }

        async function loadShows() {
          try {
            const response = await fetch('/admin/api/bulk-email/shows');
            const shows = await response.json();
            
            const select = document.getElementById('showSelect');
            select.innerHTML = '<option value="">-- Select a show --</option>';
            
            shows.forEach(show => {
              const option = document.createElement('option');
              option.value = show.id;
              option.textContent = \`\${show.name} (\${show.volunteers_with_shifts} volunteers with shifts)\`;
              select.appendChild(option);
            });
          } catch (error) {
            console.error('Error loading shows:', error);
            showStatus('Error loading shows', 'error');
          }
        }

        async function loadShowVolunteers(showId) {
          document.getElementById('loadingState').classList.add('active');
          resetVolunteerSearch();
          selectedShowVolunteers.clear();

          try {
            const response = await fetch('/admin/api/bulk-email/shows/' + showId + '/volunteers');
            showVolunteers = await response.json();

            renderShowVolunteers({ preserveSelection: false });
            document.getElementById('showVolunteersSection').style.display = 'block';
            updateShowSelectionCount();
          } catch (error) {
            console.error('Error loading show volunteers:', error);
            showStatus('Error loading volunteers', 'error');
          } finally {
            document.getElementById('loadingState').classList.remove('active');
          }
        }

        async function loadUnfilledVolunteers() {
          try {
            const response = await fetch('/admin/api/bulk-email/volunteers/unfilled-shifts');
            unfilledVolunteers = await response.json();
            wizardVolunteers = sortVolunteersByFirstName(unfilledVolunteers);
            
            renderUnfilledVolunteers();
            updateUnfilledSelectionCount();

            if (
              currentEmailType === 'wizard' &&
              document.getElementById('showVolunteersSection').style.display !== 'none' &&
              (!showVolunteers || showVolunteers.length === 0)
            ) {
              renderShowVolunteers({ preserveSelection: false });
            }
          } catch (error) {
            console.error('Error loading unfilled volunteers:', error);
            showStatus('Error loading volunteers', 'error');
          }
        }

        function resetVolunteerSearch() {
          volunteerSearchTerm = '';
          const searchInput = document.getElementById('volunteerSearch');
          if (searchInput) {
            searchInput.value = '';
          }
        }

        function renderShowVolunteers({ preserveSelection = false } = {}) {
          const container = document.getElementById('showVolunteersList');
          container.innerHTML = '';

          const fragment = document.createDocumentFragment();

          const usingWizardFallback =
            currentEmailType === 'wizard' &&
            (!showVolunteers || showVolunteers.length === 0) &&
            wizardVolunteers.length > 0;

          const sourceList = usingWizardFallback ? wizardVolunteers : showVolunteers;
          const baseList = Array.isArray(sourceList) ? sourceList : [];
          const sortedVolunteers = sortVolunteersByFirstName(baseList);

          if (usingWizardFallback) {
            const info = document.createElement('div');
            info.className = 'info-message';
            info.textContent =
              'No volunteers currently have shifts for this show. Showing all approved volunteers instead.';
            fragment.appendChild(info);
          }

          if (!preserveSelection) {
            selectedShowVolunteers.clear();
          } else {
            const validIds = new Set(sortedVolunteers.map((volunteer) => String(volunteer.id)));
            Array.from(selectedShowVolunteers).forEach((id) => {
              if (!validIds.has(id)) {
                selectedShowVolunteers.delete(id);
              }
            });
          }

          if (sortedVolunteers.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No volunteers available to display.';
            fragment.appendChild(empty);
            container.appendChild(fragment);
            updateShowSelectionCount();
            return;
          }

          const loweredSearch = volunteerSearchTerm.trim().toLowerCase();
          const hasSearch = loweredSearch.length > 0;
          const filteredVolunteers = hasSearch
            ? sortedVolunteers.filter((volunteer) => {
                const haystack = [
                  volunteer?.name || '',
                  volunteer?.email || '',
                  volunteer?.phone || '',
                  formatVolunteerDetails(volunteer),
                ]
                  .join(' ')
                  .toLowerCase();
                return haystack.includes(loweredSearch);
              })
            : sortedVolunteers;

          if (filteredVolunteers.length === 0) {
            const noMatches = document.createElement('div');
            noMatches.className = 'empty-state';
            noMatches.textContent = 'No volunteers match your search.';
            fragment.appendChild(noMatches);
            container.appendChild(fragment);
            updateShowSelectionCount();
            return;
          }

          const tableWrapper = document.createElement('div');
          tableWrapper.className = 'volunteer-table-wrapper';

          const table = document.createElement('table');
          table.className = 'volunteer-table';

          const thead = document.createElement('thead');
          const headerRow = document.createElement('tr');

          const headers = [
            { label: 'Select', className: 'col-checkbox' },
            { label: 'Name', className: '' },
            { label: 'Email', className: 'col-email' },
            { label: 'Phone', className: 'col-phone' },
            { label: 'Details', className: 'col-details' },
          ];

          headers.forEach(({ label, className }) => {
            const th = document.createElement('th');
            if (className) {
              th.className = className;
            }
            th.textContent = label;
            headerRow.appendChild(th);
          });

          thead.appendChild(headerRow);
          table.appendChild(thead);

          const tbody = document.createElement('tbody');

          filteredVolunteers.forEach((volunteer) => {
            const row = document.createElement('tr');
            const volunteerId = String(volunteer.id);

            const checkboxCell = document.createElement('td');
            checkboxCell.className = 'col-checkbox';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'volunteer-checkbox';
            checkbox.dataset.volunteerId = volunteerId;
            checkbox.checked = selectedShowVolunteers.has(volunteerId);
            checkbox.addEventListener('change', function () {
              updateShowSelection(volunteerId, this.checked);
            });
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);

            const nameCell = document.createElement('td');
            nameCell.textContent = volunteer.name || 'Unnamed Volunteer';
            row.appendChild(nameCell);

            const emailCell = document.createElement('td');
            emailCell.className = 'col-email';
            emailCell.textContent = volunteer.email || '';
            row.appendChild(emailCell);

            const phoneCell = document.createElement('td');
            phoneCell.className = 'col-phone';
            phoneCell.textContent = volunteer.phone || '—';
            row.appendChild(phoneCell);

            const detailsCell = document.createElement('td');
            detailsCell.textContent = formatVolunteerDetails(volunteer);
            row.appendChild(detailsCell);

            tbody.appendChild(row);
          });

          table.appendChild(tbody);
          tableWrapper.appendChild(table);
          fragment.appendChild(tableWrapper);

          container.appendChild(fragment);
          updateShowSelectionCount();
        }

        function renderUnfilledVolunteers() {
          const container = document.getElementById('unfilledVolunteersList');
          container.innerHTML = '';
          
          unfilledVolunteers.forEach((volunteer) => {
            const item = document.createElement('div');
            item.className = 'volunteer-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'volunteer-checkbox';
            checkbox.dataset.volunteerId = String(volunteer.id);
            checkbox.addEventListener('change', function () {
              updateUnfilledSelection(String(volunteer.id), this.checked);
            });

            const info = document.createElement('div');
            info.className = 'volunteer-info';

            const name = document.createElement('div');
            name.className = 'volunteer-name';
            name.textContent = volunteer.name;

            const details = document.createElement('div');
            details.className = 'volunteer-details';
            details.textContent =
              volunteer.email +
              ' • Total shifts: ' +
              (volunteer.total_shifts ?? 0) +
              ' • Upcoming: ' +
              (volunteer.upcoming_shifts ?? 0);

            info.appendChild(name);
            info.appendChild(details);

            item.appendChild(checkbox);
            item.appendChild(info);
            container.appendChild(item);
          });

          selectedUnfilledVolunteers.clear();
          updateUnfilledSelectionCount();
        }

        function updateShowSelection(volunteerId, checked) {
          const id = String(volunteerId);
          if (checked) {
            selectedShowVolunteers.add(id);
          } else {
            selectedShowVolunteers.delete(id);
          }
          updateShowSelectionCount();
        }

        function updateUnfilledSelection(volunteerId, checked) {
          const id = String(volunteerId);
          if (checked) {
            selectedUnfilledVolunteers.add(id);
          } else {
            selectedUnfilledVolunteers.delete(id);
          }
          updateUnfilledSelectionCount();
        }

        function updateShowSelectionCount() {
          const count = selectedShowVolunteers.size;
          document.getElementById('showSelectionCount').textContent = \`\${count} volunteers selected\`;
          const showWeekButton = document.getElementById('sendShowWeekBtn');
          const wizardButton = document.getElementById('sendWizardBtn');
          if (showWeekButton) {
            showWeekButton.disabled = count === 0;
          }
          if (wizardButton) {
            wizardButton.disabled = count === 0;
          }
        }

        function updateUnfilledSelectionCount() {
          const count = selectedUnfilledVolunteers.size;
          document.getElementById('unfilledSelectionCount').textContent = \`\${count} volunteers selected\`;
          document.getElementById('sendUnfilledBtn').disabled = count === 0;
        }

        function selectAllShowVolunteers() {
          const checkboxes = document.querySelectorAll('#showVolunteersList .volunteer-checkbox');
          checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            selectedShowVolunteers.add(checkbox.dataset.volunteerId);
          });
          updateShowSelectionCount();
        }

        function deselectAllShowVolunteers() {
          const checkboxes = document.querySelectorAll('#showVolunteersList .volunteer-checkbox');
          checkboxes.forEach(checkbox => {
            checkbox.checked = false;
          });
          selectedShowVolunteers.clear();
          updateShowSelectionCount();
        }

        function selectAllUnfilledVolunteers() {
          const checkboxes = document.querySelectorAll('#unfilledVolunteersList .volunteer-checkbox');
          checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            selectedUnfilledVolunteers.add(checkbox.dataset.volunteerId);
          });
          updateUnfilledSelectionCount();
        }

        function deselectAllUnfilledVolunteers() {
          const checkboxes = document.querySelectorAll('#unfilledVolunteersList .volunteer-checkbox');
          checkboxes.forEach(checkbox => {
            checkbox.checked = false;
          });
          selectedUnfilledVolunteers.clear();
          updateUnfilledSelectionCount();
        }

        async function sendShowWeekEmails() {
          if (selectedShowVolunteers.size === 0) {
            showStatus('Please select at least one volunteer', 'error');
            return;
          }

          const showId = document.getElementById('showSelect').value;
          if (!showId) {
            showStatus('Please select a show', 'error');
            return;
          }

          const btn = document.getElementById('sendShowWeekBtn');
          btn.disabled = true;
          btn.textContent = 'Sending...';

          try {
            const response = await fetch('/admin/api/bulk-email/send-show-week', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                showId: parseInt(showId),
                volunteerIds: Array.from(selectedShowVolunteers)
              })
            });

            const result = await response.json();

            if (result.success) {
              showStatus(\`\${result.message}\`, 'success');
              // Optionally clear selection
              deselectAllShowVolunteers();
            } else {
              showStatus(result.error || 'Failed to send emails', 'error');
            }
          } catch (error) {
            console.error('Error sending show week emails:', error);
            showStatus('Error sending emails', 'error');
          } finally {
            btn.disabled = false;
            btn.textContent = 'Send Show Week Emails';
          }
        }

        async function sendWizardEmails() {
          if (selectedShowVolunteers.size === 0) {
            showStatus('Please select at least one volunteer', 'error');
            return;
          }

          const showId = document.getElementById('showSelect').value;
          if (!showId) {
            showStatus('Please select a show', 'error');
            return;
          }

          const btn = document.getElementById('sendWizardBtn');
          if (!btn) {
            showStatus('Wizard button not available', 'error');
            return;
          }

          btn.disabled = true;
          const originalText = btn.textContent;
          btn.textContent = 'Sending...';

          try {
            const response = await fetch('/admin/api/bulk-email/send-upcoming-wizard', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                showId: parseInt(showId),
                volunteerIds: Array.from(selectedShowVolunteers)
              })
            });

            const result = await response.json();

            if (result.success) {
              const deliveryMode = result.deliveryMode === 'simulated' ? ' (simulated)' : '';
              showStatus(\`\${result.message}\${deliveryMode}\`, 'success');
              if (result.deliveryMode === 'simulated') {
                console.info('Wizard invitations simulated. Check server logs for the rendered email preview.');
              }
            } else {
              showStatus(result.error || 'Failed to send wizard invitations', 'error');
            }
          } catch (error) {
            console.error('Error sending wizard invitations:', error);
            showStatus('Error sending wizard invitations', 'error');
          } finally {
            btn.disabled = selectedShowVolunteers.size === 0;
            btn.textContent = originalText;
          }
        }

        async function sendUnfilledShiftsEmails() {
          if (selectedUnfilledVolunteers.size === 0) {
            showStatus('Please select at least one volunteer', 'error');
            return;
          }

          const btn = document.getElementById('sendUnfilledBtn');
          btn.disabled = true;
          btn.textContent = 'Sending...';

          try {
            const response = await fetch('/admin/api/bulk-email/send-unfilled-shifts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                volunteerIds: Array.from(selectedUnfilledVolunteers)
              })
            });

            const result = await response.json();

            if (result.success) {
              showStatus(\`\${result.message}\`, 'success');
              // Optionally clear selection
              deselectAllUnfilledVolunteers();
            } else {
              showStatus(result.error || 'Failed to send emails', 'error');
            }
          } catch (error) {
            console.error('Error sending unfilled shifts emails:', error);
            showStatus('Error sending emails', 'error');
          } finally {
            btn.disabled = false;
            btn.textContent = 'Send Unfilled Shifts Emails';
          }
        }

        function showStatus(message, type) {
          const statusElement = document.getElementById('statusMessage');
          statusElement.textContent = message;
          statusElement.className = \`status-message \${type} active\`;
          
          // Auto-hide after 5 seconds
          setTimeout(() => {
            statusElement.classList.remove('active');
          }, 5000);
        }
      </script>

      ${getAdminScripts()}
    </body>
    </html>
  `;
}
