let showVolunteers = [];
let unfilledVolunteers = [];
let availabilityVolunteers = [];
const selectedShowVolunteers = new Set();
const selectedUnfilledVolunteers = new Set();
const selectedAvailabilityVolunteers = new Set();
const emailTypes = new Set([
  "show-week",
  "unfilled-shifts",
  "availability-request",
]);

document.addEventListener("DOMContentLoaded", function () {
  loadEmailDefaults();
  loadShows();
  loadUnfilledVolunteers();
  loadAvailabilityVolunteers();
  setupEventListeners();
  switchEmailType(getEmailTypeFromUrl(), { replaceUrl: true });
});

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return await response.json();
}

async function loadEmailDefaults() {
  try {
    const defaults = await fetchJson("/admin/api/email-defaults");
    setFieldValue("showWeekMessage", defaults.messages?.showWeek || "");
    setFieldValue(
      "unfilledMessage",
      defaults.messages?.lastMinuteShifts || "",
    );
    setFieldValue(
      "availabilityMessage",
      defaults.messages?.availabilityRequest || "",
    );

    [
      "showWeek",
      "unfilled",
      "availability",
    ].forEach((prefix) => {
      setFieldValue(`${prefix}ContactName`, defaults.contactName || "");
      setFieldValue(`${prefix}ContactPhone`, defaults.contactPhone || "");
    });
  } catch (error) {
    console.error("Error loading email defaults:", error);
    showStatus("Error loading email defaults", "error");
  }
}

function setFieldValue(id, value) {
  const field = document.getElementById(id);
  if (field) {
    field.value = value;
  }
}

function getEmailOptions(prefix, messageFieldId) {
  return {
    message: document.getElementById(messageFieldId)?.value || "",
    contactName: document.getElementById(`${prefix}ContactName`)?.value || "",
    contactPhone: document.getElementById(`${prefix}ContactPhone`)?.value || "",
  };
}

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

  globalThis.addEventListener("popstate", () => {
    switchEmailType(getEmailTypeFromUrl(), { updateUrl: false });
  });

  globalThis.addEventListener("hashchange", () => {
    switchEmailType(getEmailTypeFromUrl(), { replaceUrl: true });
  });
}

