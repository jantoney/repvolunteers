// Get volunteer ID from the script tag
const volunteerId = document.currentScript.getAttribute("data-volunteer-id");

// Load email history when page loads
document.addEventListener("DOMContentLoaded", function () {
  // Ensure modal is hidden on page load
  const modal = document.getElementById("emailContentModal");
  if (modal) {
    modal.style.display = "none";
  }

  loadEmailHistory();
  loadUnavailablePerformances();
  setupEventListeners();
});

function setupEventListeners() {
  // Handle form submission for volunteer update
  const form = document.getElementById("volunteerForm");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(this);
      const data = {
        name: formData.get("name"),
        email: formData.get("email") || null,
        phone: formData.get("phone") || null,
      };

      try {
        const response = await fetch(`/admin/api/volunteers/${volunteerId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          credentials: "include",
        });

        if (response.ok) {
          globalThis.location.href = "/admin/volunteers";
        } else {
          if (typeof Modal !== "undefined") {
            Modal.error("Error", "Failed to update volunteer");
          } else {
            alert("Failed to update volunteer");
          }
        }
      } catch (error) {
        console.error("Update error:", error);
        if (typeof Modal !== "undefined") {
          Modal.error("Error", "Error updating volunteer");
        } else {
          alert("Error updating volunteer");
        }
      }
    });
  }

  const addUnavailablePerformanceBtn = document.getElementById(
    "addUnavailablePerformanceBtn",
  );
  if (addUnavailablePerformanceBtn) {
    addUnavailablePerformanceBtn.addEventListener(
      "click",
      addUnavailablePerformance,
    );
  }

  const saveUnavailablePerformancesBtn = document.getElementById(
    "saveUnavailablePerformancesBtn",
  );
  if (saveUnavailablePerformancesBtn) {
    saveUnavailablePerformancesBtn.addEventListener(
      "click",
      saveUnavailablePerformances,
    );
  }
}

const unavailablePerformanceIds = new Set();
const performanceById = new Map();
let performanceOptions = [];

function setUnavailablePerformancesStatus(message, type) {
  const statusEl = document.getElementById("unavailablePerformancesStatus");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `availability-status ${type || ""}`;
}

function populateUnavailablePerformanceSelect() {
  const select = document.getElementById("unavailablePerformanceSelect");
  if (!select) return;

  const availableOptions = performanceOptions.filter(
    (performance) => !unavailablePerformanceIds.has(String(performance.id)),
  );
  AdminDOM.setChildren(select, [
    AdminDOM.el(
      "option",
      { value: "" },
      availableOptions.length === 0
        ? "No more upcoming performances"
        : "Choose a performance",
    ),
    ...availableOptions.map((performance) =>
      AdminDOM.el(
        "option",
        { value: String(performance.id) },
        performance.label,
      ),
    ),
  ]);
}

function renderUnavailablePerformances() {
  const listEl = document.getElementById("unavailablePerformancesList");
  if (!listEl) return;

  const selectedPerformances = Array.from(unavailablePerformanceIds)
    .map((id) => performanceById.get(id))
    .filter(Boolean)
    .sort((a, b) =>
      `${a.date} ${a.start_time}`.localeCompare(`${b.date} ${b.start_time}`),
    );

  if (selectedPerformances.length === 0) {
    AdminDOM.setChildren(
      listEl,
      AdminDOM.el(
        "div",
        { className: "alert alert-warning" },
        "No unavailable performances added.",
      ),
    );
    populateUnavailablePerformanceSelect();
    return;
  }

  AdminDOM.setChildren(
    listEl,
    selectedPerformances.map((performance) =>
      AdminDOM.el("div", { className: "unavailable-performance-item" }, [
        AdminDOM.el("span", {}, performance.label),
        AdminDOM.el(
          "button",
          {
            type: "button",
            className: "btn btn-sm btn-danger",
            onclick: () => {
              unavailablePerformanceIds.delete(String(performance.id));
              renderUnavailablePerformances();
              setUnavailablePerformancesStatus(
                "Remember to save your changes.",
                "",
              );
            },
          },
          "Remove",
        ),
      ]),
    ),
  );

  populateUnavailablePerformanceSelect();
}

async function loadUnavailablePerformances() {
  try {
    const response = await fetch(
      `/admin/api/volunteers/${volunteerId}/unavailable-performances`,
    );
    if (!response.ok) {
      throw new Error("Failed to load unavailable performances");
    }

    const data = await response.json();
    unavailablePerformanceIds.clear();
    performanceById.clear();
    performanceOptions = data.options || [];
    performanceOptions.forEach((performance) =>
      performanceById.set(String(performance.id), performance),
    );
    (data.performances || []).forEach((performance) => {
      unavailablePerformanceIds.add(String(performance.id));
      performanceById.set(String(performance.id), performance);
    });
    renderUnavailablePerformances();
  } catch (error) {
    console.error("Error loading unavailable performances:", error);
    setUnavailablePerformancesStatus(
      "Failed to load unavailable performances.",
      "error",
    );
  }
}

function addUnavailablePerformance() {
  const select = document.getElementById("unavailablePerformanceSelect");
  if (!select || !select.value) {
    setUnavailablePerformancesStatus("Choose a performance to add.", "error");
    return;
  }

  unavailablePerformanceIds.add(String(select.value));
  select.value = "";
  renderUnavailablePerformances();
  setUnavailablePerformancesStatus("Remember to save your changes.", "");
}

async function saveUnavailablePerformances() {
  const button = document.getElementById("saveUnavailablePerformancesBtn");
  const originalText = button ? button.textContent : "Save";
  if (button) {
    button.disabled = true;
    button.textContent = "Saving...";
  }

  try {
    const response = await fetch(
      `/admin/api/volunteers/${volunteerId}/unavailable-performances`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          performanceIds: Array.from(unavailablePerformanceIds)
            .map(Number)
            .sort((a, b) => a - b),
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save unavailable performances");
    }

    setUnavailablePerformancesStatus(
      "Unavailable performances saved.",
      "success",
    );
  } catch (error) {
    console.error("Error saving unavailable performances:", error);
    setUnavailablePerformancesStatus(
      error.message || "Failed to save unavailable performances.",
      "error",
    );
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

async function loadEmailHistory() {
  const loadingEl = document.getElementById("emailHistoryLoading");
  const contentEl = document.getElementById("emailHistoryContent");
  const errorEl = document.getElementById("emailHistoryError");

  try {
    // Show loading state
    if (loadingEl) loadingEl.style.display = "flex";
    if (contentEl) contentEl.style.display = "none";
    if (errorEl) errorEl.style.display = "none";

    const response = await fetch(`/admin/api/volunteers/${volunteerId}/emails`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to load email history`);
    }

    const data = await response.json();

    // Hide loading state
    if (loadingEl) loadingEl.style.display = "none";

    if (data.emails && data.emails.length > 0) {
      if (contentEl) {
        AdminDOM.setChildren(contentEl, renderEmailHistory(data.emails));
        contentEl.style.display = "block";
      }
    } else {
      if (errorEl) {
        errorEl.textContent = "No emails have been sent to this volunteer yet.";
        errorEl.style.display = "block";
      }
    }
  } catch (error) {
    console.error("Error loading email history:", error);
    if (loadingEl) loadingEl.style.display = "none";
    if (errorEl) {
      errorEl.textContent =
        "Failed to load email history. Please try refreshing the page.";
      errorEl.className = "alert alert-danger";
      errorEl.style.display = "block";
    }
  }
}

