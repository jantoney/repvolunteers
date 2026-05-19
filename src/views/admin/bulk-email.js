let showVolunteers = [];
let unfilledVolunteers = [];
const selectedShowVolunteers = new Set();
const selectedUnfilledVolunteers = new Set();

document.addEventListener("DOMContentLoaded", function () {
  loadShows();
  loadUnfilledVolunteers();
  setupEventListeners();
});

function setupEventListeners() {
  document.querySelectorAll(".email-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      switchEmailType(this.dataset.emailType);
    });
  });

  document.getElementById("showSelect").addEventListener("change", function () {
    if (this.value) {
      loadShowVolunteers(this.value);
    } else {
      document.getElementById("showVolunteersSection").style.display = "none";
    }
  });
}

function switchEmailType(emailType) {
  document.querySelectorAll(".email-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.emailType === emailType);
  });

  document.querySelectorAll(".email-content").forEach((content) => {
    content.classList.toggle("active", content.id === emailType + "-content");
  });
}

async function loadShows() {
  try {
    const response = await fetch("/admin/api/bulk-email/shows");
    const shows = await response.json();
    const select = document.getElementById("showSelect");

    AdminDOM.setChildren(
      select,
      AdminDOM.el("option", { value: "" }, "-- Select a production --"),
    );
    shows.forEach((show) => {
      select.appendChild(AdminDOM.el(
        "option",
        {
          value: show.id,
        },
        `${show.name} (${show.volunteers_with_shifts} volunteers with shifts)`,
      ));
    });
  } catch (error) {
    console.error("Error loading shows:", error);
    showStatus("Error loading productions", "error");
  }
}

async function loadShowVolunteers(showId) {
  document.getElementById("loadingState").classList.add("active");

  try {
    const response = await fetch(
      `/admin/api/bulk-email/shows/${showId}/volunteers`,
    );
    showVolunteers = await response.json();
    renderShowVolunteers();
    document.getElementById("showVolunteersSection").style.display = "block";
    updateShowSelectionCount();
  } catch (error) {
    console.error("Error loading show volunteers:", error);
    showStatus("Error loading volunteers", "error");
  } finally {
    document.getElementById("loadingState").classList.remove("active");
  }
}

async function loadUnfilledVolunteers() {
  try {
    const response = await fetch(
      "/admin/api/bulk-email/volunteers/unfilled-shifts",
    );
    unfilledVolunteers = await response.json();
    renderUnfilledVolunteers();
    updateUnfilledSelectionCount();
  } catch (error) {
    console.error("Error loading unfilled volunteers:", error);
    showStatus("Error loading volunteers", "error");
  }
}

function createVolunteerItem(volunteer, details, onChange) {
  return AdminDOM.el("div", { className: "volunteer-item" }, [
    AdminDOM.el("input", {
      type: "checkbox",
      className: "volunteer-checkbox",
      dataset: { volunteerId: String(volunteer.id) },
      onchange: (event) => onChange(String(volunteer.id), event.target.checked),
    }),
    AdminDOM.el("div", { className: "volunteer-info" }, [
      AdminDOM.el("div", { className: "volunteer-name" }, volunteer.name),
      AdminDOM.el("div", { className: "volunteer-details" }, details),
    ]),
  ]);
}

function renderShowVolunteers() {
  const container = document.getElementById("showVolunteersList");
  AdminDOM.setChildren(
    container,
    showVolunteers.map((volunteer) =>
      createVolunteerItem(
        volunteer,
        `${volunteer.email} - ${volunteer.shift_count} shifts - Next: ${
          volunteer.next_shift_date || "N/A"
        }`,
        updateShowSelection,
      )
    ),
  );

  selectedShowVolunteers.clear();
  updateShowSelectionCount();
}

function renderUnfilledVolunteers() {
  const container = document.getElementById("unfilledVolunteersList");
  AdminDOM.setChildren(
    container,
    unfilledVolunteers.map((volunteer) =>
      createVolunteerItem(
        volunteer,
        `${volunteer.email} - Total shifts: ${volunteer.total_shifts} - Upcoming: ${volunteer.upcoming_shifts}`,
        updateUnfilledSelection,
      )
    ),
  );

  selectedUnfilledVolunteers.clear();
  updateUnfilledSelectionCount();
}

function updateShowSelection(volunteerId, checked) {
  updateSelection(selectedShowVolunteers, volunteerId, checked);
  updateShowSelectionCount();
}

