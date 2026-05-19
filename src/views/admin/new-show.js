// Global variables
let currentDate = new Date();
let selectedDates = [];
let lastCreatedShowId = null;
let showIntervals = []; // Store intervals temporarily until show is created

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const defaultShowTimes = {
  startTime: { hour: "12", minute: "00", ampm: "PM", value: "12:00" },
  endTime: { hour: "01", minute: "00", ampm: "PM", value: "13:00" },
};

function resetTimeInput(inputId) {
  const defaults = defaultShowTimes[inputId];
  document.getElementById(inputId + "-hour").value = defaults.hour;
  document.getElementById(inputId + "-minute").value = defaults.minute;
  document.getElementById(inputId + "-ampm").value = defaults.ampm;
  document.getElementById(inputId).value = defaults.value;
}

function resetShowTimes() {
  resetTimeInput("startTime");
  resetTimeInput("endTime");
}

// Function to create time dropdowns with 15-minute increments
function setupTimeInputs() {
  const timeInputs = ["startTime", "endTime"];

  timeInputs.forEach((inputId) => {
    const originalInput = document.getElementById(inputId);
    const originalContainer = originalInput.parentNode;

    // Create custom select elements
    const hourSelect = document.createElement("select");
    hourSelect.id = inputId + "-hour";
    hourSelect.className = "time-select hour-select";
    hourSelect.required = true;

    const minuteSelect = document.createElement("select");
    minuteSelect.id = inputId + "-minute";
    minuteSelect.className = "time-select minute-select";
    minuteSelect.required = true;

    const ampmSelect = document.createElement("select");
    ampmSelect.id = inputId + "-ampm";
    ampmSelect.className = "time-select ampm-select";

    // Add hours (12-hour format)
    for (let i = 1; i <= 12; i++) {
      const option = document.createElement("option");
      option.value = String(i).padStart(2, "0");
      option.textContent = String(i);
      hourSelect.appendChild(option);
    }

    // Add minutes (00, 15, 30, 45)
    ["00", "15", "30", "45"].forEach((minute) => {
      const option = document.createElement("option");
      option.value = minute;
      option.textContent = minute;
      minuteSelect.appendChild(option);
    });

    // Add AM/PM
    ["AM", "PM"].forEach((period) => {
      const option = document.createElement("option");
      option.value = period;
      option.textContent = period;
      ampmSelect.appendChild(option);
    });

    // Create container for selects
    const timeSelectContainer = document.createElement("div");
    timeSelectContainer.className = "time-select-container";
    timeSelectContainer.style.display = "flex";
    timeSelectContainer.style.gap = "0.5rem";
    timeSelectContainer.style.alignItems = "center";

    originalInput.type = "hidden";

    // Function to update the hidden input value
    function updateTimeValue() {
      const hour = parseInt(hourSelect.value);
      const minute = minuteSelect.value;
      const ampm = ampmSelect.value;

      // Convert to 24-hour format
      let hour24 = hour;
      if (ampm === "PM" && hour < 12) hour24 += 12;
      if (ampm === "AM" && hour === 12) hour24 = 0;

      // Format as HH:MM
      const timeValue = String(hour24).padStart(2, "0") + ":" + minute;
      originalInput.value = timeValue;
    }

    // Add event listeners
    hourSelect.addEventListener("change", updateTimeValue);
    minuteSelect.addEventListener("change", updateTimeValue);
    ampmSelect.addEventListener("change", updateTimeValue);

    // Add elements to the container
    timeSelectContainer.appendChild(hourSelect);
    timeSelectContainer.appendChild(document.createTextNode(":"));
    timeSelectContainer.appendChild(minuteSelect);
    timeSelectContainer.appendChild(ampmSelect);

    // Replace the original input with our custom selector
    originalContainer.insertBefore(timeSelectContainer, originalInput);

    const defaults = defaultShowTimes[inputId];
    hourSelect.value = defaults.hour;
    minuteSelect.value = defaults.minute;
    ampmSelect.value = defaults.ampm;

    // Initialize the hidden input
    updateTimeValue();
  });
}

// Handle show type radio button changes
function initializeShowTypeHandlers() {
  document.querySelectorAll('input[name="showType"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      const newShowName = document.getElementById("newShowName");
      const existingShowSelect = document.getElementById("existingShowSelect");
      const nameInput = document.getElementById("name");
      const existingShowInput = document.getElementById("existingShow");

      if (this.value === "new") {
        newShowName.classList.remove("hidden");
        existingShowSelect.classList.add("hidden");
        nameInput.required = true;
        existingShowInput.required = false;
      } else {
        newShowName.classList.add("hidden");
        existingShowSelect.classList.remove("hidden");
        nameInput.required = false;
        existingShowInput.required = true;
      }
    });
  });
}

