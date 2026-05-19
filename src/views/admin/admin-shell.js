(function () {
  function toggleMobileMenu() {
    const navMenu = document.getElementById("navMenu");
    if (navMenu) {
      navMenu.classList.toggle("active");
    }
  }

  function toggleMobileDropdown(event) {
    if (window.innerWidth > 768) {
      return;
    }
    event.preventDefault();
    const dropdown = event.target.closest(".dropdown");
    if (dropdown) {
      dropdown.classList.toggle("active");
    }
  }

  function closeMobileNavigation(event) {
    const navMenu = document.getElementById("navMenu");
    const toggle = document.querySelector(".mobile-menu-toggle");

    if (
      navMenu && toggle && !navMenu.contains(event.target) &&
      !toggle.contains(event.target)
    ) {
      navMenu.classList.remove("active");
    }
  }

  async function updateUnfilledCount() {
    try {
      const response = await fetch("/admin/api/unfilled-shifts/count", {
        credentials: "include",
      });
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const unfilledNav = document.getElementById("unfilled-nav");
      if (!unfilledNav) {
        return;
      }

      unfilledNav.textContent = data.count > 0
        ? "Unfilled (" + data.count + ")"
        : "Unfilled";
    } catch (error) {
      console.error("Error fetching unfilled count:", error);
    }
  }

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      });
      if (!response.ok) {
        window.location.href = "/admin/login";
        return;
      }

      const session = await response.json();
      if (!session.user || !session.user.isAdmin) {
        window.location.href = "/admin/login";
      }
    } catch (_error) {
      window.location.href = "/admin/login";
    }
  }

  let serverTimeOffset = 0;
  let serverTimeInitialized = false;

  async function initializeServerTime() {
    try {
      const clientTimeBeforeRequest = Date.now();
      const response = await fetch("/admin/api/server-time", {
        credentials: "include",
      });
      const clientTimeAfterRequest = Date.now();

      if (!response.ok) {
        console.error("Failed to fetch server time:", response.status);
        return;
      }

      const data = await response.json();
      const [day, month, year] = data.current_date.split("/");
      const [hours, minutes] = data.current_time.split(":");
      const serverTime = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        parseInt(hours, 10),
        parseInt(minutes, 10),
        0,
        0,
      );

      const networkDelay = (clientTimeAfterRequest - clientTimeBeforeRequest) /
        2;
      const adjustedClientTime = clientTimeBeforeRequest + networkDelay;
      serverTimeOffset = serverTime.getTime() - adjustedClientTime;
      serverTimeInitialized = true;
      updateServerTimeDisplay();
    } catch (error) {
      console.error("Error fetching server time:", error);
    }
  }

  function updateServerTimeDisplay() {
    if (!serverTimeInitialized) {
      return;
    }

    const serverTime = new Date(Date.now() + serverTimeOffset);
    const hours = String(serverTime.getHours()).padStart(2, "0");
    const minutes = String(serverTime.getMinutes()).padStart(2, "0");
    const day = String(serverTime.getDate()).padStart(2, "0");
    const month = String(serverTime.getMonth() + 1).padStart(2, "0");
    const year = serverTime.getFullYear();

    const serverTimeElement = document.querySelector(".server-time-display");
    if (serverTimeElement) {
      serverTimeElement.replaceChildren(
        document.createTextNode(hours + ":" + minutes),
        document.createElement("br"),
        document.createTextNode(day + "/" + month + "/" + year),
      );
    }
  }

  window.toggleMobileMenu = toggleMobileMenu;
  window.toggleMobileDropdown = toggleMobileDropdown;

  document.addEventListener("click", closeMobileNavigation);
  checkAuth();
  updateUnfilledCount();
  initializeServerTime();
  setInterval(updateUnfilledCount, 30000);
  setInterval(updateServerTimeDisplay, 1000);
})();
