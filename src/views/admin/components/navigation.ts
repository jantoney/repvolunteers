import { APP_VERSION } from "../../../version.ts";
export function getAdminNavigation(currentPage: string = "") {
  return `
    <!-- Top Navigation -->
    <nav class="top-nav">
      <div class="nav-container">
        <a href="/admin" class="nav-brand" title="Version: ${APP_VERSION}">Theatre Shifts Admin</a>
        
        <button class="mobile-menu-toggle" onclick="toggleMobileMenu()">☰</button>        <ul class="nav-menu" id="navMenu">
          <li class="nav-item"><a href="/admin/dashboard" class="nav-link ${
    currentPage === "dashboard" ? "active" : ""
  }">Dashboard</a></li>
          <li class="nav-item dropdown">
            <a href="/admin/shows" class="nav-link dropdown-toggle ${
    currentPage === "shows" ? "active" : ""
  }" onclick="toggleMobileDropdown(event)">Productions</a>
            <ul class="dropdown-menu">
              <li><a href="/admin/shows" class="dropdown-link">All Productions</a></li>
              <li><a href="/admin/shows/new" class="dropdown-link">New Production</a></li>
            </ul>
          </li>
          <li class="nav-item dropdown">
            <a href="/admin/shifts" class="nav-link dropdown-toggle ${
    currentPage === "shifts" ? "active" : ""
  }" onclick="toggleMobileDropdown(event)">Shifts</a>
            <ul class="dropdown-menu">
              <li><a href="/admin/shifts" class="dropdown-link">All Shifts</a></li>
              <li><a href="/admin/shifts/new" class="dropdown-link">New Shift</a></li>
            </ul>
          </li>
          <li class="nav-item dropdown">
            <a href="/admin/volunteers" class="nav-link dropdown-toggle ${
    currentPage === "volunteers" ? "active" : ""
  }" onclick="toggleMobileDropdown(event)">Participants</a>
            <ul class="dropdown-menu">
              <li><a href="/admin/volunteers" class="dropdown-link">All Participants</a></li>
              <li><a href="/admin/volunteers/new" class="dropdown-link">New Participant</a></li>
            </ul>
          </li>
          <li class="nav-item"><a href="/admin/unfilled-shifts" class="nav-link ${
    currentPage === "unfilled" ? "active" : ""
  }" id="unfilled-nav">Unfilled</a></li>
          <li class="nav-item"><a href="/admin/bulk-email" class="nav-link ${
    currentPage === "bulk-email" ? "active" : ""
  }">Bulk Email</a></li>
        </ul>
        <div class="nav-item" id="server-time">
          <span class="server-time-display"></span>
        </div>
        <div class="nav-actions">
          <a href="/admin/logout" class="logout-btn">Logout</a>
        </div>
      </div>
    </nav>
  `;
}

export function getAdminStyles() {
  return `
    <link rel="stylesheet" href="/src/utils/toast.css">
    <link rel="stylesheet" href="/src/views/admin/styles/admin-base.css">
  `;
}

export function getAdminScripts() {
  return `
    <script src="/src/utils/toast.js"></script>
    <script src="/src/views/admin/admin-dom.js"></script>
    <script src="/src/views/admin/admin-shell.js"></script>
  `;
}
