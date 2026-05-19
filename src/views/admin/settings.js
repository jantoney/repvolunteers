document.addEventListener("DOMContentLoaded", () => {
  const runMigrationsBtn = document.getElementById("runMigrationsBtn");
  if (runMigrationsBtn) {
    runMigrationsBtn.addEventListener("click", confirmMigrations);
  }
});

function setMigrationStatus(message, type = "") {
  const status = document.getElementById("migrationStatus");
  if (!status) return;

  status.textContent = message;
  status.className = "migration-status visible";
  if (type) {
    status.classList.add(type);
  }
}

function confirmMigrations() {
  if (typeof Modal === "undefined") {
    const typed = prompt("Type MIGRATE to run database migrations.");
    if (typed === "MIGRATE") {
      runMigrations();
    }
    return;
  }

  Modal.createModal("migration-confirmation", {
    title: "Run Database Migrations",
    body: `
      <p style="margin: 0 0 1rem 0; color: #742a2a; line-height: 1.5;">
        This changes the database schema. Only continue if you know what you are doing.
      </p>
      <div class="form-group" style="margin-bottom: 0;">
        <label for="migrationConfirmInput">Type MIGRATE to continue</label>
        <input type="text" id="migrationConfirmInput" autocomplete="off" spellcheck="false">
        <div id="migrationConfirmError" style="display: none; color: #dc3545; margin-top: 0.5rem; font-size: 0.9rem;">
          Type MIGRATE exactly to run migrations.
        </div>
      </div>
    `,
    buttons: [
      {
        text: "Cancel",
        className: "modal-btn-outline",
        action: "cancel",
      },
      {
        text: "Run Migrations",
        className: "modal-btn-danger",
        action: "run-migrations",
        handler: () => {
          const input = document.getElementById("migrationConfirmInput");
          const error = document.getElementById("migrationConfirmError");

          if (!input || input.value !== "MIGRATE") {
            if (error) {
              error.style.display = "block";
            }
            if (input) {
              input.focus();
              input.select();
            }
            return;
          }

          Modal.closeModal("migration-confirmation");
          runMigrations();
        },
      },
    ],
  });

  Modal.showModal("migration-confirmation");
  const input = document.getElementById("migrationConfirmInput");
  if (input) {
    input.focus();
  }
}

async function runMigrations() {
  const button = document.getElementById("runMigrationsBtn");
  const originalText = button ? button.textContent : "Run Migrations";

  if (button) {
    button.disabled = true;
    button.textContent = "Running...";
  }
  setMigrationStatus("Running migrations...");

  try {
    const response = await fetch("/admin/api/maintenance/migrations", {
      method: "POST",
      credentials: "include",
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      const details = [result.error, result.stderr, result.stdout]
        .filter(Boolean)
        .join("\n\n");
      setMigrationStatus(details || "Database migrations failed.", "error");
      if (typeof Toast !== "undefined") {
        Toast.error(result.error || "Database migrations failed");
      }
      return;
    }

    const output = [result.stdout, result.stderr].filter(Boolean).join("\n\n");
    setMigrationStatus(output || "Database migrations completed.", "success");
    if (typeof Toast !== "undefined") {
      Toast.success("Database migrations completed");
    }
  } catch (error) {
    console.error("Error running migrations:", error);
    setMigrationStatus("Error running database migrations.", "error");
    if (typeof Toast !== "undefined") {
      Toast.error("Error running database migrations");
    }
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}
