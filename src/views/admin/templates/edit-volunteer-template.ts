import {
  getAdminNavigation,
  getAdminScripts,
  getAdminStyles,
} from "../components/navigation.ts";

export interface Volunteer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
}

export interface VolunteerShift {
  id: number;
  show_id: number;
  show_name: string;
  role: string;
  start_time: string;
  end_time: string;
  arrive_time: string | null;
  depart_time: string | null;
  performance_id?: number;
}

export interface EditVolunteerPageData {
  volunteer: Volunteer;
  assignedShifts: VolunteerShift[];
  pastShifts: VolunteerShift[];
  notes: VolunteerNote[];
}

export interface VolunteerNote {
  id: number;
  note: string;
  created_by_name: string | null;
  created_by_email: string | null;
  created_at: string;
}

function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderUpcomingShift(shift: VolunteerShift): string {
  return `
    <article class="profile-shift-card">
      <div class="profile-shift-main">
        <p class="profile-shift-role">${escapeHtml(shift.role)}</p>
        <p class="profile-shift-production">${escapeHtml(shift.show_name)}</p>
      </div>
      <dl class="profile-shift-times">
        <div>
          <dt>Starts</dt>
          <dd>${escapeHtml(shift.start_time)}</dd>
        </div>
        <div>
          <dt>Ends</dt>
          <dd>${escapeHtml(shift.end_time)}</dd>
        </div>
      </dl>
      <div class="profile-shift-actions">
        <button class="btn btn-sm btn-danger"
                data-shift-id="${shift.id}"
                data-role="${escapeHtml(shift.role)}"
                data-show-name="${escapeHtml(shift.show_name)}"
                onclick="removeShift(this)">
          Remove
        </button>
        <button class="btn btn-sm btn-warning"
                data-shift-id="${shift.id}"
                data-role="${escapeHtml(shift.role)}"
                data-show-name="${escapeHtml(shift.show_name)}"
                onclick="swapShift(this)">
          Swap
        </button>
      </div>
    </article>
  `;
}

function renderPastShiftsTable(pastShifts: VolunteerShift[]): string {
  if (pastShifts.length === 0) {
    return `<div class="profile-empty">No past shifts recorded.</div>`;
  }

  return `
    <div class="profile-table-wrap">
      <table class="profile-table">
        <thead>
          <tr>
            <th>Production</th>
            <th>Role</th>
            <th>Start</th>
            <th>End</th>
          </tr>
        </thead>
        <tbody>
          ${
    pastShifts
      .map((shift) => `
              <tr>
                <td>${escapeHtml(shift.show_name)}</td>
                <td>${escapeHtml(shift.role)}</td>
                <td>${escapeHtml(shift.start_time)}</td>
                <td>${escapeHtml(shift.end_time)}</td>
              </tr>
            `)
      .join("")
  }
        </tbody>
      </table>
    </div>
  `;
}

function renderInternalNotes(notes: VolunteerNote[]): string {
  if (notes.length === 0) {
    return `<div class="profile-empty">No internal notes recorded.</div>`;
  }

  return `
    <div class="profile-note-list">
      ${
    notes.map((note) => {
      const byline = note.created_by_name || note.created_by_email
        ? `Added by ${
          escapeHtml(note.created_by_name || note.created_by_email)
        }`
        : "Added by system";
      return `
          <article class="profile-note">
            <p>${escapeHtml(note.note)}</p>
            <span>${byline} on ${escapeHtml(note.created_at)}</span>
          </article>
        `;
    }).join("")
  }
    </div>
  `;
}

function renderVolunteerStatusCard(volunteer: Volunteer, isInactive: boolean) {
  const volunteerName = escapeHtml(volunteer.name);
  return `
    <div class="profile-card status-card">
      <div>
        <h3>Volunteer status</h3>
        <p>${
    isInactive
      ? "This volunteer is inactive. They will not receive future shift requests."
      : "This volunteer is active and can receive future shift requests."
  }</p>
      </div>
      <button type="button"
              class="btn ${isInactive ? "btn-primary" : "btn-danger"}"
              data-volunteer-id="${volunteer.id}"
              data-volunteer-name="${volunteerName}"
              data-next-status="${isInactive ? "active" : "inactive"}"
              onclick="toggleVolunteerStatusFromProfile(this)">
        ${isInactive ? "Mark active" : "Mark inactive"}
      </button>
    </div>
  `;
}

