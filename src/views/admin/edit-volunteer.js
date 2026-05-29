// Get volunteer ID from the script tag
const profileVolunteerId = document.currentScript.getAttribute(
  "data-volunteer-id",
);
const profileVolunteerName = document.currentScript.getAttribute(
  "data-volunteer-name",
);

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
  setupProfileTabs();
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
        const response = await fetch(
          `/admin/api/volunteers/${profileVolunteerId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
            credentials: "include",
          },
        );

        if (response.ok) {
          setProfileSaveStatus("Details saved.", "success");
          if (typeof Toast !== "undefined") {
            Toast.success("Volunteer details saved.");
          }
        } else {
          setProfileSaveStatus("Details were not saved.", "error");
          if (typeof Modal !== "undefined") {
            Modal.error("Error", "Failed to update volunteer");
          } else {
            alert("Failed to update volunteer");
          }
        }
      } catch (error) {
        console.error("Update error:", error);
        setProfileSaveStatus("Details were not saved.", "error");
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

  const noteForm = document.getElementById("volunteerNoteForm");
  if (noteForm) {
    noteForm.addEventListener("submit", addVolunteerNote);
  }
}

function setupProfileTabs() {
  const tabs = document.querySelectorAll(".profile-tab");
  const panels = document.querySelectorAll(".profile-panel");

  const activateTab = (target) => {
    const tab = document.querySelector(
      `.profile-tab[data-tab-target="${target}"]`,
    );
    const panel = document.getElementById(`profile-tab-${target}`);
    if (tab && panel) {
      tabs.forEach((item) => item.classList.remove("active"));
      panels.forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
      panel.classList.add("active");
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-tab-target");
      activateTab(target);
    });
  });

  const params = new URLSearchParams(globalThis.location.search);
  const initialTab = params.get("tab") || "";
  if (initialTab) {
    activateTab(initialTab);
  }
}

function setProfileSaveStatus(message, type) {
  const statusEl = document.getElementById("profileSaveStatus");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `profile-status ${type === "error" ? "error" : ""}`;
}

function setNoteSaveStatus(message, type) {
  const statusEl = document.getElementById("noteSaveStatus");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `profile-status ${type === "error" ? "error" : ""}`;
}

async function addVolunteerNote(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const note = String(formData.get("note") || "").trim();

  if (!note) {
    setNoteSaveStatus("Enter a note first.", "error");
    return;
  }

  try {
    const response = await fetch(
      `/admin/api/volunteers/${profileVolunteerId}/notes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ note }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to add note");
    }

    if (typeof Toast !== "undefined") {
      Toast.success("Note added.");
    }
    globalThis.location.reload();
  } catch (error) {
    console.error("Error adding volunteer note:", error);
    setNoteSaveStatus("Note was not added.", "error");
  }
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const unavailablePerformanceIds = new Set();
const savedUnavailablePerformanceIds = new Set();
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
      )
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
      `${a.date} ${a.start_time}`.localeCompare(`${b.date} ${b.start_time}`)
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
            onclick: (event) =>
              removeUnavailablePerformance(performance, event.currentTarget),
          },
          "Remove",
        ),
      ])
    ),
  );

  populateUnavailablePerformanceSelect();
}

async function loadUnavailablePerformances() {
  try {
    const response = await fetch(
      `/admin/api/volunteers/${profileVolunteerId}/unavailable-performances`,
    );
    if (!response.ok) {
      throw new Error("Failed to load unavailable performances");
    }

    const data = await response.json();
    unavailablePerformanceIds.clear();
    savedUnavailablePerformanceIds.clear();
    performanceById.clear();
    performanceOptions = data.options || [];
    performanceOptions.forEach((performance) =>
      performanceById.set(String(performance.id), performance)
    );
    (data.performances || []).forEach((performance) => {
      unavailablePerformanceIds.add(String(performance.id));
      savedUnavailablePerformanceIds.add(String(performance.id));
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

async function persistUnavailablePerformances(performanceIds) {
  const response = await fetch(
    `/admin/api/volunteers/${profileVolunteerId}/unavailable-performances`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        performanceIds: performanceIds.map(Number).sort((a, b) => a - b),
      }),
    },
  );

  if (!response.ok) {
    let message = "Failed to save unavailable performances";
    try {
      const error = await response.json();
      message = error.error || message;
    } catch {
      message = `${message} (HTTP ${response.status})`;
    }
    throw new Error(message);
  }

  return await response.json();
}

function syncSavedUnavailablePerformanceIds(performanceIds) {
  savedUnavailablePerformanceIds.clear();
  performanceIds.forEach((id) =>
    savedUnavailablePerformanceIds.add(String(id))
  );
}

async function removeUnavailablePerformance(performance, button) {
  const performanceId = String(performance.id);
  const originalText = button ? button.textContent : "Remove";

  if (button) {
    button.disabled = true;
    button.textContent = "Removing...";
  }
  setUnavailablePerformancesStatus(
    `Removing ${performance.label}...`,
    "",
  );

  try {
    const savedIdsAfterRemoval = Array.from(savedUnavailablePerformanceIds)
      .filter((id) => id !== performanceId);
    const result = await persistUnavailablePerformances(savedIdsAfterRemoval);

    unavailablePerformanceIds.delete(performanceId);
    syncSavedUnavailablePerformanceIds(
      result.performanceIds || savedIdsAfterRemoval,
    );
    renderUnavailablePerformances();
    setUnavailablePerformancesStatus(
      `${performance.label} was removed.`,
      "success",
    );
  } catch (error) {
    console.error("Error removing unavailable performance:", error);
    setUnavailablePerformancesStatus(
      error.message ||
        `Could not remove ${performance.label}. Please try again.`,
      "error",
    );
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

async function saveUnavailablePerformances() {
  const button = document.getElementById("saveUnavailablePerformancesBtn");
  const originalText = button ? button.textContent : "Save";
  if (button) {
    button.disabled = true;
    button.textContent = "Saving...";
  }

  try {
    const performanceIds = Array.from(unavailablePerformanceIds);
    const result = await persistUnavailablePerformances(performanceIds);
    syncSavedUnavailablePerformanceIds(result.performanceIds || performanceIds);

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

    const response = await fetch(
      `/admin/api/volunteers/${profileVolunteerId}/emails`,
    );

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
    const sentDate = new Date(email.sent_at).toLocaleString("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Australia/Adelaide",
    });

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
  modal.style.display = "flex";

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
      [
        "Sent:",
        new Date(email.sent_at).toLocaleString("en-AU", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Australia/Adelaide",
        }),
      ],
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
              )
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
    if (modal && modal.style.display !== "none") {
      closeEmailModal();
    }
  }
});