function renderCalendar() {
  console.log("Starting renderCalendar function");
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const currentMonthElement = document.getElementById("currentMonth");
  if (!currentMonthElement) {
    console.error("Cannot find #currentMonth element");
    return;
  }

  currentMonthElement.textContent = monthNames[month] + " " + year;

  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const calendarGrid = document.getElementById("calendarGrid");
  AdminDOM.clear(calendarGrid);

  // Add day headers
  for (const dayName of dayNames) {
    const dayHeader = document.createElement("div");
    dayHeader.className = "calendar-header-day";
    dayHeader.textContent = dayName;
    calendarGrid.appendChild(dayHeader);
  }

  // Add calendar days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 42; i++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + i);

    const dayElement = document.createElement("div");
    dayElement.className = "calendar-day";
    dayElement.textContent = currentDay.getDate();

    const dateString = currentDay.getFullYear() + "-" +
      String(currentDay.getMonth() + 1).padStart(2, "0") + "-" +
      String(currentDay.getDate()).padStart(2, "0");

    if (currentDay.getMonth() !== month) {
      dayElement.classList.add("other-month");
    }

    if (currentDay.getTime() === today.getTime()) {
      dayElement.classList.add("today");
    }

    if (selectedDates.includes(dateString)) {
      dayElement.classList.add("selected");
    }

    dayElement.addEventListener(
      "click",
      () => selectDate(dateString, dayElement),
    );
    calendarGrid.appendChild(dayElement);
  }
}

function selectDate(dateString, element) {
  const index = selectedDates.indexOf(dateString);
  if (index > -1) {
    selectedDates.splice(index, 1);
    element.classList.remove("selected");
  } else {
    selectedDates.push(dateString);
    element.classList.add("selected");
  }
  updateSelectedDatesDisplay();
}

function updateSelectedDatesDisplay() {
  console.log("Updating selected dates display");
  const display = document.getElementById("selectedDatesDisplay");
  if (!display) {
    console.error("Cannot find #selectedDatesDisplay element");
    return;
  }

  if (selectedDates.length === 0) {
    AdminDOM.setChildren(
      display,
      AdminDOM.el("em", {}, "No performances selected"),
    );
  } else {
    AdminDOM.setChildren(
      display,
      selectedDates.sort().map((dateString) => {
        const [year, month, day] = dateString.split("-");
        return AdminDOM.el(
          "span",
          { className: "selected-date-item" },
          day + "/" + month + "/" + year,
        );
      }),
    );
  }
}

// Interval management functions
function renderIntervals() {
  const container = document.getElementById("intervalsList");

  if (showIntervals.length === 0) {
    AdminDOM.setChildren(
      container,
      AdminDOM.el(
        "p",
        {},
        AdminDOM.el("em", {}, "No performance intervals added."),
      ),
    );
    return;
  }

  AdminDOM.setChildren(
    container,
    showIntervals.map((interval, index) => {
      const startHours = Math.floor(interval.start_minutes / 60);
      const startMins = interval.start_minutes % 60;
      const startTime = startHours > 0
        ? `${startHours}h ${startMins}m`
        : `${startMins}m`;
      const endMinutes = interval.start_minutes + interval.duration_minutes;
      const endHours = Math.floor(endMinutes / 60);
      const endMinsDisplay = endMinutes % 60;
      const endTime = endHours > 0
        ? `${endHours}h ${endMinsDisplay}m`
        : `${endMinsDisplay}m`;

      return AdminDOM.el("div", { className: "interval-item" }, [
        AdminDOM.el(
          "span",
          {},
          `Interval: ${startTime} - ${endTime} (${interval.duration_minutes} min)`,
        ),
        AdminDOM.el("button", {
          type: "button",
          className: "btn btn-danger btn-sm",
          onclick: () => globalThis.removeInterval(index),
        }, "Remove"),
      ]);
    }),
  );
}

globalThis.addInterval = function () {
  const startMinutes = document.getElementById("newIntervalStart").value;
  const duration = document.getElementById("newIntervalDuration").value;

  if (!startMinutes || !duration) {
    showError("Enter both interval start and duration.");
    return;
  }

  if (parseInt(startMinutes) < 0 || parseInt(duration) < 1) {
    showError("Use positive numbers for interval start and duration.");
    return;
  }

  // Check for overlapping intervals
  const newStart = parseInt(startMinutes);
  const newEnd = newStart + parseInt(duration);

  for (const existing of showIntervals) {
    const existingStart = existing.start_minutes;
    const existingEnd = existingStart + existing.duration_minutes;

    if (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    ) {
      showError("This interval overlaps another interval.");
      return;
    }
  }

  showIntervals.push({
    start_minutes: parseInt(startMinutes),
    duration_minutes: parseInt(duration),
  });

  // Clear form
  document.getElementById("newIntervalStart").value = "";
  document.getElementById("newIntervalDuration").value = "";

  renderIntervals();
  showSuccess("Performance interval added.");
};