function updateUnfilledSelection(volunteerId, checked) {
  updateSelection(selectedUnfilledVolunteers, volunteerId, checked);
  updateUnfilledSelectionCount();
}

function updateSelection(selection, volunteerId, checked) {
  if (checked) {
    selection.add(volunteerId);
  } else {
    selection.delete(volunteerId);
  }
}

function updateShowSelectionCount() {
  const count = selectedShowVolunteers.size;
  document.getElementById("showSelectionCount").textContent =
    `${count} volunteers selected`;
  document.getElementById("sendShowWeekBtn").disabled = count === 0;
}

function updateUnfilledSelectionCount() {
  const count = selectedUnfilledVolunteers.size;
  document.getElementById("unfilledSelectionCount").textContent =
    `${count} volunteers selected`;
  document.getElementById("sendUnfilledBtn").disabled = count === 0;
}

function setAll(containerSelector, selection, checked) {
  const checkboxes = document.querySelectorAll(
    `${containerSelector} .volunteer-checkbox`,
  );
  checkboxes.forEach((checkbox) => {
    checkbox.checked = checked;
    if (checked) {
      selection.add(checkbox.dataset.volunteerId);
    }
  });
  if (!checked) {
    selection.clear();
  }
}

function selectAllShowVolunteers() {
  setAll("#showVolunteersList", selectedShowVolunteers, true);
  updateShowSelectionCount();
}

function deselectAllShowVolunteers() {
  setAll("#showVolunteersList", selectedShowVolunteers, false);
  updateShowSelectionCount();
}

function selectAllUnfilledVolunteers() {
  setAll("#unfilledVolunteersList", selectedUnfilledVolunteers, true);
  updateUnfilledSelectionCount();
}

function deselectAllUnfilledVolunteers() {
  setAll("#unfilledVolunteersList", selectedUnfilledVolunteers, false);
  updateUnfilledSelectionCount();
}

async function sendShowWeekEmails() {
  if (selectedShowVolunteers.size === 0) {
    showStatus("Please select at least one volunteer", "error");
    return;
  }

  const showId = document.getElementById("showSelect").value;
  if (!showId) {
    showStatus("Please select a production", "error");
    return;
  }

  const btn = document.getElementById("sendShowWeekBtn");
  btn.disabled = true;
  btn.textContent = "Sending...";

  try {
    const response = await fetch("/admin/api/bulk-email/send-show-week", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        showId: parseInt(showId, 10),
        volunteerIds: Array.from(selectedShowVolunteers),
      }),
    });

    const result = await response.json();
    if (result.success) {
      showStatus(result.message, "success");
      deselectAllShowVolunteers();
    } else {
      showStatus(result.error || "Failed to send emails", "error");
    }
  } catch (error) {
    console.error("Error sending show week emails:", error);
    showStatus("Error sending emails", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Send Show Week Emails";
  }
}

async function sendUnfilledShiftsEmails() {
  if (selectedUnfilledVolunteers.size === 0) {
    showStatus("Please select at least one volunteer", "error");
    return;
  }

  const btn = document.getElementById("sendUnfilledBtn");
  btn.disabled = true;
  btn.textContent = "Sending...";

  try {
    const response = await fetch("/admin/api/bulk-email/send-unfilled-shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        volunteerIds: Array.from(selectedUnfilledVolunteers),
      }),
    });

    const result = await response.json();
    if (result.success) {
      showStatus(result.message, "success");
      deselectAllUnfilledVolunteers();
    } else {
      showStatus(result.error || "Failed to send emails", "error");
    }
  } catch (error) {
    console.error("Error sending unfilled shifts emails:", error);
    showStatus("Error sending emails", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Send Unfilled Shifts Emails";
  }
}

function showStatus(message, type) {
  const statusElement = document.getElementById("statusMessage");
  statusElement.textContent = message;
  statusElement.className = `status-message ${type} active`;
  setTimeout(() => statusElement.classList.remove("active"), 5000);
}

window.selectAllShowVolunteers = selectAllShowVolunteers;
window.deselectAllShowVolunteers = deselectAllShowVolunteers;
window.selectAllUnfilledVolunteers = selectAllUnfilledVolunteers;
window.deselectAllUnfilledVolunteers = deselectAllUnfilledVolunteers;
window.sendShowWeekEmails = sendShowWeekEmails;
window.sendUnfilledShiftsEmails = sendUnfilledShiftsEmails;