function getAbsoluteSignupUrl(volunteerIdForUrl) {
  const input = document.getElementById(`url-${volunteerIdForUrl}`);
  if (!input) return "";
  if (!input.dataset.fullUrl) {
    input.dataset.fullUrl = new URL(input.value, globalThis.location.origin)
      .href;
  }
  return input.dataset.fullUrl;
}

async function copyProfileSignupUrl(volunteerIdForUrl) {
  const url = getAbsoluteSignupUrl(volunteerIdForUrl);
  if (!url) return;

  try {
    await navigator.clipboard.writeText(url);
    if (typeof Toast !== "undefined") {
      Toast.success("Portal link copied.");
    } else {
      alert("Portal link copied.");
    }
  } catch (error) {
    console.error("Could not copy portal link:", error);
    if (typeof Modal !== "undefined") {
      Modal.error("Copy failed", "Could not copy the portal link.");
    } else {
      alert("Could not copy the portal link.");
    }
  }
}

function openProfileSignupUrl(volunteerIdForUrl) {
  const url = getAbsoluteSignupUrl(volunteerIdForUrl);
  if (url) {
    globalThis.open(url, "_blank", "noopener");
  }
}

async function toggleVolunteerStatusFromProfile(button) {
  const id = button.dataset.volunteerId;
  const name = button.dataset.volunteerName;
  const nextStatus = button.dataset.nextStatus === "active"
    ? "active"
    : "inactive";

  const statusAction = async () => {
    try {
      const response = await fetch(`/admin/api/volunteers/${id}/${nextStatus}`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        if (typeof Toast !== "undefined") {
          Toast.success(
            nextStatus === "active"
              ? "Volunteer marked active."
              : "Volunteer marked inactive.",
          );
        }
        globalThis.location.reload();
      } else if (typeof Modal !== "undefined") {
        Modal.error("Update failed", "Could not update this volunteer status.");
      } else {
        alert("Could not update this volunteer status.");
      }
    } catch (error) {
      console.error("Error updating volunteer status:", error);
      if (typeof Modal !== "undefined") {
        Modal.error("Update failed", "Could not update this volunteer status.");
      } else {
        alert("Could not update this volunteer status.");
      }
    }
  };

  const message =
    `Mark <strong>${
      escapeHtml(name || profileVolunteerName || "this volunteer")
    }</strong> ${nextStatus}?`;

  if (typeof Modal !== "undefined") {
    const isActivating = nextStatus === "active";
    Modal.showModal(`status-volunteer-${id}`, {
      title: isActivating ? "Reactivate volunteer" : "Stop future volunteering",
      body: isActivating
        ? `<p>${message}</p><p>This will allow website login and future shift requests again.</p>`
        : `<p>${message}</p><p>We'll be sad to see you go, but we just wanted to confirm one last time. Clicking Confirm below will stop all future shift requests being sent to this volunteer and any shifts they're scheduled on in the future will be removed.</p>`,
      buttons: [
        {
          text: "Cancel",
          className: "modal-btn-outline",
          action: "cancel",
        },
        {
          text: "Confirm",
          className: isActivating ? "modal-btn-primary" : "modal-btn-danger",
          action: "confirm",
          handler: async () => {
            Modal.closeModal(`status-volunteer-${id}`);
            await statusAction();
          },
        },
      ],
    });
    return;
  }

  if (confirm(`Mark ${name || "this volunteer"} ${nextStatus}?`)) {
    await statusAction();
  }
}

globalThis.copyProfileSignupUrl = copyProfileSignupUrl;
globalThis.openProfileSignupUrl = openProfileSignupUrl;
globalThis.toggleVolunteerStatusFromProfile = toggleVolunteerStatusFromProfile;