function renderNotesCard(notes: VolunteerNote[]): string {
  return `
    <div class="profile-card notes-card">
      <div class="profile-section-heading compact">
        <h2>Internal notes</h2>
        <p>Internal note history for this volunteer.</p>
      </div>
      <form id="volunteerNoteForm" class="note-form">
        <label for="volunteerNote">Add a note</label>
        <textarea id="volunteerNote" name="note" rows="3" required></textarea>
        <div class="profile-actions-row">
          <button type="submit" class="btn btn-primary">Add note</button>
          <span id="noteSaveStatus" class="profile-status" role="status"></span>
        </div>
      </form>
      ${renderInternalNotes(notes)}
    </div>
  `;
}

function renderUnavailablePerformancesSection(): string {
  return `
    <div class="profile-subsection unavailable-shifts-section">
      <h3>Unavailable performances</h3>
      <p class="profile-subsection-copy">Performances this volunteer cannot work.</p>
      <div class="availability-controls">
        <div class="form-group">
          <label for="unavailablePerformanceSelect">Performance</label>
          <select id="unavailablePerformanceSelect"></select>
        </div>
        <button type="button" class="btn btn-secondary" id="addUnavailablePerformanceBtn">Add</button>
        <button type="button" class="btn btn-primary" id="saveUnavailablePerformancesBtn">Save</button>
      </div>
      <div id="unavailablePerformancesList" class="unavailable-performances-list"></div>
      <div id="unavailablePerformancesStatus" class="availability-status"></div>
    </div>
  `;
}

