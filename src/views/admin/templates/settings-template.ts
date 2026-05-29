import { renderAdminPage } from "../components/layout.ts";
import type { EmailDefaults } from "../../../utils/email-settings.ts";

interface SettingsTemplateOptions {
  isLocalDev: boolean;
  emailDefaults: EmailDefaults;
}

export function renderSettingsTemplate(
  options: SettingsTemplateOptions,
): string {
  const escapeAttribute = (value: string): string =>
    value
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  return renderAdminPage({
    title: "Settings",
    currentPage: "settings",
    head: `
      <style>
        .settings-section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
          overflow: hidden;
        }

        .settings-section-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e9ecef;
          background: #f8f9fa;
        }

        .settings-section-title {
          font-size: 1.5rem;
          color: #333;
          margin: 0;
        }

        .settings-section-content {
          padding: 2rem;
        }

        .maintenance-warning {
          margin: 0 0 1.5rem 0;
          padding: 1rem;
          border-left: 4px solid #dc3545;
          background: #fff5f5;
          color: #742a2a;
          border-radius: 4px;
          line-height: 1.5;
        }

        .maintenance-copy {
          color: #555;
          margin: 0 0 1rem 0;
          line-height: 1.5;
        }

        .maintenance-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .settings-form {
          max-width: 640px;
        }

        .settings-form-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: 1.25rem;
        }

        .settings-status {
          display: none;
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          line-height: 1.45;
        }

        .settings-status.visible {
          display: block;
        }

        .settings-status.success {
          background: #f0fff4;
          border: 1px solid #9ae6b4;
          color: #22543d;
        }

        .settings-status.error {
          background: #fff5f5;
          border: 1px solid #feb2b2;
          color: #742a2a;
        }

        .migration-status {
          display: none;
          width: 100%;
          margin: 1rem 0 0 0;
          padding: 0.875rem 1rem;
          border-radius: 6px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          color: #333;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 0.875rem;
          line-height: 1.45;
        }

        .migration-status.visible {
          display: block;
        }

        .migration-status.success {
          background: #f0fff4;
          border-color: #9ae6b4;
          color: #22543d;
        }

        .migration-status.error {
          background: #fff5f5;
          border-color: #feb2b2;
          color: #742a2a;
        }

        .dev-email-mode {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .dev-email-copy {
          margin: 0;
          color: #555;
          line-height: 1.5;
        }

        .dev-email-warning {
          margin: 0.75rem 0 0 0;
          color: #742a2a;
          font-size: 0.95rem;
          line-height: 1.45;
        }

        .toggle-field {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
        }

        .toggle-field input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .toggle-control {
          position: relative;
          width: 46px;
          height: 26px;
          border-radius: 999px;
          background: #ced4da;
          transition: background-color 0.2s ease;
        }

        .toggle-control::after {
          content: "";
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.25);
          transition: transform 0.2s ease;
        }

        .toggle-field input:checked + .toggle-control {
          background: #dc3545;
        }

        .toggle-field input:checked + .toggle-control::after {
          transform: translateX(20px);
        }

        .toggle-label {
          color: #333;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .settings-section-content {
            padding: 1rem;
          }

          .dev-email-mode {
            display: block;
          }

          .toggle-field {
            margin-top: 1rem;
          }
        }
      </style>
    `,
    body: `
      <div class="main-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">Settings</h1>
            <p class="page-subtitle">Admin tools and system maintenance</p>
          </div>
        </div>

        ${
      options.isLocalDev
        ? `
        <div class="settings-section">
          <div class="settings-section-header">
            <h2 class="settings-section-title">Local Email Testing</h2>
          </div>
          <div class="settings-section-content">
            <div class="dev-email-mode">
              <div>
                <p class="dev-email-copy">Enable <code>?force=true</code> while using this browser so admin email actions send through Resend from local development.</p>
                <p class="dev-email-warning"><strong>Use carefully.</strong> When this is on, emails are sent to real participant addresses.</p>
              </div>
              <label class="toggle-field" for="forceEmailModeToggle">
                <input type="checkbox" id="forceEmailModeToggle">
                <span class="toggle-control" aria-hidden="true"></span>
                <span class="toggle-label">Send real emails</span>
              </label>
            </div>
          </div>
        </div>
        `
        : ""
    }

        <div class="settings-section">
          <div class="settings-section-header">
            <h2 class="settings-section-title">Email Contact Defaults</h2>
          </div>
          <div class="settings-section-content">
            <form class="settings-form" id="emailContactForm">
              <div class="form-group">
                <label class="form-label" for="emailContactName">Contact Name</label>
                <input class="form-input" type="text" id="emailContactName" name="contactName" value="${
      escapeAttribute(options.emailDefaults.contactName)
    }" autocomplete="name" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="emailContactPhone">Contact Phone</label>
                <input class="form-input" type="tel" id="emailContactPhone" name="contactPhone" value="${
      escapeAttribute(options.emailDefaults.contactPhone)
    }" autocomplete="tel" required>
              </div>
              <div class="settings-form-actions">
                <button type="submit" class="btn btn-primary" id="saveEmailContactBtn">Save Email Contact</button>
              </div>
              <div class="settings-status" id="emailContactStatus" aria-live="polite"></div>
            </form>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-header">
            <h2 class="settings-section-title">Database Maintenance</h2>
          </div>
          <div class="settings-section-content">
            <p class="maintenance-warning"><strong>Do not touch these tools unless you know what you are doing.</strong> Running migrations changes the database schema and should only be done after a deployment or when fixing a known schema issue.</p>
            <p class="maintenance-copy">Apply the latest database schema changes for this deployed version of RepVolunteers.</p>
            <div class="maintenance-actions">
              <button type="button" class="btn btn-primary" id="runMigrationsBtn">Run Migrations</button>
            </div>
            <pre class="migration-status" id="migrationStatus" aria-live="polite"></pre>
          </div>
        </div>
      </div>
    `,
    scripts: `
      <script src="/src/utils/modal.js"></script>
      <script src="/src/views/admin/settings.js"></script>
    `,
  });
}