function getEmailTypeFromUrl() {
  const tab = new URLSearchParams(globalThis.location.search).get("tab");
  if (emailTypes.has(tab)) {
    return tab;
  }

  const hashTab = globalThis.location.hash.replace(/^#/, "");
  if (emailTypes.has(hashTab)) {
    return hashTab;
  }

  return "show-week";
}

function updateTabUrl(emailType, replaceUrl) {
  const url = new URL(globalThis.location.href);
  url.searchParams.set("tab", emailType);
  url.hash = "";

  const method = replaceUrl ? "replaceState" : "pushState";
  globalThis.history[method]({}, "", url);
}

function switchEmailType(emailType, options = {}) {
  const activeEmailType = emailTypes.has(emailType) ? emailType : "show-week";
  const { updateUrl = true, replaceUrl = false } = options;

  document.querySelectorAll(".email-tab").forEach((tab) => {
    const isActive = tab.dataset.emailType === activeEmailType;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  document.querySelectorAll(".email-content").forEach((content) => {
    content.classList.toggle(
      "active",
      content.id === activeEmailType + "-content",
    );
  });

  if (updateUrl) {
    updateTabUrl(activeEmailType, replaceUrl);
  }
}

async function loadShows() {
  try {
    const shows = await fetchJson("/admin/api/bulk-email/shows");
    const select = document.getElementById("showSelect");

    AdminDOM.setChildren(
      select,
      AdminDOM.el("option", { value: "" }, "-- Select a production --"),
    );
    shows.forEach((show) => {
      select.appendChild(
        AdminDOM.el(
          "option",
          {
            value: show.id,
          },
          `${show.name} (${show.volunteers_with_shifts} volunteers with shifts)`,
        ),
      );
    });
  } catch (error) {
    console.error("Error loading shows:", error);
    showStatus("Error loading productions", "error");
  }
}

async function loadShowVolunteers(showId) {
  document.getElementById("loadingState").classList.add("active");

  try {
    showVolunteers = await fetchJson(
      `/admin/api/bulk-email/shows/${showId}/volunteers`,
    );
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
    unfilledVolunteers = await fetchJson(
      "/admin/api/bulk-email/volunteers/unfilled-shifts",
    );
    renderUnfilledVolunteers();
    updateUnfilledSelectionCount();
  } catch (error) {
    console.error("Error loading unfilled volunteers:", error);
    showStatus("Error loading volunteers", "error");
  }
}

async function loadAvailabilityVolunteers() {
  try {
    availabilityVolunteers = await fetchJson(
      "/admin/api/bulk-email/volunteers/availability-request",
    );
    renderAvailabilityVolunteers();
    updateAvailabilitySelectionCount();
  } catch (error) {
    console.error("Error loading availability volunteers:", error);
    showStatus("Error loading volunteers", "error");
  }
}

function hasAvailability(volunteer) {
  return (
    volunteer.eligible_for_availability_request === true ||
    volunteer.has_availability === true ||
    Number(
        volunteer.actionable_shifts_count ??
          volunteer.availability_performances_count ??
          volunteer.unavailable_performances_count ??
          0,
      ) > 0
  );
}

function createVolunteerTable(
  container,
  volunteers,
  columns,
  selection,
  onChange,
  emptyMessage,
) {
  if (volunteers.length === 0) {
    AdminDOM.setChildren(
      container,
      AdminDOM.el("div", { className: "table-empty-state" }, emptyMessage),
    );
    return;
  }

  const hasGroupedColumns = columns.some((column) => column.group);
  const headerRows = hasGroupedColumns ? createGroupedTableHeader(columns) : [
    AdminDOM.el("tr", {}, [
      AdminDOM.el("th", { className: "select-column" }, "Select"),
      ...columns.map((column) =>
        AdminDOM.el(
          "th",
          { className: column.className || "" },
          column.label,
        )
      ),
    ]),
  ];

  const table = AdminDOM.el(
    "table",
    {
      className: hasGroupedColumns
        ? "volunteer-table has-column-groups"
        : "volunteer-table",
    },
    [
      AdminDOM.el(
        "thead",
        {},
        headerRows,
      ),
      AdminDOM.el(
        "tbody",
        {},
        volunteers.map((volunteer) => {
          const isSelectable = hasAvailability(volunteer) ||
            volunteer.has_availability === undefined;
          const volunteerId = String(volunteer.id);
          return AdminDOM.el(
            "tr",
            {
              className: isSelectable ? "" : "volunteer-unavailable",
            },
            [
              AdminDOM.el(
                "td",
                { className: "select-column" },
                AdminDOM.el("input", {
                  type: "checkbox",
                  className: "volunteer-checkbox",
                  dataset: { volunteerId },
                  disabled: !isSelectable,
                  checked: selection.has(volunteerId),
                  title: isSelectable
                    ? "Select volunteer"
                    : "No eligible unfilled shifts",
                  onchange: (event) =>
                    onChange(volunteerId, event.target.checked),
                }),
              ),
              ...columns.map((column) =>
                AdminDOM.el(
                  "td",
                  { className: column.className || "" },
                  column.value(volunteer, isSelectable),
                )
              ),
            ],
          );
        }),
      ),
    ],
  );

  AdminDOM.setChildren(container, table);
}

function createGroupedTableHeader(columns) {
  const firstRow = [
    AdminDOM.el("th", { className: "select-column", rowSpan: 2 }, "Select"),
  ];
  const secondRow = [];

  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index];

    if (!column.group) {
      firstRow.push(
        AdminDOM.el(
          "th",
          { className: column.className || "", rowSpan: 2 },
          column.label,
        ),
      );
      continue;
    }

    if (index === 0 || columns[index - 1].group !== column.group) {
      let colSpan = 1;
      for (
        let nextIndex = index + 1;
        nextIndex < columns.length;
        nextIndex += 1
      ) {
        if (columns[nextIndex].group !== column.group) {
          break;
        }
        colSpan += 1;
      }

      firstRow.push(
        AdminDOM.el(
          "th",
          { colSpan, className: "column-group-heading" },
          column.group,
        ),
      );
    }

    secondRow.push(
      AdminDOM.el(
        "th",
        { className: column.className || "" },
        column.label,
      ),
    );
  }

  return [
    AdminDOM.el("tr", {}, firstRow),
    AdminDOM.el("tr", {}, secondRow),
  ];
}

function availabilityStatus(volunteer) {
  if (volunteer.actionable_shifts_count !== undefined) {
    const count = Number(volunteer.actionable_shifts_count ?? 0);

    if (count === 0) {
      return AdminDOM.el(
        "span",
        { className: "status-pill muted" },
        "No eligible unfilled shifts",
      );
    }

    return AdminDOM.el(
      "span",
      { className: "status-pill" },
      `${count} shift opportunit${count === 1 ? "y" : "ies"}`,
    );
  }

  const count = Number(
    volunteer.availability_performances_count ??
      volunteer.unavailable_performances_count ??
      0,
  );

  if (count === 0) {
    return AdminDOM.el(
      "span",
      { className: "status-pill muted" },
      "No availability saved",
    );
  }

  return AdminDOM.el(
    "span",
    { className: "status-pill" },
    `${count} performance${count === 1 ? "" : "s"}`,
  );
}

function pastShiftCount(volunteer) {
  const total = Number(volunteer.total_shifts ?? 0);
  const upcoming = Number(volunteer.upcoming_shifts ?? 0);
  return Math.max(total - upcoming, 0);
}

function renderShowVolunteers() {
  const container = document.getElementById("showVolunteersList");
  createVolunteerTable(
    container,
    showVolunteers,
    [
      {
        label: "Volunteer",
        className: "volunteer-name-cell",
        value: (volunteer) => volunteer.name,
      },
      { label: "Email", value: (volunteer) => volunteer.email },
      { label: "Shifts", value: (volunteer) => String(volunteer.shift_count) },
      {
        label: "Next Shift",
        value: (volunteer) => volunteer.next_shift_date || "Not scheduled",
      },
    ],
    selectedShowVolunteers,
    updateShowSelection,
    "No volunteers with shifts found for this production.",
  );

  selectedShowVolunteers.clear();
  updateShowSelectionCount();
}

function renderUnfilledVolunteers() {
  const container = document.getElementById("unfilledVolunteersList");
  createVolunteerTable(
    container,
    unfilledVolunteers,
    [
      {
        label: "Volunteer",
        className: "volunteer-name-cell",
        value: (volunteer) => volunteer.name,
      },
      { label: "Email", value: (volunteer) => volunteer.email },
      {
        label: "Eligible shifts",
        value: (volunteer) => availabilityStatus(volunteer),
      },
      {
        label: "Upcoming",
        group: "Shifts",
        value: (volunteer) => String(volunteer.upcoming_shifts),
      },
      {
        label: "Past",
        group: "Shifts",
        value: (volunteer) => String(pastShiftCount(volunteer)),
      },
    ],
    selectedUnfilledVolunteers,
    updateUnfilledSelection,
    "No approved volunteers with email addresses found.",
  );

  selectedUnfilledVolunteers.clear();
  updateUnfilledSelectionCount();
}

function renderAvailabilityVolunteers() {
  const container = document.getElementById("availabilityVolunteersList");
  createVolunteerTable(
    container,
    availabilityVolunteers,
    [
      {
        label: "Volunteer",
        className: "volunteer-name-cell",
        value: (volunteer) => volunteer.name,
      },
      { label: "Email", value: (volunteer) => volunteer.email },
      {
        label: "Open shifts",
        value: (volunteer) => availabilityStatus(volunteer),
      },
    ],
    selectedAvailabilityVolunteers,
    updateAvailabilitySelection,
    "No approved volunteers with email addresses found.",
  );

  selectedAvailabilityVolunteers.clear();
  updateAvailabilitySelectionCount();
}

function updateShowSelection(volunteerId, checked) {
  updateSelection(selectedShowVolunteers, volunteerId, checked);
  updateShowSelectionCount();
}

function updateUnfilledSelection(volunteerId, checked) {
  updateSelection(selectedUnfilledVolunteers, volunteerId, checked);
  updateUnfilledSelectionCount();
}

function updateAvailabilitySelection(volunteerId, checked) {
  updateSelection(selectedAvailabilityVolunteers, volunteerId, checked);
  updateAvailabilitySelectionCount();
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

function updateAvailabilitySelectionCount() {
  const count = selectedAvailabilityVolunteers.size;
  document.getElementById("availabilitySelectionCount").textContent =
    `${count} volunteers selected`;
  document.getElementById("sendAvailabilityBtn").disabled = count === 0;
}

function setAll(containerSelector, selection, checked) {
  const checkboxes = document.querySelectorAll(
    `${containerSelector} .volunteer-checkbox`,
  );
  checkboxes.forEach((checkbox) => {
    if (checkbox.disabled) {
      return;
    }

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

function selectAllAvailabilityVolunteers() {
  setAll("#availabilityVolunteersList", selectedAvailabilityVolunteers, true);
  updateAvailabilitySelectionCount();
}

function deselectAllAvailabilityVolunteers() {
  setAll("#availabilityVolunteersList", selectedAvailabilityVolunteers, false);
  updateAvailabilitySelectionCount();
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
        ...getEmailOptions("showWeek", "showWeekMessage"),
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
    btn.textContent = "Send Show Week Emails";
    updateShowSelectionCount();
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
        ...getEmailOptions("unfilled", "unfilledMessage"),
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
    btn.textContent = "Send Unfilled Shifts Emails";
    updateUnfilledSelectionCount();
  }
}

async function sendAvailabilityRequestEmails() {
  if (selectedAvailabilityVolunteers.size === 0) {
    showStatus("Please select at least one volunteer", "error");
    return;
  }

  const btn = document.getElementById("sendAvailabilityBtn");
  btn.disabled = true;
  btn.textContent = "Sending...";

  try {
    const response = await fetch(
      "/admin/api/bulk-email/send-availability-request",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volunteerIds: Array.from(selectedAvailabilityVolunteers),
          ...getEmailOptions("availability", "availabilityMessage"),
        }),
      },
    );

    const result = await response.json();
    if (result.success) {
      showStatus(result.message, "success");
      deselectAllAvailabilityVolunteers();
    } else {
      showStatus(result.error || "Failed to send emails", "error");
    }
  } catch (error) {
    console.error("Error sending availability request emails:", error);
    showStatus("Error sending emails", "error");
  } finally {
    btn.textContent = "Send Availability Requests";
    updateAvailabilitySelectionCount();
  }
}

function showStatus(message, type) {
  const statusElement = document.getElementById("statusMessage");
  statusElement.textContent = message;
  statusElement.className = `status-message ${type} active`;
  setTimeout(() => statusElement.classList.remove("active"), 5000);
}

globalThis.selectAllShowVolunteers = selectAllShowVolunteers;
globalThis.deselectAllShowVolunteers = deselectAllShowVolunteers;
globalThis.selectAllUnfilledVolunteers = selectAllUnfilledVolunteers;
globalThis.deselectAllUnfilledVolunteers = deselectAllUnfilledVolunteers;
globalThis.selectAllAvailabilityVolunteers = selectAllAvailabilityVolunteers;
globalThis.deselectAllAvailabilityVolunteers =
  deselectAllAvailabilityVolunteers;
globalThis.sendShowWeekEmails = sendShowWeekEmails;
globalThis.sendUnfilledShiftsEmails = sendUnfilledShiftsEmails;
globalThis.sendAvailabilityRequestEmails = sendAvailabilityRequestEmails;
