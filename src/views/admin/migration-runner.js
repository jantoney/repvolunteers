document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("migrationForm");
  if (form) {
    form.addEventListener("submit", runMigrations);
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

async function runMigrations(event) {
  event.preventDefault();

  const input = document.getElementById("migrationConfirmInput");
  const button = document.getElementById("runMigrationsBtn");
  const originalText = button ? button.textContent : "Run Migrations";

  if (!input || input.value !== "MIGRATE") {
    setMigrationStatus("Type MIGRATE exactly to run migrations.", "error");
    if (input) {
      input.focus();
      input.select();
    }
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Running...";
  }
  setMigrationStatus("Running migrations...");

  try {
    const response = await fetch("/admin/maintenance/migrations", {
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
