import { renderAdminPage } from "../components/layout.ts";

export function renderSettingsTemplate(): string {
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

        @media (max-width: 768px) {
          .settings-section-content {
            padding: 1rem;
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
