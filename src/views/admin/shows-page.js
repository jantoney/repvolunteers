// Script for admin shows page
// Global variable for tracking expanded shows
var expandedShows = new Set();
// Display and update current Adelaide time
function updateAdelaideTime() {
  const timeElement = document.getElementById("currentAdelaideTime");
  if (timeElement) {
    const adelaideTZ = window.DateTimeFormat?.ADELAIDE_TIMEZONE;
    const now = new Date();
    const adelaideTime = window.DateTimeFormat?.formatDateTime?.(now);
    // Optionally display adelaideTime
  }
}
updateAdelaideTime();
setInterval(updateAdelaideTime, 60000);
// Global function for toggling show dates
window.toggleDates = async function (showId) {
  const row = document.getElementById(`dates-${showId}`);
  const content = document.getElementById(`dates-content-${showId}`);
  if (expandedShows.has(showId)) {
    row.classList.remove("expanded");
    expandedShows.delete(showId);
  } else {
    row.classList.add("expanded");
    expandedShows.add(showId);
    if (content.textContent === "Loading dates...") {
      try {
        const response = await fetch(`/admin/api/shows/${showId}/dates`, {
          credentials: "include",
        });
        if (response.ok) {
          const dates = await response.json();
          if (dates.length === 0) {
            AdminDOM.setChildren(
              content,
              AdminDOM.el("em", {}, "No performances set"),
            );
          } else {
            const table = AdminDOM.el("table", {
              style: { width: "100%", margin: "0" },
            }, [
              AdminDOM.el(
                "thead",
                {},
                AdminDOM.el("tr", { style: { background: "none" } }, [
                  AdminDOM.el("th", {
                    style: { padding: "0.5rem", border: "none" },
                  }, "Date"),
                  AdminDOM.el("th", {
                    style: { padding: "0.5rem", border: "none" },
                  }, "Performance Time"),
                  AdminDOM.el("th", {
                    style: { padding: "0.5rem", border: "none" },
                  }, "Shifts"),
                  AdminDOM.el("th", {
                    style: { padding: "0.5rem", border: "none" },
                  }, "Actions"),
                ]),
              ),
              AdminDOM.el(
                "tbody",
                {},
                Array.isArray(dates)
                  ? dates.map((date) => {
                    const fillPercentage = date.total_shifts > 0
                      ? (date.filled_shifts / date.total_shifts) * 100
                      : 0;
                    let trafficColor = "grey";
                    if (date.total_shifts > 0) {
                      if (fillPercentage >= 80) trafficColor = "green";
                      else if (fillPercentage >= 50) trafficColor = "yellow";
                      else trafficColor = "red";
                    }
                    const dateForInput =
                      (new Date(date.start_time)).toISOString().split("T")[0];
                    const start = new Date(date.start_time);
                    const end = new Date(date.end_time);
                    const showTimeRange = `${
                      start.getHours().toString().padStart(2, "0")
                    }:${start.getMinutes().toString().padStart(2, "0")} - ${
                      end.getHours().toString().padStart(2, "0")
                    }:${end.getMinutes().toString().padStart(2, "0")}`;
                    const shiftsLabel = date.total_shifts > 0
                      ? date.filled_shifts + "/" + date.total_shifts
                      : "No shifts";
                    const actions = date.total_shifts > 0
                      ? [
                        AdminDOM.el("a", {
                          href:
                            `/admin/shifts?shows=${showId}&date=${dateForInput}`,
                          className: "performance-link",
                        }, "View Shifts"),
                        AdminDOM.el("button", {
                          className: "btn btn-sm btn-info",
                          style: { marginLeft: "8px" },
                          onclick: () =>
                            window.open(
                              `/admin/api/show-dates/${date.id}/run-sheet`,
                              "_blank",
                            ),
                        }, "Run Sheet PDF"),
                      ]
                      : AdminDOM.el(
                        "span",
                        { style: { color: "#6c757d" } },
                        "No shifts",
                      );

                    return AdminDOM.el("tr", {}, [
                      AdminDOM.el(
                        "td",
                        { style: { padding: "0.5rem", border: "none" } },
                        start.toLocaleDateString("en-AU", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }),
                      ),
                      AdminDOM.el("td", {
                        style: { padding: "0.5rem", border: "none" },
                      }, showTimeRange),
                      AdminDOM.el("td", {
                        style: { padding: "0.5rem", border: "none" },
                      }, [
                        AdminDOM.el("span", {
                          className: `traffic-light ${trafficColor}`,
                          style: {
                            width: "16px",
                            height: "16px",
                            marginRight: "6px",
                          },
                          title: date.total_shifts > 0
                            ? date.filled_shifts + "/" + date.total_shifts +
                              " filled"
                            : "No shifts",
                        }),
                        shiftsLabel,
                      ]),
                      AdminDOM.el("td", {
                        style: { padding: "0.5rem", border: "none" },
                      }, actions),
                    ]);
                  })
                  : [],
              ),
            ]);
            AdminDOM.setChildren(content, table);
          }
        } else {
          AdminDOM.setChildren(
            content,
            AdminDOM.el("em", {}, "Error loading performances"),
          );
        }
      } catch (error) {
        console.error("Error:", error);
        AdminDOM.setChildren(
          content,
          AdminDOM.el("em", {}, "Error loading performances"),
        );
      }
    }
  }
};

window.showPastShows = function () {
  const tableBody = document.getElementById("showsTableBody");
  const button = document.getElementById("showPastShowsButton");
  if (!tableBody) return;

  tableBody.classList.remove("past-shows-hidden");
  if (button) {
    button.style.display = "none";
  }
};

// Global function for deleting shows
window.deleteShow = async function (id, name) {
  if (
    !confirm(
      `Delete the production "${name}"? This will also delete its performances and shifts.`,
    )
  ) {
    return;
  }
  try {
    const response = await fetch(`/admin/api/shows/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (response.ok) {
      location.reload();
    } else {
      Modal.error("Error", "Failed to delete production");
    }
  } catch (error) {
    console.error("Error:", error);
    Modal.error("Error", "Error deleting production");
  }
};
