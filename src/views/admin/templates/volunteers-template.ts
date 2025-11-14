import {
  getAdminNavigation,
  getAdminStyles,
  getAdminScripts,
} from "../components/navigation.ts";

export interface Volunteer {
  id: number;
  name: string;
  email: string;
  phone: string;
  approved: boolean;
}

export interface VolunteersPageData {
  volunteers: Volunteer[];
}

export function renderVolunteersTemplate(data: VolunteersPageData): string {
  const { volunteers } = data;
  const escapeHtmlContent = (value: string | null | undefined): string => {
    if (value === null || value === undefined) {
      return "";
    }
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  const escapeAttributeValue = (value: string | null | undefined): string => {
    if (value === null || value === undefined) {
      return "";
    }
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  const normalizeSearchTokens = (input: string): string => {
    if (!input) {
      return "";
    }
    let normalized = input;
    try {
      normalized = normalized.normalize("NFD");
    } catch (_error) {
      // ignore - normalize may not exist in some environments
    }
    normalized = normalized.replace(/[\u0300-\u036f]/g, "");
    return normalized.toLowerCase().replace(/\s+/g, " ").trim();
  };

  const tableRows = volunteers
    .map((volunteer) => {
      const name = volunteer.name ?? "";
      const email = volunteer.email ?? "";
      const phone = volunteer.phone ?? "";
      const displayName = escapeHtmlContent(name);
      const displayEmail = email ? escapeHtmlContent(email) : "N/A";
      const displayPhone = phone ? escapeHtmlContent(phone) : "N/A";
      const approvalName = name
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\\/g, "\\\\");
      const deleteName = name.replace(/'/g, "\\'").replace(/\\/g, "\\\\");
      const ariaName = escapeAttributeValue(name);
      const emailAttr = escapeAttributeValue(email);
      const searchTokens = normalizeSearchTokens(`${name} ${email} ${phone}`);
      const searchAttr = escapeAttributeValue(searchTokens);

      return `
                <tr data-search="${searchAttr}">
                  <td data-label="Name">
                    <strong>${displayName}</strong>
                  </td>
                  <td data-label="Email" class="cell-email">
                    ${displayEmail}
                  </td>
                  <td data-label="Phone">
                    ${displayPhone}
                  </td>
                  <td data-label="Login Enabled">
                    <div class="approval-toggle">
                      <label class="switch">
                        <input type="checkbox" ${
                          volunteer.approved ? "checked" : ""
                        } 
                               onchange="toggleApproval('${
                                 volunteer.id
                               }', this.checked, '${approvalName}')">
                        <span class="slider" aria-hidden="true"></span>
                      </label>
                      <span class="approval-status ${
                        volunteer.approved ? "approved" : "pending"
                      }" data-volunteer-id="${volunteer.id}">${
        volunteer.approved ? "Enabled" : "Disabled"
      }</span>
                    </div>
                  </td>
                  <td data-label="Actions">
                    <div class="table-actions">
                      <input type="hidden" class="signup-url" value="/volunteer/signup/${
                        volunteer.id
                      }" readonly id="url-${volunteer.id}" data-full-url="">
                      <button type="button" class="actions-toggle" aria-haspopup="true" aria-expanded="false" aria-label='Toggle actions menu for ${ariaName}' aria-controls="actions-menu-${
        volunteer.id
      }">
                        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                          <circle cx="8" cy="2" r="1.5"></circle>
                          <circle cx="8" cy="8" r="1.5"></circle>
                          <circle cx="8" cy="14" r="1.5"></circle>
                        </svg>
                        <span>Actions</span>
                      </button>
                      <div class="table-actions-list" id="actions-menu-${
                        volunteer.id
                      }" role="menu" aria-hidden="true">
                        <a href="/admin/volunteers/${
                          volunteer.id
                        }/shifts" class="menu-item" role="menuitem">Shifts</a>
                        <a href="/admin/volunteers/${
                          volunteer.id
                        }/edit" class="menu-item" role="menuitem">Edit</a>
                        <button class="menu-item send-pdf-btn" type="button" data-volunteer-id="${
                          volunteer.id
                        }" data-volunteer-name="${ariaName}" data-volunteer-email="${emailAttr}" role="menuitem" ${
        !volunteer.email ? 'disabled title="No email address"' : ""
      }>📧 Send PDF</button>
                        <button class="menu-item send-show-week-btn" type="button" data-volunteer-id="${
                          volunteer.id
                        }" data-volunteer-name="${ariaName}" data-volunteer-email="${emailAttr}" role="menuitem" ${
        !volunteer.email ? 'disabled title="No email address"' : ""
      }>🎭 Show Week</button>
                        <button class="menu-item send-last-minute-btn" type="button" data-volunteer-id="${
                          volunteer.id
                        }" data-volunteer-name="${ariaName}" data-volunteer-email="${emailAttr}" role="menuitem" ${
        !volunteer.email ? 'disabled title="No email address"' : ""
      }>🚨 Last Minute</button>
                        <button class="menu-item email-history-btn" type="button" data-volunteer-id="${
                          volunteer.id
                        }" data-volunteer-name="${ariaName}" role="menuitem">📧 History</button>
                        <button onclick="deleteVolunteer('${
                          volunteer.id
                        }', '${deleteName}')" class="menu-item danger" type="button" role="menuitem">Delete</button>
                        <div class="actions-separator" role="separator"></div>
                        <button class="menu-item" type="button" onclick="copySignupUrl('${
                          volunteer.id
                        }')" id="copy-btn-${
        volunteer.id
      }" aria-label='Copy signup link for ${ariaName}' role="menuitem">Copy Signup Link</button>
                        <button class="menu-item" type="button" onclick="openSignupUrl('${
                          volunteer.id
                        }')" id="open-btn-${
        volunteer.id
      }" aria-label='Open signup link for ${ariaName}' role="menuitem">Open Signup Link</button>
                      </div>
                    </div>
                  </td>
                </tr>
              `;
    })
    .join("");

  const totalVolunteers = volunteers.length;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Manage Participants - Theatre Shifts</title>
      <!-- PWA Manifest -->
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}      <style>
        /* Toggle switch styles */
        .approval-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: #28a745;
        }
        input:checked + .slider:before {
          transform: translateX(26px);
        }
        .approval-status {
          font-size: 0.875rem;
          font-weight: 500;
        }
        .approval-status.approved {
          color: #28a745;
        }
        .approval-status.pending {
          color: #dc3545;
        }
        
        /* Modal button styles */
        .modal-btn-secondary {
          background-color: #6c757d !important;
          border-color: #6c757d !important;
          color: white !important;
        }
        .modal-btn-secondary:hover {
          background-color: #5a6268 !important;
          border-color: #545b62 !important;
        }
        .modal-btn-danger {
          background-color: #dc3545 !important;
          border-color: #dc3545 !important;
          color: white !important;
        }
        .modal-btn-danger:hover {
          background-color: #c82333 !important;
          border-color: #bd2130 !important;
        }
        
        /* Force Mode Notification Banner */
        .force-mode-banner {
          background: linear-gradient(135deg, #ff6b35, #f9ca24);
          border: 2px solid #ff6b35;
          border-radius: 8px;
          margin: 1rem 0;
          box-shadow: 0 4px 6px rgba(255, 107, 53, 0.2);
          animation: pulse-orange 2s infinite;
        }
        .force-mode-content {
          display: flex;
          align-items: center;
          padding: 1rem 1.5rem;
          gap: 1rem;
        }
        .force-mode-icon {
          font-size: 1.5rem;
          filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));
        }
        .force-mode-text {
          flex: 1;
          color: #2c2c2c;
          font-weight: 600;
          text-shadow: 1px 1px 2px rgba(255,255,255,0.5);
        }
        .force-mode-disable {
          background: rgba(255,255,255,0.9);
          border: 2px solid #2c2c2c;
          color: #2c2c2c;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .force-mode-disable:hover {
          background: #fff;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        @keyframes pulse-orange {
          0%, 100% { 
            box-shadow: 0 4px 6px rgba(255, 107, 53, 0.2);
          }
          50% { 
            box-shadow: 0 6px 12px rgba(255, 107, 53, 0.4);
          }
        }

        .table-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin: 1.5rem 0 1rem;
          flex-wrap: wrap;
        }

        .toolbar-search {
          position: relative;
          flex: 1 1 320px;
          max-width: 420px;
        }

        .toolbar-search input {
          width: 100%;
          padding: 0.65rem 1rem 0.65rem 2.5rem;
          border: 1px solid #d1d5db;
          border-radius: 999px;
          font-size: 0.95rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          background: #ffffff;
          color: #1f2937;
        }

        .toolbar-search input::placeholder {
          color: #9ca3af;
        }

        .toolbar-search input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .toolbar-search svg {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          pointer-events: none;
        }

        .toolbar-meta {
          color: #374151;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .toolbar-meta span {
          white-space: nowrap;
        }

        .toolbar-count-label span {
          font-weight: 600;
          color: #111827;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }

        .no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.5rem 0;
          color: #4b5563;
        }

        .no-results p {
          margin: 0;
          font-size: 0.95rem;
          text-align: center;
        }

        /* Participants Table Enhancements */
        .table-container {
          overflow-x: auto;
          border-radius: 12px;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          min-width: 720px;
        }

        .table th,
        .table td {
          vertical-align: top;
        }

        .table td {
          color: #2c2c2c;
        }

        .cell-email {
          word-break: break-word;
        }

        .approval-toggle {
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .approval-status {
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          background: rgba(40, 167, 69, 0.12);
          color: #1b6f3a;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .approval-status.pending {
          background: rgba(220, 53, 69, 0.12);
          color: #b21f2d;
        }

        .table-actions {
          position: relative;
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        .actions-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          border: 1px solid #d3d9e3;
          background: #f8fafc;
          color: #1d4ed8;
          cursor: pointer;
          border-radius: 999px;
          padding: 0.35rem 0.85rem;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }

        .actions-toggle svg {
          display: block;
          transition: transform 0.2s ease;
        }

        .actions-toggle span {
          display: inline;
        }

        .actions-toggle:focus-visible {
          outline: 2px solid #1d4ed8;
          outline-offset: 2px;
        }

        .table-actions-list {
          display: none;
          position: absolute;
          right: 0;
          top: calc(100% + 0.5rem);
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #dfe3eb;
          box-shadow: 0 20px 48px rgba(15, 23, 42, 0.18);
          padding: 0.75rem;
          min-width: min(260px, 90vw);
          max-width: min(260px, 90vw);
          flex-direction: column;
          gap: 0.25rem;
          z-index: 20;
        }

        .table-actions.open .table-actions-list {
          display: flex;
        }

        .table-actions.open .actions-toggle {
          background: #1d4ed8;
          color: #ffffff;
          border-color: #1d4ed8;
        }

        .table-actions.open .actions-toggle svg {
          transform: rotate(90deg);
        }

        .actions-separator {
          height: 1px;
          background: #e2e8f0;
          margin: 0.35rem 0;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #1f2937;
          font-size: 0.85rem;
          text-decoration: none;
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease;
          text-align: left;
        }

        .menu-item:hover,
        .menu-item:focus {
          background: #f1f5f9;
          color: #1d4ed8;
          outline: none;
        }

        .menu-item[disabled] {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .menu-item.danger {
          color: #b91c1c;
        }

        .menu-item.danger:hover,
        .menu-item.danger:focus {
          background: rgba(220, 53, 69, 0.12);
          color: #7f1d1d;
        }

        .menu-item.send-last-minute-btn {
          color: #b45309;
        }

        .menu-item.send-last-minute-btn:hover,
        .menu-item.send-last-minute-btn:focus {
          background: rgba(217, 119, 6, 0.12);
          color: #92400e;
        }

        @media (max-width: 1024px) {
          .table {
            min-width: 640px;
          }
        }

        @media (max-width: 820px) {
          .table-container {
            overflow-x: visible;
          }

          .table {
            min-width: 0;
          }

          thead {
            display: none;
          }

          table,
          tbody,
          tr,
          td {
            display: block;
            width: 100%;
          }

          tr {
            background: #ffffff;
            border: 1px solid #e6e9ee;
            border-radius: 12px;
            padding: 1rem 1rem 0.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
          }

          td {
            border: none;
            padding: 0.75rem 0 0.75rem 45%;
            position: relative;
            text-align: left;
          }

          td::before {
            content: attr(data-label);
            position: absolute;
            left: 0.75rem;
            top: 0.75rem;
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: #6c757d;
          }

          td:first-child {
            padding-top: 1rem;
          }

          td:last-child {
            padding-bottom: 1.25rem;
          }

          .approval-toggle {
            justify-content: space-between;
          }

          .approval-status {
            margin-left: auto;
          }

          .table-actions {
            margin-top: 0.5rem;
          }

          .table-toolbar {
            flex-direction: column;
            align-items: stretch;
            margin: 1.25rem 0;
          }

          .toolbar-meta {
            width: 100%;
            text-align: left;
            font-size: 0.85rem;
          }

          .toolbar-meta span {
            white-space: normal;
          }
        }
      </style>
    </head>
    <body>
      ${getAdminNavigation("volunteers")}
      
      <!-- Main Content -->
      <div class="main-content">
        <div class="page-header">
          <h1 class="page-title">Manage Participants</h1>
          <div class="page-actions">
            <a href="/admin/volunteers/new" class="btn btn-primary">Add New Participant</a>
          </div>
        </div>

        <!-- Force Mode Notification Banner -->
        <div id="forceModeNotification" class="force-mode-banner" style="display: none;">
          <div class="force-mode-content">
            <span class="force-mode-icon">⚠️</span>
            <span class="force-mode-text">
              <strong>FORCE PRODUCTION MODE ACTIVE</strong> - Emails will be sent even in development mode
            </span>
            <button id="disableForceModeBtn" class="force-mode-disable">Remove ?force=true</button>
          </div>
        </div>

        <div class="table-toolbar">
          <div class="toolbar-search">
            <label for="volunteerSearch" class="sr-only">Search participants</label>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.71.71l.27.28v.79l5 4.99L20.49 19zM10.5 15a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" />
            </svg>
            <input type="search" id="volunteerSearch" name="volunteerSearch" placeholder="Search by name, email, or phone" autocomplete="off" spellcheck="false" />
          </div>
          <div class="toolbar-meta">
            <span class="toolbar-count-label">Showing <span id="volunteerSearchCount">${totalVolunteers}</span> of <span id="volunteerSearchTotal">${totalVolunteers}</span> participants</span>
          </div>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Login Enabled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${
                tableRows ||
                `
                <tr class="no-data-row">
                  <td colspan="5">
                    <div class="no-results">
                      <p>No participants found yet.</p>
                    </div>
                  </td>
                </tr>
              `
              }
              <tr class="no-results-row" style="display: none;">
                <td colspan="5">
                  <div class="no-results">
                    <p>No participants match your search.</p>
                    <button type="button" class="btn btn-sm btn-outline" id="volunteerSearchReset">Clear search</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <script src="/src/utils/modal.js"></script>
      <script src="/src/utils/timezone-client.js"></script>
      <script src="/src/views/admin/volunteers.js"></script>
      ${getAdminScripts()}
      <script>
        // Utility function to check for force parameter and modify API URLs
        function getAPIURL(baseUrl) {
          const urlParams = new URLSearchParams(window.location.search);
          const forceParam = urlParams.get('force');
          if (forceParam === 'true') {
            return baseUrl + '?force=true';
          }
          return baseUrl;
        }

        let actionMenusEventsBound = false;
        
        // Check and show force mode notification
        function checkForceMode() {
          const urlParams = new URLSearchParams(window.location.search);
          const forceParam = urlParams.get('force');
          const notification = document.getElementById('forceModeNotification');

          if (forceParam === 'true' && notification) {
            notification.style.display = 'block';

            // Add click handler for disable button
            const disableBtn = document.getElementById('disableForceModeBtn');
            if (disableBtn) {
              disableBtn.addEventListener('click', function() {
                // Remove force parameter from URL
                const newUrl = new URL(window.location);
                newUrl.searchParams.delete('force');
                window.location.href = newUrl.toString();
              });
            }
          }
        }
        
        // Hydrate signup URLs for copy/open actions
        document.addEventListener('DOMContentLoaded', function() {
          // Check and show force mode notification
          checkForceMode();
          const urlInputs = document.querySelectorAll('.signup-url');
          urlInputs.forEach(input => {
            const relativeUrl = input.value;
            const fullUrl = globalThis.location.origin + relativeUrl;
            input.setAttribute('data-full-url', fullUrl);
            input.value = fullUrl;
            input.setAttribute('value', fullUrl);
          });

          // Add event listeners for Send PDF buttons
          const sendPdfButtons = document.querySelectorAll('.send-pdf-btn');
          sendPdfButtons.forEach(button => {
            button.addEventListener('click', function() {
              const volunteerId = this.getAttribute('data-volunteer-id');
              const volunteerName = this.getAttribute('data-volunteer-name');
              const volunteerEmail = this.getAttribute('data-volunteer-email');

              console.log('Send PDF clicked:', { volunteerId, volunteerName, volunteerEmail });

              if (volunteerId && volunteerName) {
                sendSchedulePDF(volunteerId, volunteerName, volunteerEmail);
              }
            });
          });

          // Add event listeners for Show Week buttons
          const sendShowWeekButtons = document.querySelectorAll('.send-show-week-btn');
          sendShowWeekButtons.forEach(button => {
            button.addEventListener('click', function() {
              const volunteerId = this.getAttribute('data-volunteer-id');
              const volunteerName = this.getAttribute('data-volunteer-name');
              const volunteerEmail = this.getAttribute('data-volunteer-email');

              console.log('Send Show Week clicked:', { volunteerId, volunteerName, volunteerEmail });

              if (volunteerId && volunteerName) {
                sendShowWeekEmail(volunteerId, volunteerName, volunteerEmail);
              }
            });
          });

          // Add event listeners for Last Minute Shifts buttons
          const sendLastMinuteButtons = document.querySelectorAll('.send-last-minute-btn');
          sendLastMinuteButtons.forEach(button => {
            button.addEventListener('click', function() {
              const volunteerId = this.getAttribute('data-volunteer-id');
              const volunteerName = this.getAttribute('data-volunteer-name');
              const volunteerEmail = this.getAttribute('data-volunteer-email');

              console.log('Send Last Minute clicked:', { volunteerId, volunteerName, volunteerEmail });

              if (volunteerId && volunteerName) {
                sendLastMinuteShiftsEmail(volunteerId, volunteerName, volunteerEmail);
              }
            });
          });

          // Add event listeners for Email History buttons
          const emailHistoryButtons = document.querySelectorAll('.email-history-btn');
          emailHistoryButtons.forEach(button => {
            button.addEventListener('click', function() {
              const volunteerId = this.getAttribute('data-volunteer-id');
              const volunteerName = this.getAttribute('data-volunteer-name');

              console.log('Email History clicked:', { volunteerId, volunteerName });

              if (volunteerId && volunteerName) {
                showEmailHistory(volunteerId, volunteerName);
              }
            });
          });

          initializeActionMenus();
          initializeVolunteerSearch();
        });

        function initializeActionMenus() {
          const actionContainers = document.querySelectorAll('.table-actions');
          if (!actionContainers.length) {
            return;
          }

          actionContainers.forEach(container => {
            const toggle = container.querySelector('.actions-toggle');
            const list = container.querySelector('.table-actions-list');

            if (!toggle || !list) {
              return;
            }

            list.setAttribute('aria-hidden', 'true');
            toggle.setAttribute('aria-expanded', 'false');

            const focusFirstMenuItem = () => {
              const firstItem = list.querySelector('[role="menuitem"]:not([disabled])');
              if (firstItem instanceof HTMLElement) {
                firstItem.focus();
              }
            };

            toggle.addEventListener('click', event => {
              event.preventDefault();
              event.stopPropagation();

              const isOpen = container.classList.contains('open');
              if (isOpen) {
                container.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
                list.setAttribute('aria-hidden', 'true');
              } else {
                closeActionMenus();
                container.classList.add('open');
                toggle.setAttribute('aria-expanded', 'true');
                list.setAttribute('aria-hidden', 'false');
              }
            });

            toggle.addEventListener('keydown', event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggle.click();
                setTimeout(() => {
                  if (container.classList.contains('open')) {
                    focusFirstMenuItem();
                  }
                }, 0);
              } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (!container.classList.contains('open')) {
                  closeActionMenus();
                  container.classList.add('open');
                  toggle.setAttribute('aria-expanded', 'true');
                  list.setAttribute('aria-hidden', 'false');
                }
                focusFirstMenuItem();
              }
            });

            list.addEventListener('click', event => {
              event.stopPropagation();
              setTimeout(() => closeActionMenus(), 0);
            });

            list.addEventListener('keydown', event => {
              if (event.key === 'Escape') {
                event.preventDefault();
                closeActionMenus();
                toggle.focus();
              }
            });
          });

          if (!actionMenusEventsBound) {
            actionMenusEventsBound = true;

            window.addEventListener('resize', () => closeActionMenus());
            document.addEventListener('click', () => closeActionMenus());
            document.addEventListener('keydown', event => {
              if (event.key === 'Escape') {
                const openToggle = document.querySelector('.table-actions.open .actions-toggle');
                closeActionMenus();
                if (openToggle instanceof HTMLElement) {
                  openToggle.focus();
                }
              }
            });
          }
        }

        function closeActionMenus(excluded) {
          document.querySelectorAll('.table-actions.open').forEach(container => {
            if (excluded && container === excluded) {
              return;
            }

            container.classList.remove('open');
            const toggle = container.querySelector('.actions-toggle');
            const list = container.querySelector('.table-actions-list');
            if (toggle) {
              toggle.setAttribute('aria-expanded', 'false');
            }
            if (list) {
              list.setAttribute('aria-hidden', 'true');
            }
          });
        }

        function setApprovalStatusLabel(volunteerId, isApproved) {
          const statusLabel = document.querySelector('.approval-status[data-volunteer-id="' + volunteerId + '"]');
          if (!statusLabel) {
            return;
          }

          statusLabel.textContent = isApproved ? 'Enabled' : 'Disabled';
          statusLabel.classList.toggle('approved', isApproved);
          statusLabel.classList.toggle('pending', !isApproved);
        }

        function initializeVolunteerSearch() {
          const searchInput = document.getElementById('volunteerSearch');
          const table = document.querySelector('.table');
          if (!searchInput || !table) {
            return;
          }

          const allRows = Array.from(table.querySelectorAll('tbody tr'))
            .filter(row => !row.classList.contains('no-results-row') && !row.classList.contains('no-data-row'));
          const noResultsRow = table.querySelector('.no-results-row');
          const countEl = document.getElementById('volunteerSearchCount');
          const totalEl = document.getElementById('volunteerSearchTotal');
          const resetButton = document.getElementById('volunteerSearchReset');
          const totalCount = allRows.length;

          if (totalEl) {
            totalEl.textContent = String(totalCount);
          }

          const normalizeSearchValue = rawValue => {
            if (!rawValue) {
              return '';
            }
            let normalized = String(rawValue);
            try {
              normalized = normalized.normalize('NFD');
            } catch (_error) {
              // normalize may be unavailable - ignore and continue
            }
            normalized = normalized.replace(/[\u0300-\u036f]/g, '');
            return normalized
              .toLowerCase()
              .replace(/\s+/g, ' ')
              .trim();
          };

          const applyFilter = () => {
            const query = normalizeSearchValue(searchInput.value);
            let visibleCount = 0;

            closeActionMenus();

            allRows.forEach(row => {
              const attributeTokens = row.getAttribute('data-search') || '';
              const haystack = attributeTokens || normalizeSearchValue(row.textContent || '');
              const matches = haystack.includes(query);
              row.style.display = matches ? '' : 'none';
              if (matches) {
                visibleCount += 1;
              }
            });

            if (countEl) {
              countEl.textContent = String(visibleCount);
            }

            if (noResultsRow) {
              const shouldShow = totalCount > 0 && query !== '' && visibleCount === 0;
              noResultsRow.style.display = shouldShow ? '' : 'none';
            }
          };

          searchInput.addEventListener('input', applyFilter);
          searchInput.addEventListener('search', applyFilter);
          searchInput.addEventListener('keydown', event => {
            if (event.key === 'Escape' && searchInput.value) {
              searchInput.value = '';
              applyFilter();
              searchInput.blur();
            }
          });

          if (resetButton) {
            resetButton.addEventListener('click', () => {
              searchInput.value = '';
              applyFilter();
              searchInput.focus();
            });
          }

          applyFilter();
        }
        
        async function copySignupUrl(volunteerId) {
          const input = document.getElementById('url-' + volunteerId);
          if (!input) {
            return;
          }

          const fullUrl = input.getAttribute('data-full-url') || input.value;

          try {
            await navigator.clipboard.writeText(fullUrl);
            if (typeof Toast !== 'undefined') {
              Toast.success('Signup URL copied to clipboard!', 2000);
            }
          } catch (_error) {
            input.select();
            document.execCommand('copy');
            if (typeof Toast !== 'undefined') {
              Toast.success('Signup URL copied to clipboard!', 2000);
            }
          }
        }

        function openSignupUrl(volunteerId) {
          const input = document.getElementById('url-' + volunteerId);
          if (!input) {
            return;
          }

          const fullUrl = input.getAttribute('data-full-url') || input.value;
          globalThis.open(fullUrl, '_blank');
        }

        // Toggle approval status
        async function toggleApproval(volunteerId, approved, volunteerName) {
          try {
            // If disabling, check for outstanding shifts first
            if (!approved) {
              const shiftsResponse = await fetch(\`/admin/api/volunteers/\${volunteerId}/shifts/simple\`, {
                credentials: 'include'
              });
              
              if (shiftsResponse.ok) {
                const shifts = await shiftsResponse.json();
                if (shifts.length > 0) {
                  // Show modal with shift details
                  const shiftsList = shifts.map(shift => {
                    // Use date string directly without timezone conversion
                    const shiftDate = shift.date;
                    
                    return \`<li>• \${shift.show_name} - \${shift.role} (\${shiftDate} at \${shift.time})</li>\`;
                  }).join('');
                  
                  const modalContent = \`
                    <p><strong>\${volunteerName}</strong> has \${shifts.length} outstanding shift\${shifts.length > 1 ? 's' : ''}:</p>
                    <ul style="margin: 1rem 0; padding-left: 1.5rem;">\${shiftsList}</ul>
                    <p>What would you like to do with their shifts?</p>
                  \`;
                  
                  // Show confirmation modal with shift options
                  if (typeof Modal !== 'undefined') {
                    Modal.showModal(\`disable-volunteer-\${volunteerId}\`, {
                      title: 'Disable Login Access',
                      body: modalContent,
                      buttons: [
                        {
                          text: 'Cancel',
                          className: 'modal-btn-outline',
                          action: 'cancel',
                          handler: () => {
                            // User cancelled - revert the toggle
                            const checkbox = document.querySelector('input[onchange*="toggleApproval(' + volunteerId + '"]');
                            if (checkbox) {
                              checkbox.checked = true;
                            }
                            setApprovalStatusLabel(volunteerId, true);
                          }
                        },
                        {
                          text: 'Keep Shifts',
                          className: 'modal-btn-secondary',
                          action: 'keep-shifts',
                          handler: async () => {
                            // Disable but keep shifts
                            await updateApprovalStatus(volunteerId, approved, volunteerName, false);
                            // Close the modal
                            Modal.closeModal(\`disable-volunteer-\${volunteerId}\`);
                          }
                        },
                        {
                          text: 'Remove Shifts',
                          className: 'modal-btn-danger',
                          action: 'remove-shifts',
                          handler: async () => {
                            // Disable and remove shifts
                            await proceedWithDisabling(volunteerId, approved, volunteerName, shifts);
                            // Close the modal
                            Modal.closeModal(\`disable-volunteer-\${volunteerId}\`);
                          }
                        }
                      ]
                    });
                  } else {
                    // Fallback to browser confirm if Modal is not available
                    const shiftSummary = shifts.map(shift => \`\${shift.show_name} - \${shift.role}\`).join(', ');
                    const keepShiftsMessage = \`\${volunteerName} has \${shifts.length} outstanding shift(s): \${shiftSummary}.\n\nChoose an option:\n- OK: Keep shifts (disable login only)\n- Cancel: Remove shifts and generate PDF\`;
                    if (confirm(keepShiftsMessage)) {
                      // Keep shifts - just disable login
                      await updateApprovalStatus(volunteerId, approved, volunteerName, false);
                    } else {
                      // Remove shifts
                      const confirmRemoval = confirm('This will remove them from all shifts and generate a PDF report. Continue?');
                      if (confirmRemoval) {
                        await proceedWithDisabling(volunteerId, approved, volunteerName, shifts);
                      } else {
                        // User cancelled completely - revert the toggle
                        const checkbox = document.querySelector('input[onchange*="toggleApproval(' + volunteerId + '"]');
                        if (checkbox) {
                          checkbox.checked = true;
                        }
                        setApprovalStatusLabel(volunteerId, true);
                      }
                    }
                  }
                  return; // Exit early to wait for modal response
                }
              }
            }
            
            // No shifts or enabling - proceed directly
            await updateApprovalStatus(volunteerId, approved, volunteerName);
          } catch (error) {
            console.error('Error updating approval:', error);
            revertToggle(volunteerId, approved);
            
            if (typeof Toast !== 'undefined') {
              Toast.error('Error updating approval status');
            } else {
              alert('Error updating approval status');
            }
          }
        }
        
        // Helper function to proceed with disabling after confirmation
        async function proceedWithDisabling(volunteerId, approved, volunteerName, shifts) {
          try {
            // Generate and download PDF before proceeding
            await generateShiftRemovalPDF(volunteerId, volunteerName, shifts);
            
            // Update approval status and remove shifts
            await updateApprovalStatus(volunteerId, approved, volunteerName, true);
          } catch (error) {
            console.error('Error disabling volunteer:', error);
            revertToggle(volunteerId, approved);
            
            if (typeof Toast !== 'undefined') {
              Toast.error('Error disabling volunteer access');
            } else {
              alert('Error disabling volunteer access');
            }
          }
        }
        
        // Helper function to update approval status
        async function updateApprovalStatus(volunteerId, approved, volunteerName, removeShifts = true) {
          const response = await fetch(\`/admin/api/volunteers/\${volunteerId}/approval\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approved, removeShifts }),
            credentials: 'include'
          });
          
          if (response.ok) {
            setApprovalStatusLabel(volunteerId, approved);
            
            // Show success message
            if (typeof Toast !== 'undefined') {
              if (approved) {
                // For enabling, show a brief toast that disappears
                Toast.success(\`\${volunteerName} enabled\`);
              } else {
                // For disabling, show a toast notification
                const actionText = removeShifts ? 'disabled and removed from shifts' : 'disabled (shifts kept)';
                Toast.success(\`\${volunteerName} \${actionText}\`);
              }
            }
          } else {
            // Revert the toggle on error
            revertToggle(volunteerId, approved);
            
            if (typeof Toast !== 'undefined') {
              Toast.error('Failed to update approval status');
            } else {
              alert('Failed to update approval status');
            }
          }
        }
        
        // Helper function to revert toggle state
        function revertToggle(volunteerId, approved) {
          const checkbox = document.querySelector('input[onchange*="toggleApproval(' + volunteerId + '"]');
          if (checkbox) {
            checkbox.checked = !approved;
          }
          setApprovalStatusLabel(volunteerId, !approved);
        }
        
        // Generate PDF for removed shifts
        async function generateShiftRemovalPDF(volunteerId, volunteerName, shifts) {
          try {
            const response = await fetch(\`/admin/api/volunteers/\${volunteerId}/shifts/removal-pdf\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ shifts }),
              credentials: 'include'
            });
            
            if (response.ok) {
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = \`shift-removal-\${volunteerName.replace(/[^a-zA-Z0-9]/g, '-')}-\${new Date().toISOString().split('T')[0]}.txt\`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            }
          } catch (error) {
            console.error('Error generating PDF:', error);
            // Continue anyway - the PDF is nice to have but not critical
          }
        }
        
        // Send schedule PDF via email
        async function sendSchedulePDF(volunteerId, volunteerName, volunteerEmail) {
          console.log('sendSchedulePDF called with:', { volunteerId, volunteerName, volunteerEmail });
          
          if (!volunteerEmail) {
            if (typeof Modal !== 'undefined') {
              Modal.error('Cannot Send PDF', 'This volunteer does not have an email address on file.');
            } else {
              alert('Cannot send PDF: No email address on file');
            }
            return;
          }
          
          // Generate the confirmation message fresh each time
          console.log('Generating modal with:', { volunteerName, volunteerEmail });
          
          if (typeof Modal !== 'undefined') {
            // Generate unique modal ID to prevent caching issues
            const uniqueModalId = \`send-pdf-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
            const modalTitle = 'Send Schedule PDF';
            const modalMessage = \`Send \${volunteerName}'s schedule PDF to \${volunteerEmail}?\`;
            
            console.log('Modal message will be:', modalMessage);
            console.log('Using modal ID:', uniqueModalId);
            
            // Use showModal with unique ID instead of confirm method
            Modal.showModal(uniqueModalId, {
              title: modalTitle,
              body: \`<p>\${modalMessage}</p>\`,
              buttons: [
                {
                  text: 'Cancel',
                  className: 'modal-btn-outline',
                  action: 'cancel',
                  handler: () => {
                    console.log('Send PDF cancelled');
                  }
                },
                {
                  text: 'Send PDF',
                  className: 'modal-btn-primary',
                  action: 'confirm',
                  handler: async () => {
                    // Capture the variables at modal confirmation time to ensure they're current
                    const currentVolunteerId = volunteerId;
                    const currentVolunteerEmail = volunteerEmail;
                    const currentVolunteerName = volunteerName;
                    
                    try {
                      console.log('Modal confirmed, sending to:', { 
                        currentVolunteerId, 
                        currentVolunteerName, 
                        currentVolunteerEmail,
                        originalArgs: { volunteerId, volunteerName, volunteerEmail }
                      });
                      
                      const response = await fetch(getAPIURL(\`/admin/api/volunteers/\${currentVolunteerId}/email-schedule-pdf\`), {
                        method: 'POST',
                        credentials: 'include'
                      });
                      
                      if (response.ok) {
                        const result = await response.json();
                        console.log('PDF send response:', result);
                        const message = result.hasShifts 
                          ? \`Schedule PDF sent to \${currentVolunteerEmail}! They have \${result.shiftsCount} upcoming shifts.\`
                          : \`Schedule PDF sent to \${currentVolunteerEmail}! They currently have no assigned shifts for future dates.\`;
                          
                        Toast.success(message, 4000);
                      } else {
                        const error = await response.json();
                        Toast.error('Failed to send PDF: ' + (error.error || 'Unknown error'));
                      }
                    } catch (error) {
                      console.error('Error sending PDF:', error);
                      Toast.error('Error sending schedule PDF');
                    }
                  }
                }
              ]
            });
          } else {
            const confirmMessage = \`Send \${volunteerName}'s schedule PDF to \${volunteerEmail}?\`;
            if (confirm(confirmMessage)) {
              try {
                const response = await fetch(getAPIURL(\`/admin/api/volunteers/\${volunteerId}/email-schedule-pdf\`), {
                  method: 'POST',
                  credentials: 'include'
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('PDF send response (fallback):', result);
                  const message = result.hasShifts 
                    ? \`Schedule PDF sent to \${volunteerEmail}! They have \${result.shiftsCount} upcoming shifts.\`
                    : \`Schedule PDF sent to \${volunteerEmail}! They currently have no assigned shifts for future dates.\`;
                    
                  if (typeof Toast !== 'undefined') {
                    Toast.success(message, 4000);
                  } else {
                    alert(message);
                  }
                } else {
                  const error = await response.json();
                  if (typeof Toast !== 'undefined') {
                    Toast.error('Failed to send PDF: ' + (error.error || 'Unknown error'));
                  } else {
                    alert('Failed to send PDF: ' + (error.error || 'Unknown error'));
                  }
                }
              } catch (error) {
                console.error('Error sending PDF:', error);
                if (typeof Toast !== 'undefined') {
                  Toast.error('Error sending schedule PDF');
                } else {
                  alert('Error sending schedule PDF');
                }
              }
            }
          }
        }
        
        // Send Show Week email via email
        async function sendShowWeekEmail(volunteerId, volunteerName, volunteerEmail) {
          console.log('sendShowWeekEmail called with:', { volunteerId, volunteerName, volunteerEmail });
          
          if (!volunteerEmail) {
            if (typeof Modal !== 'undefined') {
              Modal.error('Cannot Send Show Week Email', 'This volunteer does not have an email address on file.');
            } else {
              alert('Cannot send Show Week email: No email address on file');
            }
            return;
          }
          
          // Generate the confirmation message fresh each time
          console.log('Generating modal with:', { volunteerName, volunteerEmail });
          
          if (typeof Modal !== 'undefined') {
            // Generate unique modal ID to prevent caching issues
            const uniqueModalId = \`send-show-week-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
            const modalTitle = "Send It's Show Week Email";
            const modalMessage = \`Send "It's Show Week" email to \${volunteerName} at \${volunteerEmail}?\`;
            
            console.log('Modal message will be:', modalMessage);
            console.log('Using modal ID:', uniqueModalId);
            
            // Use showModal with unique ID instead of confirm method
            Modal.showModal(uniqueModalId, {
              title: modalTitle,
              body: \`<p>\${modalMessage}</p>\`,
              buttons: [
                {
                  text: 'Cancel',
                  className: 'modal-btn-outline',
                  action: 'cancel',
                  handler: () => {
                    console.log('Show Week email cancelled');
                  }
                },
                {
                  text: 'Send Email',
                  className: 'modal-btn-primary',
                  action: 'send',
                  handler: async () => {
                    // Close the modal immediately so user can continue working
                    Modal.closeModal(uniqueModalId);
                    
                    // Capture the variables at modal confirmation time to ensure they're current
                    const currentVolunteerId = volunteerId;
                    const currentVolunteerEmail = volunteerEmail;
                    const currentVolunteerName = volunteerName;
                    
                    try {
                      console.log('Modal confirmed, sending to:', { 
                        currentVolunteerId, 
                        currentVolunteerName, 
                        currentVolunteerEmail,
                        originalArgs: { volunteerId, volunteerName, volunteerEmail }
                      });
                      
                      const response = await fetch(getAPIURL(\`/admin/api/volunteers/\${currentVolunteerId}/email-show-week\`), {
                        method: 'POST',
                        credentials: 'include'
                      });
                      
                      if (response.ok) {
                        const result = await response.json();
                        console.log('Show Week email send response:', result);
                        const message = result.hasShifts 
                          ? \`Show Week email sent to \${currentVolunteerEmail}! They have \${result.shiftsCount} upcoming shifts.\`
                          : \`Show Week email sent to \${currentVolunteerEmail}! They currently have no assigned shifts for future dates.\`;
                          
                        Toast.success(message, 4000);
                      } else {
                        const error = await response.json();
                        Toast.error('Failed to send Show Week email: ' + (error.error || 'Unknown error'));
                      }
                    } catch (error) {
                      console.error('Error sending Show Week email:', error);
                      Toast.error('Error sending Show Week email');
                    }
                  }
                }
              ]
            });
          } else {
            const confirmMessage = \`Send "It's Show Week" email to \${volunteerName} at \${volunteerEmail}?\`;
            if (confirm(confirmMessage)) {
              try {
                const response = await fetch(getAPIURL(\`/admin/api/volunteers/\${volunteerId}/email-show-week\`), {
                  method: 'POST',
                  credentials: 'include'
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('Show Week email send response (fallback):', result);
                  const message = result.hasShifts 
                    ? \`Show Week email sent to \${volunteerEmail}! They have \${result.shiftsCount} upcoming shifts.\`
                    : \`Show Week email sent to \${volunteerEmail}! They currently have no assigned shifts for future dates.\`;
                    
                  if (typeof Toast !== 'undefined') {
                    Toast.success(message, 4000);
                  } else {
                    alert(message);
                  }
                } else {
                  const error = await response.json();
                  if (typeof Toast !== 'undefined') {
                    Toast.error('Failed to send Show Week email: ' + (error.error || 'Unknown error'));
                  } else {
                    alert('Failed to send Show Week email: ' + (error.error || 'Unknown error'));
                  }
                }
              } catch (error) {
                console.error('Error sending Show Week email:', error);
                if (typeof Toast !== 'undefined') {
                  Toast.error('Error sending Show Week email');
                } else {
                  alert('Error sending Show Week email');
                }
              }
            }
          }
        }
        
        // Send Last Minute Shifts email via email
        async function sendLastMinuteShiftsEmail(volunteerId, volunteerName, volunteerEmail) {
          console.log('sendLastMinuteShiftsEmail called with:', { volunteerId, volunteerName, volunteerEmail });
          
          if (!volunteerEmail) {
            if (typeof Modal !== 'undefined') {
              Modal.error('Cannot Send Last Minute Email', 'This volunteer does not have an email address on file.');
            } else {
              alert('Cannot send Last Minute Shifts email: No email address on file');
            }
            return;
          }
          
          // Generate the confirmation message fresh each time
          console.log('Generating modal with:', { volunteerName, volunteerEmail });
          
          if (typeof Modal !== 'undefined') {
            // Generate unique modal ID to prevent caching issues
            const uniqueModalId = \`send-last-minute-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
            const modalTitle = "Send Last Minute Shifts Email";
            const modalMessage = \`Send "Last Minute Shifts" email to \${volunteerName} at \${volunteerEmail}?\`;
            
            console.log('Modal message will be:', modalMessage);
            console.log('Using modal ID:', uniqueModalId);
            
            // Use showModal with unique ID instead of confirm method
            Modal.showModal(uniqueModalId, {
              title: modalTitle,
              body: \`<p>\${modalMessage}</p><p><small>This will include a PDF with the next 10 outstanding shifts that need volunteers.</small></p>\`,
              buttons: [
                {
                  text: 'Cancel',
                  className: 'modal-btn-outline',
                  action: 'cancel',
                  handler: () => {
                    console.log('Last Minute Shifts email cancelled');
                  }
                },
                {
                  text: 'Send Email',
                  className: 'modal-btn-primary',
                  action: 'send',
                  handler: async () => {
                    // Close the modal immediately so user can continue working
                    Modal.closeModal(uniqueModalId);
                    
                    // Capture the variables at modal confirmation time to ensure they're current
                    const currentVolunteerId = volunteerId;
                    const currentVolunteerEmail = volunteerEmail;
                    const currentVolunteerName = volunteerName;
                    
                    try {
                      console.log('Modal confirmed, sending to:', { 
                        currentVolunteerId, 
                        currentVolunteerName, 
                        currentVolunteerEmail,
                        originalArgs: { volunteerId, volunteerName, volunteerEmail }
                      });
                      
                      const response = await fetch(getAPIURL(\`/admin/api/volunteers/\${currentVolunteerId}/email-last-minute-shifts\`), {
                        method: 'POST',
                        credentials: 'include'
                      });
                      
                      if (response.ok) {
                        const result = await response.json();
                        console.log('Last Minute Shifts email send response:', result);
                        const message = result.hasShifts 
                          ? \`Last Minute Shifts email sent to \${currentVolunteerEmail}! There are \${result.shiftsCount} outstanding shifts.\`
                          : \`Last Minute Shifts email sent to \${currentVolunteerEmail}! All shifts are currently filled.\`;
                          
                        Toast.success(message, 4000);
                      } else {
                        const error = await response.json();
                        Toast.error('Failed to send Last Minute Shifts email: ' + (error.error || 'Unknown error'));
                      }
                    } catch (error) {
                      console.error('Error sending Last Minute Shifts email:', error);
                      Toast.error('Error sending Last Minute Shifts email');
                    }
                  }
                }
              ]
            });
          } else {
            const confirmMessage = \`Send "Last Minute Shifts" email to \${volunteerName} at \${volunteerEmail}?\`;
            if (confirm(confirmMessage)) {
              try {
                const response = await fetch(getAPIURL(\`/admin/api/volunteers/\${volunteerId}/email-last-minute-shifts\`), {
                  method: 'POST',
                  credentials: 'include'
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('Last Minute Shifts email send response (fallback):', result);
                  const message = result.hasShifts 
                    ? \`Last Minute Shifts email sent to \${volunteerEmail}! There are \${result.shiftsCount} outstanding shifts.\`
                    : \`Last Minute Shifts email sent to \${volunteerEmail}! All shifts are currently filled.\`;
                    
                  if (typeof Toast !== 'undefined') {
                    Toast.success(message, 4000);
                  } else {
                    alert(message);
                  }
                } else {
                  const error = await response.json();
                  if (typeof Toast !== 'undefined') {
                    Toast.error('Failed to send Last Minute Shifts email: ' + (error.error || 'Unknown error'));
                  } else {
                    alert('Failed to send Last Minute Shifts email: ' + (error.error || 'Unknown error'));
                  }
                }
              } catch (error) {
                console.error('Error sending Last Minute Shifts email:', error);
                if (typeof Toast !== 'undefined') {
                  Toast.error('Error sending Last Minute Shifts email');
                } else {
                  alert('Error sending Last Minute Shifts email');
                }
              }
            }
          }
        }
        
        // Show email history for a volunteer
        async function showEmailHistory(volunteerId, volunteerName) {
          console.log('Loading email history for:', { volunteerId, volunteerName });
          
          try {
            const response = await fetch(getAPIURL(\`/admin/api/volunteers/\${volunteerId}/emails\`), {
              method: 'GET',
              credentials: 'include'
            });
            
            if (response.ok) {
              const result = await response.json();
              const emails = result.emails || [];
              
              // Create modal content
              let modalContent = \`
                <div class="email-history-modal">
                  <h3>Email History for \${escapeHtml(volunteerName)}</h3>
                  <div class="email-history-list">
              \`;
              
              if (emails.length === 0) {
                modalContent += \`
                  <div class="no-emails">
                    <p style="color: #666; text-align: center; padding: 2rem;">
                      📧 No emails have been sent to this volunteer yet.
                    </p>
                  </div>
                \`;
              } else {
                emails.forEach(email => {
                  const sentDate = new Date(email.sent_at).toLocaleDateString('en-AU', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  
                  const typeIcon = {
                    'volunteer_login': '🔑',
                    'volunteer_schedule': '📅',
                    'show_week': '🎭',
                    'last_minute_shifts': '🚨'
                  }[email.email_type] || '📧';
                  
                  const statusIcon = {
                    'sent': '✅',
                    'delivered': '✅',
                    'failed': '❌',
                    'simulated': '🧪'
                  }[email.delivery_status] || '❓';
                  
                  modalContent += \`
                    <div class="email-entry">
                      <div class="email-header">
                        <span class="email-type">\${typeIcon} \${email.email_type.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}</span>
                        <span class="email-date">\${sentDate}</span>
                        <span class="email-status">\${statusIcon} \${email.delivery_status}</span>
                      </div>
                      <div class="email-subject">\${escapeHtml(email.subject)}</div>
                      <div class="email-to">To: \${escapeHtml(email.to_email)}</div>
                      \${email.attachment_count > 0 ? \`<div class="email-attachments">📎 \${email.attachment_count} attachment(s)</div>\` : ''}
                    </div>
                  \`;
                });
              }
              
              modalContent += \`
                  </div>
                </div>
                <style>
                  .email-history-modal {
                    max-width: 600px;
                    max-height: 500px;
                    overflow-y: auto;
                  }
                  .email-history-list {
                    margin-top: 1rem;
                  }
                  .email-entry {
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    padding: 1rem;
                    margin-bottom: 0.5rem;
                    background: #f9f9f9;
                  }
                  .email-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                  }
                  .email-type {
                    font-weight: bold;
                    color: #007bff;
                  }
                  .email-date {
                    font-size: 0.9rem;
                    color: #666;
                  }
                  .email-status {
                    font-size: 0.9rem;
                  }
                  .email-subject {
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                  }
                  .email-to {
                    font-size: 0.9rem;
                    color: #666;
                  }
                  .email-attachments {
                    font-size: 0.9rem;
                    color: #007bff;
                    margin-top: 0.5rem;
                  }
                  .no-emails {
                    text-align: center;
                    padding: 2rem;
                  }
                </style>
              \`;
              
              if (typeof Modal !== 'undefined') {
                const uniqueModalId = \`email-history-\${Date.now()}\`;
                Modal.showModal(uniqueModalId, {
                  title: \`Email History - \${volunteerName}\`,
                  body: modalContent,
                  buttons: [
                    {
                      text: 'Close',
                      className: 'modal-btn-outline',
                      action: 'cancel'
                    }
                  ]
                });
              } else {
                // Fallback for browsers without modal support
                const newWindow = window.open('', '_blank', 'width=700,height=600,scrollbars=yes');
                newWindow.document.write(\`
                  <html>
                    <head>
                      <title>Email History - \${escapeHtml(volunteerName)}</title>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .email-entry { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
                        .email-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
                        .email-type { font-weight: bold; color: #007bff; }
                        .email-date { color: #666; }
                        .email-subject { font-weight: bold; margin-bottom: 5px; }
                        .email-to { color: #666; }
                        .email-attachments { color: #007bff; margin-top: 5px; }
                      </style>
                    </head>
                    <body>
                      \${modalContent}
                    </body>
                  </html>
                \`);
                newWindow.document.close();
              }
              
            } else {
              const error = await response.json();
              if (typeof Toast !== 'undefined') {
                Toast.error('Failed to load email history: ' + (error.error || 'Unknown error'));
              } else {
                alert('Failed to load email history: ' + (error.error || 'Unknown error'));
              }
            }
          } catch (error) {
            console.error('Error loading email history:', error);
            if (typeof Toast !== 'undefined') {
              Toast.error('Error loading email history');
            } else {
              alert('Error loading email history');
            }
          }
        }
        
        // HTML escape function
        function escapeHtml(text) {
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }
      </script>
    </body>
    </html>
  `;
}