function renderEmailHistory(emails) {
  return emails.map((email) => {
    const sentDate = new Date(email.sent_at).toLocaleString();

    return AdminDOM.el("div", { className: "email-item" }, [
      AdminDOM.el("div", { className: "email-header" }, [
        AdminDOM.el("h4", { className: "email-subject" }, email.subject),
        AdminDOM.el("span", { className: "email-date" }, sentDate),
      ]),
      AdminDOM.el(
        "div",
        { className: "email-actions" },
        AdminDOM.el(
          "button",
          {
            type: "button",
            className: "btn btn-sm btn-primary",
            onclick: () => viewEmailContent(email.id),
          },
          "View Details",
        ),
      ),
    ]);
  });
}

// Used in onclick handlers generated by renderEmailHistory
// deno-lint-ignore no-unused-vars
async function viewEmailContent(emailId) {
  const modal = document.getElementById("emailContentModal");
  const title = document.getElementById("emailContentTitle");
  const body = document.getElementById("emailContentBody");

  if (!modal || !title || !body) {
    console.error("Modal elements not found");
    return;
  }

  // Set title and show loading state
  title.textContent = "Email Details";
  AdminDOM.setChildren(
    body,
    AdminDOM.el("div", { className: "loading-spinner" }, [
      AdminDOM.el("div", { className: "spinner" }),
      AdminDOM.el("span", {}, "Loading email details..."),
    ]),
  );

  // Show modal with animation
  modal.style.display = "block";

  try {
    const response = await fetch(`/admin/api/emails/${emailId}/content`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to load email content`);
    }

    const email = await response.json();

    if (!email) {
      throw new Error("No email data received");
    }

    let statusBadgeText = "";
    let statusBadgeClass = "";
    const status = email.delivery_status || "unknown";
    switch (status) {
      case "sent":
        statusBadgeText = "Sent";
        statusBadgeClass = "status-success";
        break;
      case "delivered":
        statusBadgeText = "Delivered";
        statusBadgeClass = "status-success";
        break;
      case "failed":
        statusBadgeText = "Failed";
        statusBadgeClass = "status-danger";
        break;
      case "simulated":
        statusBadgeText = "Simulated";
        statusBadgeClass = "status-info";
        break;
      default:
        statusBadgeText = status;
        statusBadgeClass = "status-secondary";
    }

    const detailRows = [
      [
        "From:",
        `${email.sender_name || "Unknown"} <${email.sender_email || ""}>`,
      ],
      [
        "To:",
        `${email.recipient_name || "Unknown"} <${email.recipient_email || ""}>`,
      ],
      ["Subject:", email.subject || "No subject"],
      ["Sent:", new Date(email.sent_at).toLocaleString()],
      ["Type:", (email.email_type || "unknown").replace("_", " ")],
    ].flatMap(([label, value]) => [
      AdminDOM.el("span", { className: "email-details-label" }, label),
      AdminDOM.el("span", { className: "email-details-value" }, value),
    ]);

    detailRows.push(
      AdminDOM.el("span", { className: "email-details-label" }, "Status:"),
      AdminDOM.el(
        "span",
        { className: "email-details-value" },
        AdminDOM.el(
          "span",
          {
            className: statusBadgeClass,
          },
          statusBadgeText,
        ),
      ),
    );

    const sections = [
      AdminDOM.el("div", { className: "email-details-grid" }, detailRows),
    ];

    if (email.attachments && email.attachments.length > 0) {
      sections.push(
        AdminDOM.el("div", { className: "attachments-section" }, [
          AdminDOM.el(
            "span",
            { className: "attachments-label" },
            "Attachments:",
          ),
          AdminDOM.el(
            "div",
            { className: "attachments-list" },
            email.attachments.map((att) =>
              AdminDOM.el(
                "a",
                {
                  href: `/admin/api/emails/attachments/${att.id}/download`,
                  target: "_blank",
                  className: "attachment-link",
                  title: `Open ${att.filename}`,
                },
                [
                  AdminDOM.el(
                    "span",
                    { className: "attachment-icon" },
                    "Attachment",
                  ),
                  att.filename,
                ],
              ),
            ),
          ),
        ]),
      );
    }

    const contentBody = AdminDOM.el("div", { className: "email-content-body" });
    if (email.html_content) {
      contentBody.appendChild(
        AdminDOM.el("iframe", { srcdoc: email.html_content }),
      );
    } else {
      contentBody.appendChild(
        AdminDOM.el(
          "div",
          {
            style: { padding: "1rem", fontStyle: "italic", color: "#666" },
          },
          email.content || "No content available",
        ),
      );
    }

    sections.push(
      AdminDOM.el("div", { className: "email-content-section" }, [
        AdminDOM.el("span", { className: "email-content-label" }, "Content:"),
        contentBody,
      ]),
    );

    AdminDOM.setChildren(body, sections);
  } catch (error) {
    console.error("Error loading email content:", error);
    AdminDOM.setChildren(
      body,
      AdminDOM.el("div", { className: "alert alert-danger" }, [
        AdminDOM.el("strong", {}, "Failed to load email content"),
        AdminDOM.el("br"),
        error.message || "An unexpected error occurred",
      ]),
    );
  }
}

function closeEmailModal() {
  const modal = document.getElementById("emailContentModal");
  if (modal) {
    modal.style.display = "none";
    // Clear the modal content to prevent it from showing stale data
    const body = document.getElementById("emailContentBody");
    if (body) {
      AdminDOM.clear(body);
    }
  }
}

// Close modal when clicking outside of it
globalThis.onclick = function (event) {
  const modal = document.getElementById("emailContentModal");
  if (event.target === modal) {
    closeEmailModal();
  }
};

// Handle escape key to close modal
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    const modal = document.getElementById("emailContentModal");
    if (modal && modal.style.display === "block") {
      closeEmailModal();
    }
  }
});
