(function () {
  const FORCE_EMAIL_STORAGE_KEY = "repVolunteers.forceEmailMode";
  const FORCE_EMAIL_PATHS = [
    /^\/admin\/api\/volunteers\/\d+\/email-schedule-pdf$/,
    /^\/admin\/api\/volunteers\/\d+\/email-show-week$/,
    /^\/admin\/api\/volunteers\/\d+\/email-last-minute-shifts$/,
    /^\/admin\/api\/volunteers\/\d+\/email-availability-request$/,
    /^\/admin\/api\/bulk-email\/send-show-week$/,
    /^\/admin\/api\/bulk-email\/send-unfilled-shifts$/,
    /^\/admin\/api\/bulk-email\/send-availability-request$/,
    /^\/api\/send-link$/,
  ];

  function isLocalDevHost() {
    return (
      globalThis.location.hostname === "localhost" ||
      globalThis.location.hostname === "127.0.0.1" ||
      globalThis.location.hostname === "::1"
    );
  }

  function isForceEmailModeEnabled() {
    return (
      isLocalDevHost() &&
      globalThis.localStorage.getItem(FORCE_EMAIL_STORAGE_KEY) === "true"
    );
  }

  function setForceEmailMode(enabled, options = {}) {
    if (!isLocalDevHost()) {
      return false;
    }

    if (enabled) {
      globalThis.localStorage.setItem(FORCE_EMAIL_STORAGE_KEY, "true");
    } else {
      globalThis.localStorage.removeItem(FORCE_EMAIL_STORAGE_KEY);
    }

    syncForceEmailUrl(Boolean(enabled), options.replaceUrl !== false);
    updateForceEmailLinks();
    updateForceEmailControls();
    return true;
  }

  function syncForceEmailUrl(enabled, replaceUrl = true) {
    const url = new URL(globalThis.location.href);
    const hadForce = url.searchParams.has("force");

    if (enabled) {
      url.searchParams.set("force", "true");
    } else {
      url.searchParams.delete("force");
    }

    if (url.href !== globalThis.location.href || hadForce) {
      const method = replaceUrl ? "replaceState" : "pushState";
      globalThis.history[method]({}, "", url);
    }
  }

  function updateForceEmailLinks() {
    const enabled = isForceEmailModeEnabled();

    document.querySelectorAll("a[href]").forEach((link) => {
      const rawHref = link.getAttribute("href");
      if (
        !rawHref ||
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:")
      ) {
        return;
      }

      const url = new URL(rawHref, globalThis.location.href);
      if (
        url.origin !== globalThis.location.origin ||
        !url.pathname.startsWith("/admin") ||
        url.pathname === "/admin/logout"
      ) {
        return;
      }

      if (enabled) {
        url.searchParams.set("force", "true");
      } else {
        url.searchParams.delete("force");
      }

      link.setAttribute("href", url.pathname + url.search + url.hash);
    });
  }

  function updateForceEmailControls() {
    const enabled = isForceEmailModeEnabled();
    const toggle = document.getElementById("forceEmailModeToggle");

    if (toggle) {
      toggle.checked = enabled;
    }
  }

  function initializeForceEmailMode() {
    if (!isLocalDevHost()) {
      return;
    }

    const url = new URL(globalThis.location.href);
    const forceParam = url.searchParams.get("force");

    if (forceParam === "true") {
      globalThis.localStorage.setItem(FORCE_EMAIL_STORAGE_KEY, "true");
    } else if (forceParam === "false") {
      globalThis.localStorage.removeItem(FORCE_EMAIL_STORAGE_KEY);
      url.searchParams.delete("force");
      globalThis.history.replaceState({}, "", url);
    } else if (isForceEmailModeEnabled()) {
      syncForceEmailUrl(true);
    }

    updateForceEmailLinks();
    updateForceEmailControls();

    const toggle = document.getElementById("forceEmailModeToggle");
    if (toggle) {
      toggle.addEventListener("change", () => {
        setForceEmailMode(toggle.checked, { replaceUrl: false });
        if (typeof Toast !== "undefined") {
          if (toggle.checked) {
            Toast.warning("Real email sending is enabled for local dev.");
          } else {
            Toast.success("Local dev email sending returned to preview mode.");
          }
        }
      });
    }

    const disableButton = document.getElementById("disableForceModeBtn");
    if (disableButton) {
      disableButton.addEventListener(
        "click",
        () => setForceEmailMode(false, { replaceUrl: false }),
        { capture: true },
      );
    }
  }

  function shouldForceEmailRequest(url) {
    return (
      isForceEmailModeEnabled() &&
      url.origin === globalThis.location.origin &&
      FORCE_EMAIL_PATHS.some((pathPattern) => pathPattern.test(url.pathname))
    );
  }

  function withForceEmailQuery(input) {
    const requestUrl = input instanceof Request
      ? input.url
      : input instanceof URL
      ? input.href
      : input;
    const url = new URL(requestUrl, globalThis.location.href);

    if (!shouldForceEmailRequest(url)) {
      return input;
    }

    url.searchParams.set("force", "true");

    if (typeof input === "string") {
      return url.pathname + url.search + url.hash;
    }

    if (input instanceof URL) {
      return url;
    }

    return new Request(url.toString(), input);
  }

  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = function (input, init) {
    return originalFetch(withForceEmailQuery(input), init);
  };

  globalThis.RepVolunteersForceEmail = {
    isEnabled: isForceEmailModeEnabled,
    setEnabled: setForceEmailMode,
    applyToUrl(baseUrl) {
      if (!isForceEmailModeEnabled()) {
        return baseUrl;
      }
      const url = new URL(baseUrl, globalThis.location.href);
      url.searchParams.set("force", "true");
      return url.pathname + url.search + url.hash;
    },
  };

  function toggleMobileMenu() {
    const navMenu = document.getElementById("navMenu");
    if (navMenu) {
      navMenu.classList.toggle("active");
    }
  }

  function toggleMobileDropdown(event) {
    if (globalThis.innerWidth > 768) {
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
      navMenu &&
      toggle &&
      !navMenu.contains(event.target) &&
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
        ? "Unfilled Shifts (" + data.count + ")"
        : "Unfilled Shifts";
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
        globalThis.location.href = "/admin/login";
        return;
      }

      const session = await response.json();
      if (!session.user || !session.user.isAdmin) {
        globalThis.location.href = "/admin/login";
      }
    } catch (_error) {
      globalThis.location.href = "/admin/login";
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

  globalThis.toggleMobileMenu = toggleMobileMenu;
  globalThis.toggleMobileDropdown = toggleMobileDropdown;

  initializeForceEmailMode();
  document.addEventListener("click", closeMobileNavigation);
  checkAuth();
  updateUnfilledCount();
  initializeServerTime();
  setInterval(updateUnfilledCount, 30000);
  setInterval(updateServerTimeDisplay, 1000);
})();
