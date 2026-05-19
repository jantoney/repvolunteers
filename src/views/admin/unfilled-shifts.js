let currentShiftId = null;

document.addEventListener("DOMContentLoaded", function () {
  console.log("Unfilled shifts page loaded");
});

async function assignParticipant(shiftId) {
  currentShiftId = shiftId;
  const modal = document.getElementById("assignmentModal");
  const modalContent = document.getElementById("modalContent");

  // Show modal
  modal.style.display = "block";
  AdminDOM.setChildren(
    modalContent,
    AdminDOM.el("p", {}, "Loading available participants..."),
  );

  try {
    // Fetch available participants for this shift
    const response = await fetch(
      `/admin/api/shifts/${shiftId}/available-volunteers`,
      {
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch participants");
    }

    const participants = await response.json();

    if (participants.length === 0) {
      AdminDOM.setChildren(modalContent, [
        AdminDOM.el(
          "p",
          {},
          "No available participants found. All participants may already be assigned to this shift.",
        ),
        AdminDOM.el(
          "div",
          { style: { marginTop: "1rem" } },
          AdminDOM.el("button", {
            className: "btn btn-secondary",
            onclick: closeAssignmentModal,
          }, "Close"),
        ),
      ]);
      return;
    }

    AdminDOM.setChildren(modalContent, [
      AdminDOM.el(
        "div",
        { className: "participant-list" },
        participants.map((participant) =>
          AdminDOM.el("div", {
            className: "participant-item",
            onclick: () => selectParticipant(participant.id),
          }, [
            AdminDOM.el("div", { className: "participant-info" }, [
              AdminDOM.el(
                "div",
                { className: "participant-name" },
                participant.name,
              ),
              AdminDOM.el(
                "div",
                { className: "participant-details" },
                participant.email +
                  (participant.phone ? " | " + participant.phone : ""),
              ),
            ]),
            AdminDOM.el(
              "button",
              { className: "btn btn-sm btn-primary" },
              "Assign",
            ),
          ])
        ),
      ),
      AdminDOM.el(
        "div",
        { style: { marginTop: "1rem" } },
        AdminDOM.el("button", {
          className: "btn btn-secondary",
          onclick: closeAssignmentModal,
        }, "Cancel"),
      ),
    ]);
  } catch (error) {
    console.error("Error loading participants:", error);
    AdminDOM.setChildren(modalContent, [
      AdminDOM.el(
        "p",
        { style: { color: "#dc3545" } },
        "Error loading participants. Please try again.",
      ),
      AdminDOM.el(
        "div",
        { style: { marginTop: "1rem" } },
        AdminDOM.el("button", {
          className: "btn btn-secondary",
          onclick: closeAssignmentModal,
        }, "Close"),
      ),
    ]);
  }
}

async function selectParticipant(participantId) {
  if (!currentShiftId) return;

  try {
    const response = await fetch("/admin/api/volunteer-shifts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        volunteerId: participantId,
        shiftId: currentShiftId,
      }),
    });

    if (response.ok) {
      closeAssignmentModal(); // Reload the page to show updated shifts
      globalThis.location.reload();
    } else {
      const error = await response.json();
      alert("Error assigning participant: " + (error.error || "Unknown error"));
    }
  } catch (error) {
    console.error("Error assigning participant:", error);
    alert("Error assigning participant. Please try again.");
  }
}

function closeAssignmentModal() {
  const modal = document.getElementById("assignmentModal");
  modal.style.display = "none";
  currentShiftId = null;
}

// Close modal when clicking outside of it
globalThis.onclick = function (event) {
  const modal = document.getElementById("assignmentModal");
  if (event.target === modal) {
    closeAssignmentModal();
  }
};

// Download PDF function
function downloadPDF() {
  const pdfButton = document.getElementById("pdfButton");
  const originalText = pdfButton.textContent;

  try {
    pdfButton.disabled = true;
    pdfButton.textContent = "Generating...";

    // Open the PDF in a new tab/window
    const pdfUrl = "/admin/api/unfilled-shifts/pdf";
    globalThis.open(pdfUrl, "_blank");

    // Reset button after a short delay
    setTimeout(() => {
      pdfButton.disabled = false;
      pdfButton.textContent = "PDF Generated!";

      // Reset to original text after 2 seconds
      setTimeout(() => {
        pdfButton.textContent = originalText;
      }, 2000);
    }, 1000);
  } catch (error) {
    console.error("PDF generation failed:", error);
    pdfButton.disabled = false;
    pdfButton.textContent = originalText;

    if (typeof Modal !== "undefined") {
      Modal.error("Error", "Failed to generate PDF. Please try again.");
    } else {
      alert("Failed to generate PDF. Please try again.");
    }
  }
}