export function renderEditVolunteerTemplate(
  data: EditVolunteerPageData,
): string {
  const { volunteer, assignedShifts, pastShifts, notes } = data;
  const volunteerName = escapeHtml(volunteer.name);
  const volunteerEmail = volunteer.email
    ? escapeHtml(volunteer.email)
    : "No email";
  const volunteerPhone = volunteer.phone
    ? escapeHtml(volunteer.phone)
    : "No phone";
  const signupUrl = `/volunteer/signup/${volunteer.id}`;
  const isInactive = volunteer.status === "inactive";
  const volunteerIdJson = JSON.stringify(volunteer.id);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${volunteerName} Profile - Rep Volunteers</title>
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}
      <link rel="stylesheet" href="/src/views/admin/edit-volunteer.css">
    </head>
    <body>
      ${getAdminNavigation("volunteers")}

      <div class="main-content">
        <div class="profile-back-link">
          <a href="/admin/volunteers">Back to participants</a>
        </div>

        <header class="profile-hero">
          <div>
            <p class="profile-eyebrow">Volunteer profile</p>
            <h1 class="page-title">${volunteerName}</h1>
            <div class="profile-summary">
              <span>${volunteerEmail}</span>
              <span>${volunteerPhone}</span>
              <span class="profile-status-pill ${
    isInactive ? "inactive" : "active"
  }">${isInactive ? "Inactive" : "Active"}</span>
              <span>ID ${volunteer.id}</span>
            </div>
          </div>
          <div class="profile-stat-row" aria-label="Shift summary">
            <div class="profile-stat">
              <strong>${assignedShifts.length}</strong>
              <span>Upcoming shifts</span>
            </div>
            <div class="profile-stat">
              <strong>${pastShifts.length}</strong>
              <span>Past shifts</span>
            </div>
          </div>
        </header>

        <nav class="profile-tabs" aria-label="Volunteer profile sections">
          <button type="button" class="profile-tab active" data-tab-target="details">Details</button>
          <button type="button" class="profile-tab" data-tab-target="shifts">Shifts</button>
          <button type="button" class="profile-tab" data-tab-target="emails">Emails</button>
          <button type="button" class="profile-tab" data-tab-target="links">Links and delete</button>
        </nav>

        <section class="profile-panel active" id="profile-tab-details">
          <div class="profile-section-heading">
            <h2>Details</h2>
            <p>Update the volunteer's name and contact details.</p>
          </div>

          <form id="volunteerForm" class="profile-card profile-form">
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" name="name" value="${volunteerName}" required>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="email">Email <span>(optional)</span></label>
                <input type="email" id="email" name="email" value="${
    escapeHtml(volunteer.email)
  }">
              </div>

              <div class="form-group">
                <label for="phone">Phone <span>(optional)</span></label>
                <input type="tel" id="phone" name="phone" value="${
    escapeHtml(volunteer.phone)
  }">
              </div>
            </div>

            <div class="profile-actions-row">
              <button type="submit" class="btn btn-primary">Save details</button>
              <span id="profileSaveStatus" class="profile-status" role="status"></span>
            </div>
          </form>

          ${renderVolunteerStatusCard(volunteer, isInactive)}
          ${renderNotesCard(notes)}
        </section>

        <section class="profile-panel" id="profile-tab-shifts">
          <div class="profile-section-heading">
            <h2>Shifts</h2>
            <p>Review upcoming and past shift records for this volunteer.</p>
          </div>

          <div class="profile-subsection">
            <h3>Upcoming shifts</h3>
            <div class="profile-shift-list">
              ${
    assignedShifts.length === 0
      ? '<div class="profile-empty">No upcoming shifts assigned.</div>'
      : assignedShifts.map(renderUpcomingShift).join("")
  }
            </div>
          </div>

          ${renderUnavailablePerformancesSection()}

          <div class="profile-subsection">
            <h3>Past shifts</h3>
            ${renderPastShiftsTable(pastShifts)}
          </div>
        </section>

        <section class="profile-panel" id="profile-tab-emails">
          <div class="profile-section-heading">
            <h2>Emails</h2>
            <p>Emails sent to this volunteer, including PDF attachments.</p>
          </div>

          <div id="emailHistoryContainer" class="profile-card email-history-container">
            <div class="loading-spinner" id="emailHistoryLoading">
              <div class="spinner"></div>
              <span>Loading email history...</span>
            </div>
            <div id="emailHistoryContent" style="display: none;"></div>
            <div id="emailHistoryError" style="display: none;" class="alert alert-warning">
              No emails have been sent to this volunteer yet.
            </div>
          </div>
        </section>

        <section class="profile-panel" id="profile-tab-links">
          <div class="profile-section-heading">
            <h2>Links and delete</h2>
            <p>Use the volunteer's personal signup link.</p>
          </div>

          <div class="profile-card signup-card">
            <div>
              <h3>Portal link</h3>
              <p>This link opens the volunteer's own shift portal.</p>
            </div>
            <input type="hidden" class="signup-url" value="${signupUrl}" readonly id="url-${volunteer.id}" data-full-url="">
            <div class="signup-url-display">${escapeHtml(signupUrl)}</div>
            <div class="profile-actions-row">
              <button type="button" class="btn btn-secondary" onclick="copyProfileSignupUrl('${volunteer.id}')" id="copy-btn-${volunteer.id}">Copy portal link</button>
              <button type="button" class="btn btn-secondary" onclick="openProfileSignupUrl('${volunteer.id}')" id="open-btn-${volunteer.id}">Open portal link</button>
            </div>
          </div>

        </section>
      </div>

      <div id="emailContentModal" class="modal modal-fullscreen" style="display: none;">
        <div class="modal-content modal-lg">
          <div class="modal-header">
            <h3 id="emailContentTitle">Email details</h3>
            <button type="button" class="close" onclick="closeEmailModal()">&times;</button>
          </div>
          <div class="modal-body" id="emailContentBody"></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeEmailModal()">Close</button>
          </div>
        </div>
      </div>

      <script src="/src/utils/modal.js"></script>
      <script src="/src/utils/timezone-client.js"></script>
      ${getAdminScripts()}
      <script src="/src/views/admin/volunteer-shifts.js"></script>
      <script src="/src/views/admin/edit-volunteer.js" data-volunteer-id="${volunteer.id}" data-volunteer-name="${volunteerName}"></script>
      <script>
        if (typeof initVolunteerShifts === 'function') {
          initVolunteerShifts(${volunteerIdJson}, ${
    JSON.stringify(volunteer.name)
  }, ${JSON.stringify(assignedShifts)});
        }
      </script>
    </body>
    </html>
  `;
}
