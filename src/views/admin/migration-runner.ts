import type { RouterContext } from "oak";
import { renderAdminPage } from "./components/layout.ts";

export function showMigrationRunnerPage(ctx: RouterContext<string>) {
  ctx.response.type = "text/html";
  ctx.response.body = renderAdminPage({
    title: "Run Migrations",
    currentPage: "maintenance",
    head: `
      <style>
        .maintenance-panel {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .maintenance-panel-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e9ecef;
          background: #f8f9fa;
        }

        .maintenance-panel-title {
          color: #333;
          font-size: 1.5rem;
          margin: 0;
        }

        .maintenance-panel-content {
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
          line-height: 1.5;
          margin: 0 0 1rem 0;
        }

        .maintenance-form {
          display: grid;
          gap: 1rem;
          max-width: 640px;
          margin-top: 1.5rem;
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
          margin: 1.5rem 0 0 0;
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
          .maintenance-panel-header,
          .maintenance-panel-content {
            padding: 1rem;
          }
        }
      </style>
    `,
    body: `
      <div class="main-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">Run Migrations</h1>
            <p class="page-subtitle">Apply database schema updates for the deployed app.</p>
          </div>
        </div>

        <div class="maintenance-panel">
          <div class="maintenance-panel-header">
            <h2 class="maintenance-panel-title">Database Maintenance</h2>
          </div>
          <div class="maintenance-panel-content">
            <p class="maintenance-warning"><strong>Use this only after a deployment or when fixing a known schema issue.</strong> Running migrations changes the production database schema.</p>
            <p class="maintenance-copy">This page only requires an authenticated session and avoids settings data that may be unavailable before migrations run.</p>
            <form class="maintenance-form" id="migrationForm">
              <div class="form-group">
                <label class="form-label" for="migrationConfirmInput">Type MIGRATE to continue</label>
                <input class="form-input" type="text" id="migrationConfirmInput" autocomplete="off" spellcheck="false" required>
              </div>
              <div class="maintenance-actions">
                <button type="submit" class="btn btn-primary" id="runMigrationsBtn">Run Migrations</button>
              </div>
            </form>
            <pre class="migration-status" id="migrationStatus" aria-live="polite"></pre>
          </div>
        </div>
      </div>
    `,
    scripts: `
      <script src="/src/views/admin/migration-runner.js"></script>
    `,
  });
}
