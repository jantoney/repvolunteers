document.addEventListener("DOMContentLoaded", function () {
  const defaultRoles = [
    "FOH Manager",
    "FOH 2IC",
    "Usher 1 (Can see show)",
    "Usher 2 (Can see show)",
    "Usher 3 (Can see show)",
    "Tea and Coffee 1 (Can see show)",
    "Tea and Coffee 2 (Can see show)",
    "Raffle Ticket Selling (Can see show)",
    "Box Office (Can see show)",
    "FOH Door (Can see show)",
  ];
  const customRoles = [];
  const allRoles = [...defaultRoles];
  let isSubmitting = false;
  let isCreateComplete = false;
  let createCompleteTimer;

  function getSelectedPerformanceCount() {
    return document.querySelectorAll("#showDatesList input:checked").length;
  }

  function getSelectedRoleCount() {
    return document.querySelectorAll(
      "#defaultRolesList input:checked, #customRolesList input:checked",
    ).length;
  }

  function setSectionVisible(elementId, isVisible) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = isVisible ? "block" : "none";
    }
  }

  function updateSubmitState() {
    const button = document.getElementById("createShiftsButton");
    const submitHelp = document.getElementById("submitHelp");
    if (!button || !submitHelp) return;

    const hasPerformance = getSelectedPerformanceCount() > 0;
    const hasRole = getSelectedRoleCount() > 0;
    button.disabled = isSubmitting || !hasPerformance || !hasRole;

    if (isSubmitting) {
      button.classList.remove("create-complete");
      button.textContent = "Creating Shifts...";
    } else if (isCreateComplete) {
      button.classList.add("create-complete");
      button.disabled = true;
      button.textContent = "Shifts Created OK";
      submitHelp.textContent =
        "Created OK. Select roles again before creating another set of shifts.";
      return;
    } else {
      button.classList.remove("create-complete");
      button.textContent = "Create Shifts";
    }

    if (!hasPerformance) {
      submitHelp.textContent =
        "Select at least one performance before choosing roles.";
    } else if (!hasRole) {
      submitHelp.textContent = "Select at least one role to create shifts.";
    } else {
      submitHelp.textContent = "Ready to create shifts.";
    }
  }

  function updateProgressiveSections() {
    const showId = document.getElementById("show_id").value;
    const hasProduction = Boolean(showId);
    const hasPerformance = getSelectedPerformanceCount() > 0;

    if (!hasProduction) {
      setSectionVisible("showDatesSection", false);
      setSectionVisible("dateFilterActions", false);
    }

    setSectionVisible("timeSection", hasPerformance);
    setSectionVisible("rolesSection", hasPerformance);
    updateSubmitState();
  }

  function clearSelectedRoles() {
    document
      .querySelectorAll(
        "#defaultRolesList input:checked, #customRolesList input:checked",
      )
      .forEach((checkbox) => {
        checkbox.checked = false;
        const checkboxItem = checkbox.closest(".checkbox-item");
        if (checkboxItem) {
          checkboxItem.classList.remove("checked");
        }
      });
    updateSubmitState();
  }

  function showCreateCompleteState() {
    clearTimeout(createCompleteTimer);
    isCreateComplete = true;
    updateSubmitState();

    createCompleteTimer = setTimeout(() => {
      isCreateComplete = false;
      updateSubmitState();
    }, 4500);
  }

  globalThis.updateNewShiftFormState = updateProgressiveSections;

  // Load default roles
  function loadDefaultRoles() {
    const container = document.getElementById("defaultRolesList");
    AdminDOM.setChildren(
      container,
      defaultRoles.map((role, index) => {
        const id = `role_default_${index}`;
        return AdminDOM.el(
          "div",
          {
            className: "checkbox-item",
            dataset: { checkbox: id },
          },
          [
            AdminDOM.el("input", { type: "checkbox", id, value: role }),
            AdminDOM.el("label", { htmlFor: id }, role),
          ],
        );
      }),
    );

    // Add click handlers to make entire tile clickable
    addCheckboxItemClickHandlers("#defaultRolesList");
  }

  // Function to add click handlers to checkbox items
  function addCheckboxItemClickHandlers(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    if (container.dataset.checkboxHandlers === "true") return;
    container.dataset.checkboxHandlers = "true";

    container.addEventListener("click", function (e) {
      const checkboxItem = e.target.closest(".checkbox-item");
      if (!checkboxItem) return;

      const checkboxId = checkboxItem.getAttribute("data-checkbox");
      if (!checkboxId) return;

      const checkbox = document.getElementById(checkboxId);
      if (!checkbox) return;

      // Toggle checkbox
      checkbox.checked = !checkbox.checked;

      // Update visual state
      updateCheckboxItemState(checkboxItem, checkbox.checked);
      updateProgressiveSections();

      // Prevent event bubbling
      e.stopPropagation();
    });

    // Also add direct checkbox change listeners to keep visual state in sync
    container.addEventListener("change", function (e) {
      if (e.target.type === "checkbox") {
        const checkboxItem = e.target.closest(".checkbox-item");
        if (checkboxItem) {
          updateCheckboxItemState(checkboxItem, e.target.checked);
        }
        updateProgressiveSections();
      }
    });
  }

  // Function to update visual state of checkbox item
  function updateCheckboxItemState(checkboxItem, isChecked) {
    if (isChecked) {
      checkboxItem.classList.add("checked");
    } else {
      checkboxItem.classList.remove("checked");
    }
  }

  // Function to create time group buttons
  function createTimeGroupButtons(dates) {
    const timeGroupActions = document.getElementById("timeGroupActions");

    // Group dates by their show times
    const timeGroups = {};
    dates.forEach((date) => {
      const timeKey = `${DateTimeFormat.formatTime(date.start_time)} to ${DateTimeFormat.formatTime(
        date.end_time,
      )}`;
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = {
          dates: [],
          start_time: date.start_time,
          end_time: date.end_time,
        };
      }
      timeGroups[timeKey].dates.push(date);
    });

    // Create buttons for each time group (only if there are multiple groups)
    const timeGroupKeys = Object.keys(timeGroups);
    if (timeGroupKeys.length > 1) {
      AdminDOM.setChildren(
        timeGroupActions,
        timeGroupKeys.flatMap((timeKey) => {
          const group = timeGroups[timeKey];
          const count = group.dates.length;
          const [startTime, endTime] = timeKey.split(" to ");
          return [
            AdminDOM.el(
              "button",
              {
                type: "button",
                className: "filter-btn",
                style: { marginRight: "0.5rem" },
                onclick: () =>
                  globalThis.selectTimeGroup(
                    startTime,
                    endTime,
                    group.start_time,
                    group.end_time,
                  ),
              },
              `Select ${timeKey} (${count})`,
            ),
            AdminDOM.el(
              "button",
              {
                type: "button",
                className: "filter-btn",
                style: { marginRight: "1rem" },
                onclick: () => globalThis.deselectTimeGroup(startTime, endTime),
              },
              `Deselect ${timeKey}`,
            ),
          ];
        }),
      );
    } else {
      AdminDOM.clear(timeGroupActions);
    }

    return timeGroupKeys.length;
  }

  // Show selector changed
  document
    .getElementById("show_id")
    .addEventListener("change", async function () {
      const showId = this.value;
      const section = document.getElementById("showDatesSection");
      const container = document.getElementById("showDatesList");

      if (!showId) {
        section.style.display = "none";
        document.getElementById("dateFilterActions").style.display = "none";
        AdminDOM.clear(container);
        AdminDOM.clear(document.getElementById("timeGroupActions"));
        updateProgressiveSections();
        return;
      }

      try {
        const response = await fetch(`/admin/api/shows/${showId}/dates`, {
          credentials: "include",
        });

        if (response.ok) {
          const dates = await response.json();
          const timeGroupCount = createTimeGroupButtons(dates);
          const shouldPreselectDates = timeGroupCount <= 1;
          AdminDOM.setChildren(
            container,
            dates.map((date) => {
              const id = `date_${date.id}`;
              return AdminDOM.el(
                "div",
                {
                  className: shouldPreselectDates
                    ? "checkbox-item checked"
                    : "checkbox-item",
                  dataset: { checkbox: id },
                },
                [
                  AdminDOM.el("input", {
                    type: "checkbox",
                    id,
                    value: date.id,
                    checked: shouldPreselectDates,
                  }),
                  AdminDOM.el(
                    "label",
                    { htmlFor: id },
                    `${DateTimeFormat.formatDate(date.date)} - ${DateTimeFormat.formatTime(
                      date.start_time,
                    )} to ${DateTimeFormat.formatTime(date.end_time)}`,
                  ),
                ],
              );
            }),
          );
          section.style.display = "block";

          // Show date filter actions
          document.getElementById("dateFilterActions").style.display = "block";

          // Add click handlers for show dates
          addCheckboxItemClickHandlers("#showDatesList");

          // Initialize visual states for pre-checked items
          container.querySelectorAll(".checkbox-item").forEach((item) => {
            const checkboxId = item.getAttribute("data-checkbox");
            const checkbox = document.getElementById(checkboxId);
            if (checkbox && checkbox.checked) {
              item.classList.add("checked");
            }
          });

          updateProgressiveSections();

          if (!shouldPreselectDates) {
            const firstTimeGroupButton = document.querySelector(
              "#timeGroupActions button",
            );
            if (firstTimeGroupButton) {
              firstTimeGroupButton.focus();
            }
          }
        }
      } catch (_error) {
        console.error("Error loading show dates:", _error);
      }
    });
  // Time change handlers
  document
    .getElementById("arrive_time")
    .addEventListener("change", checkNextDay);
  document
    .getElementById("depart_time")
    .addEventListener("change", checkNextDay);

  // Show time picker on focus for better mobile experience
  document.getElementById("arrive_time").addEventListener("focus", function () {
    if (this.showPicker) {
      this.showPicker();
    }
  });

  document.getElementById("depart_time").addEventListener("focus", function () {
    if (this.showPicker) {
      this.showPicker();
    }
  });

  function checkNextDay() {
    const arriveTime = document.getElementById("arrive_time").value;
    const departTime = document.getElementById("depart_time").value;
    const warning = document.getElementById("nextDayWarning");

    if (arriveTime && departTime && departTime < arriveTime) {
      warning.style.display = "block";
    } else {
      warning.style.display = "none";
    }
  }
  // Add custom role
  document
    .getElementById("addCustomRole")
    .addEventListener("click", function () {
      const input = document.getElementById("customRole");
      const roleName = input.value.trim();

      if (!roleName) return;

      if (allRoles.includes(roleName)) {
        if (typeof Modal !== "undefined") {
          Modal.error("Error", "Role already exists");
        } else {
          alert("Role already exists");
        }
        return;
      }

      customRoles.push(roleName);
      allRoles.push(roleName);

      const container = document.getElementById("customRolesList");
      const newRole = document.createElement("div");
      newRole.className = "checkbox-item checked";
      const id = `role_custom_${customRoles.length}`;
      newRole.setAttribute("data-checkbox", id);
      AdminDOM.setChildren(newRole, [
        AdminDOM.el("input", {
          type: "checkbox",
          id,
          value: roleName,
          checked: true,
        }),
        AdminDOM.el("label", { htmlFor: id }, roleName),
      ]);
      container.appendChild(newRole);

      input.value = "";
      document.getElementById("customRoleWarning").style.display = "none";
      updateProgressiveSections();
    });

  // Show warning when custom role is typed but not added
  document.getElementById("customRole").addEventListener("input", function () {
    const warning = document.getElementById("customRoleWarning");
    if (this.value.trim()) {
      warning.style.display = "block";
    } else {
      warning.style.display = "none";
    }
  });

  // Allow Enter key to add custom role
  document
    .getElementById("customRole")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        document.getElementById("addCustomRole").click();
      }
    });
  // Form submission
  document
    .getElementById("shiftForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      if (isSubmitting) return;

      // Check if there's an unsaved custom role
      const customRoleInput = document.getElementById("customRole");
      if (customRoleInput.value.trim()) {
        const confirmAdd = confirm(
          "You have entered a custom role name but haven't added it yet. Would you like to add it now?",
        );
        if (confirmAdd) {
          document.getElementById("addCustomRole").click();
          // Don't proceed with form submission yet, let user review
          return;
        } else {
          const confirmProceed = confirm(
            "Are you sure you want to proceed without adding the custom role?",
          );
          if (!confirmProceed) {
            return;
          }
        }
      }

      const formData = new FormData(e.target);
      const showId = formData.get("show_id");
      const arriveTime = formData.get("arrive_time");
      const departTime = formData.get("depart_time");

      // Get selected show dates
      const selectedDates = Array.from(
        document.querySelectorAll("#showDatesList input:checked"),
      ).map((input) => input.value);

      if (selectedDates.length === 0) {
        showError("Please select at least one performance");
        return;
      }
      // Get selected roles - use more specific selectors to avoid the '8' issue
      const selectedRoles = Array.from(
        document.querySelectorAll(
          "#defaultRolesList input:checked, #customRolesList input:checked",
        ),
      ).map((input) => input.value);

      if (selectedRoles.length === 0) {
        showError("Please select at least one role");
        return;
      }

      const data = {
        showId: parseInt(showId),
        showDateIds: selectedDates.map((id) => parseInt(id)),
        arriveTime,
        departTime,
        roles: selectedRoles,
      };

      isSubmitting = true;
      updateSubmitState();

      try {
        const response = await fetch("/admin/api/shifts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        });
        if (response.ok) {
          const result = await response.json();
          const successCount = result.results.filter((r) => r.success).length;
          const totalDates = selectedDates.length;
          const totalRoles = selectedRoles.length;
          const nextDayShifts = result.results.filter(
            (r) => r.nextDay && r.success,
          );
          const nextDayMessage =
            nextDayShifts.length > 0
              ? ` ${nextDayShifts.length} shift${
                  nextDayShifts.length > 1 ? "s were" : " was"
                } saved with the depart time on the following day.`
              : "";

          showSuccess(
            `Shifts created successfully. Created ${successCount} shifts across ${totalDates} performance${
              totalDates > 1 ? "s" : ""
            } and ${totalRoles} role${
              totalRoles > 1 ? "s" : ""
            }. Selected roles have been cleared to prevent accidental duplicates.${nextDayMessage}`,
          );
          clearSelectedRoles();
          showCreateCompleteState();
        } else {
          const error = await response.json();
          showError(error.error || "Failed to create shifts");
        }
      } catch (_error) {
        console.error("Error creating shifts:", _error);
        showError("Error creating shifts");
      } finally {
        isSubmitting = false;
        updateSubmitState();
      }
    });

  function showSuccess(message) {
    const el = document.getElementById("successMessage");
    el.textContent = message;
    el.style.display = "block";
    document.getElementById("errorMessage").style.display = "none";
  }

  function showError(message) {
    const el = document.getElementById("errorMessage");
    el.textContent = message;
    el.style.display = "block";
    document.getElementById("successMessage").style.display = "none";
    el.focus();
  }

  // Initialize
  loadDefaultRoles();

  // Set up click handlers for custom roles container (even though it starts empty)
  addCheckboxItemClickHandlers("#customRolesList");
  updateProgressiveSections();
});