globalThis.removeInterval = function (index) {
  showIntervals.splice(index, 1);
  renderIntervals();
  showSuccess("Performance interval removed.");
};

async function addIntervalsToShow(showId) {
  for (const interval of showIntervals) {
    try {
      await fetch(`/admin/api/shows/${showId}/intervals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(interval),
        credentials: "include",
      });
    } catch (error) {
      console.error("Error adding interval:", error);
    }
  }
}

function clearForm() {
  document.getElementById("name").value = "";
  resetShowTimes();
  document.getElementById("existingShow").value = "";
  selectedDates = [];
  showIntervals = []; // Clear intervals

  // Reset to "Create New Production" option unless we just created a production
  if (lastCreatedShowId === null) {
    document.querySelector('input[name="showType"][value="new"]').checked =
      true;
    document.getElementById("newShowName").classList.remove("hidden");
    document.getElementById("existingShowSelect").classList.add("hidden");
    document.getElementById("name").required = true;
    document.getElementById("existingShow").required = false;
  }

  renderCalendar();
  updateSelectedDatesDisplay();
  renderIntervals();
  hideMessages();
}

function hideMessages() {
  document.getElementById("successMessage").style.display = "none";
  document.getElementById("errorMessage").style.display = "none";
}

function showSuccess(message) {
  const element = document.getElementById("successMessage");
  element.textContent = message;
  element.style.display = "block";
  setTimeout(() => element.style.display = "none", 5000);
}

function showError(message) {
  const element = document.getElementById("errorMessage");
  element.textContent = message;
  element.style.display = "block";
}

function initializeEventListeners() {
  // Calendar navigation
  document.getElementById("prevMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById("nextMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  // Form buttons
  document.getElementById("clearForm").addEventListener("click", clearForm);

  // Form submission
  document.getElementById("showForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessages();

    const showType =
      document.querySelector('input[name="showType"]:checked').value;
    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;

    if (selectedDates.length === 0) {
      showError("Select at least one performance.");
      return;
    }

    if (!startTime || !endTime) {
      showError("Enter the performance start and end times.");
      return;
    }

    let showName, showId;

    if (showType === "new") {
      showName = document.getElementById("name").value;
      if (!showName) {
        showError("Enter a production name.");
        return;
      }
    } else {
      showId = document.getElementById("existingShow").value;
      if (!showId) {
        showError("Select a production.");
        return;
      }
      // Find the production name from the dropdown
      const selectElement = document.getElementById("existingShow");
      showName = selectElement.options[selectElement.selectedIndex].text;
    }

    // For each selected date, combine with the start and end times
    const performances = selectedDates.map((date) => {
      return {
        start_time: date + "T" + startTime + ":00",
        end_time: date + "T" + endTime + ":00",
      };
    });

    try {
      const response = await fetch("/admin/api/shows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: showName,
          performances,
          existingShowId: showType === "existing" ? parseInt(showId) : null,
        }),
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        const successful = result.results.filter((r) => r.success);
        const failed = result.results.filter((r) => !r.success);

        let message = "Added " + successful.length +
          " performance(s) to '" + showName + "'.";
        if (failed.length > 0) {
          message += " " + failed.length +
            " duplicate performance(s) skipped.";
        }

        // Store the created/updated show ID
        lastCreatedShowId = result.showId;

        // Add intervals if any were defined
        if (showIntervals.length > 0) {
          await addIntervalsToShow(lastCreatedShowId);
          message += " " + showIntervals.length +
            " performance interval(s) added.";
        }

        showSuccess(message);

        // Switch to "Add Performances to Existing Production" and select the production we just worked with
        document.querySelector('input[name="showType"][value="existing"]')
          .checked = true;
        document.getElementById("newShowName").classList.add("hidden");
        document.getElementById("existingShowSelect").classList.remove(
          "hidden",
        );
        document.getElementById("name").required = false;
        document.getElementById("existingShow").required = true;
        document.getElementById("existingShow").value = lastCreatedShowId;

        // Clear only the dates and times, keep the production selected
        resetShowTimes();
        selectedDates = [];
        // Don't clear intervals in case user wants to add more performances with the same intervals
        renderCalendar();
        updateSelectedDatesDisplay();
      } else {
        showError("We could not save these performances. Please try again.");
      }
    } catch (_error) {
      showError("We could not save these performances. Please try again.");
    }
  });
}

// Initialize the page
function initializePage() {
  try {
    console.log("Initializing new show page...");
    renderCalendar();
    console.log("Calendar rendered successfully");
    updateSelectedDatesDisplay();
    renderIntervals();
    console.log("Setting up time inputs...");
    setupTimeInputs();
    console.log("Time inputs set up successfully");
    initializeShowTypeHandlers();
    initializeEventListeners();
    console.log("Page initialization complete");
  } catch (error) {
    console.error("Error initializing page:", error);
  }
}

// Initialize when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePage);
} else {
  initializePage();
}
