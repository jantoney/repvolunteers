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
            }" onclick="toggleMobileDropdown(event)">Shows</a>
            <ul class="dropdown-menu">
              <li><a href="/admin/shows" class="dropdown-link">All Shows</a></li>
              <li><a href="/admin/shows/new" class="dropdown-link">New Show</a></li>
            </ul>
          </li>
          <li class="nav-item dropdown">
            <a href="/admin/shifts" class="nav-link dropdown-toggle ${
              currentPage === "shifts" || currentPage === "shifts-bulk-update"
                ? "active"
                : ""
            }" onclick="toggleMobileDropdown(event)">Shifts</a>
            <ul class="dropdown-menu">
              <li><a href="/admin/shifts" class="dropdown-link">All Shifts</a></li>
              <li><a href="/admin/shifts/new" class="dropdown-link">New Shift</a></li>
              <li><a href="/admin/shifts/bulk-update" class="dropdown-link ${
                currentPage === "shifts-bulk-update" ? "active" : ""
              }">Bulk Update Times</a></li>
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
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        background: #f8f9fa;
        line-height: 1.6;
      }
      
      /* Top Navigation */
      .top-nav {
        background: #007bff;
        color: white;
        padding: 0;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        position: sticky;
        top: 0;
        z-index: 1000;
      }
      
      .nav-container {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 1rem;
        min-height: 60px;
      }
      
      .nav-brand {
        font-size: 1.5rem;
        font-weight: bold;
        color: white;
        text-decoration: none;
      }
      
      .nav-menu {
        display: flex;
        gap: 0;
        list-style: none;
      }
        .nav-item {
        position: relative;
      }
      
      .nav-link {
        display: block;
        padding: 1rem 1.5rem;
        color: white;
        text-decoration: none;
        transition: background-color 0.3s;
      }
      
      .nav-link:hover, .nav-link.active {
        background: rgba(255,255,255,0.1);
      }
      
      /* Dropdown Styles */
      .dropdown {
        position: relative;
      }
      
      .dropdown-toggle::after {
        content: ' ▼';
        font-size: 0.8rem;
        margin-left: 0.5rem;
      }
      
      .dropdown-menu {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        background: white;
        min-width: 200px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border-radius: 6px;
        padding: 0.5rem 0;
        list-style: none;
        z-index: 1000;
      }
      
      .dropdown:hover .dropdown-menu {
        display: block;
      }
      
      .dropdown-link {
        display: block;
        padding: 0.75rem 1.5rem;
        color: #333;
        text-decoration: none;
        transition: background-color 0.2s;
      }
      
      .dropdown-link:hover {
        background: #f8f9fa;
        color: #007bff;
      }
      
      .nav-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      
      .logout-btn {
        background: rgba(255,255,255,0.2);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        text-decoration: none;
        transition: background-color 0.3s;
      }
      
      .logout-btn:hover {
        background: rgba(255,255,255,0.3);
        color: white;
      }
      
      /* Mobile Navigation */
      .mobile-menu-toggle {
        display: none;
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
      }
        @media (max-width: 768px) {
        .mobile-menu-toggle {
          display: block;
        }
        
        .nav-menu {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #007bff;
          flex-direction: column;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .nav-menu.active {
          display: flex;
        }
        
        .dropdown-menu {
          position: static;
          display: none;
          background: rgba(255,255,255,0.1);
          box-shadow: none;
          border-radius: 0;
          margin-left: 1rem;
        }
        
        .dropdown:hover .dropdown-menu,
        .dropdown.active .dropdown-menu {
          display: block;
        }
        
        .dropdown-link {
          color: white;
          padding: 0.5rem 1.5rem;
        }
        
        .dropdown-link:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        
        .nav-actions {
          flex-direction: column;
          align-items: stretch;
          gap: 0;
        }
      }
      
      /* Main Content */
      .main-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1rem;
      }
      
      .page-header {
        margin-bottom: 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }
      
      .page-title {
        font-size: 2rem;
        color: #333;
        margin: 0;
      }
      
      .page-subtitle {
        color: #666;
        font-size: 1.1rem;
        margin: 0;
      }
      
      .page-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      
      /* Buttons */
      .btn { 
        display: inline-block; 
        padding: 0.75rem 1.5rem; 
        margin: 0.25rem; 
        background: #007bff; 
        color: white; 
        text-decoration: none; 
        border-radius: 6px;
        font-size: 0.95rem;
        font-weight: 500;
        transition: all 0.2s;
        border: none;
        cursor: pointer;
      }
      
      .btn:hover { 
        background: #0056b3; 
        transform: translateY(-1px);
        color: white;
        text-decoration: none;
      }
      
      .btn-outline {
        background: transparent;
        color: #007bff;
        border: 2px solid #007bff;
      }
      
      .btn-outline:hover {
        background: #007bff;
        color: white;
      }
      
      .btn-success {
        background: #28a745;
      }
      
      .btn-success:hover {
        background: #218838;
      }
      
      .btn-warning {
        background: #ffc107;
        color: #212529;
      }
      
      .btn-warning:hover {
        background: #e0a800;
      }
      
      .btn-danger {
        background: #dc3545;
      }
      
      .btn-danger:hover {
        background: #c82333;
      }
      
      .btn-secondary {
        background: #6c757d;
      }
      
      .btn-secondary:hover {
        background: #5a6268;
      }
      
      /* Tables */
      .table-container {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        overflow: hidden;
      }
      
      table { 
        width: 100%; 
        border-collapse: collapse; 
      }
      
      th, td { 
        padding: 1rem; 
        text-align: left; 
        border-bottom: 1px solid #dee2e6; 
      }
      
      th { 
        background-color: #f8f9fa; 
        font-weight: 600;
        color: #333;
      }
        tr:hover {
        background-color: #f8f9fa;
      }
      
      /* Table Actions */
      .table-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
      }
      
      .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
        line-height: 1.5;
        min-height: 32px;
      }
      
      /* Forms */
      .form-container {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      .form-group {
        margin-bottom: 1.5rem;
      }
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
      }
      
      input, select, textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
      }
      
      input:focus, select:focus, textarea:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
      }
      
      /* Responsive design */
      @media (max-width: 768px) {
        .main-content {
          padding: 1rem;
        }
        
        .page-header {
          flex-direction: column;
          align-items: stretch;
        }
        
        .page-actions {
          justify-content: center;
        }
        
        table {
          font-size: 0.9rem;
        }
        
        th, td {          padding: 0.75rem 0.5rem;
        }
      }
      
      /* Dashboard Specific Styles */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }
      
      .stat-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        text-align: center;
      }
      
      .stat-number {
        font-size: 2.5rem;
        font-weight: bold;
        color: #007bff;
        margin-bottom: 0.5rem;
      }
      
      .stat-label {
        color: #666;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .section {
        margin-bottom: 2rem;
      }
      
      .section-header {
        margin-bottom: 1rem;
      }
      
      .section-title {
        font-size: 1.5rem;
        color: #333;
        margin: 0;
      }
      
      .section-content {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 1.5rem;
      }
      
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
      }
      
      .card {
        padding: 1.5rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: #fafafa;
      }
      
      .card-title {
        font-size: 1.2rem;
        margin-bottom: 0.5rem;
        color: #333;
      }
      
      .card-description {
        color: #666;
        margin-bottom: 1rem;
        line-height: 1.5;
      }
      
      /* Calendar Styles */
      .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        gap: 1rem;
      }
      
      .calendar-nav {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      
      .calendar-nav button {
        background: #007bff;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .calendar-nav button:hover {
        background: #0056b3;
      }
      
      .calendar-nav span {
        font-size: 1.2rem;
        font-weight: bold;
        min-width: 200px;
        text-align: center;
      }
      
      .show-filter {
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 6px;
      }
      
      .show-filter h4 {
        margin: 0 0 0.5rem 0;
        color: #333;
      }
      
      .show-checkboxes {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      
      .show-checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: white;
        padding: 0.5rem;
        border-radius: 4px;
        border: 1px solid #ddd;
      }
      
      .filter-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      
      .filter-btn {
        background: #6c757d;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
      }
      
      .filter-btn:hover {
        background: #5a6268;
      }
      
      .calendar {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1px;
        background: #ddd;
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 1rem;
      }
      
      .calendar-day-header {
        background: #007bff;
        color: white;
        padding: 0.75rem 0.5rem;
        text-align: center;
        font-weight: bold;
        font-size: 0.9rem;
      }
      
      .calendar-day {
        background: white;
        min-height: 120px;
        padding: 0.5rem;
        position: relative;
        cursor: default;
      }
      
      .calendar-day.other-month {
        background: #f8f9fa;
        color: #6c757d;
      }
      
      .calendar-day.today {
        background: #fff3cd;
        border: 2px solid #ffc107;
      }
      
      .calendar-day.has-shifts {
        background: #d4edda;
        border: 1px solid #28a745;
      }
      
      .calendar-day.has-shifts.partial {
        background: #fff3cd;
        border: 1px solid #ffc107;
      }
      
      .calendar-day.has-shifts.unfilled {
        background: #f8d7da;
        border: 1px solid #dc3545;
      }
      
      .day-number {
        font-weight: bold;
        margin-bottom: 0.25rem;
      }
      
      .shift-indicator {
        font-size: 0.8rem;
        line-height: 1.2;
      }
      
      .shift-count {
        font-weight: bold;
        margin-bottom: 0.25rem;
      }
      
      .shift-shows {
        color: #666;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .calendar-legend {
        display: flex;
        justify-content: center;
        gap: 2rem;
        flex-wrap: wrap;
        font-size: 0.9rem;
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .legend-color {
        width: 16px;
        height: 16px;
        border-radius: 2px;
        border: 1px solid #ddd;
      }
      
      @media (max-width: 768px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        
        .grid {
          grid-template-columns: 1fr;
        }
        
        .calendar {
          font-size: 0.8rem;
        }
        
        .calendar-day {
          min-height: 80px;
          padding: 0.25rem;
        }
        
        .calendar-legend {
          gap: 1rem;
        }
      }
    </style>
  `;
}

export function getAdminScripts() {
  return `
    <script src="/src/utils/toast.js"></script>
    <script>
      function toggleMobileMenu() {
        const navMenu = document.getElementById('navMenu');
        navMenu.classList.toggle('active');
      }
      
      function toggleMobileDropdown(event) {
        event.preventDefault();
        const dropdown = event.target.closest('.dropdown');
        dropdown.classList.toggle('active');
      }
      
      // Close mobile menu when clicking outside
      document.addEventListener('click', function(event) {
        const navMenu = document.getElementById('navMenu');
        const toggle = document.querySelector('.mobile-menu-toggle');
        
        if (!navMenu.contains(event.target) && !toggle.contains(event.target)) {
          navMenu.classList.remove('active');
        }
      });
      
      // Update unfilled shifts count
      async function updateUnfilledCount() {
        try {
          const response = await fetch('/admin/api/unfilled-shifts/count', { credentials: 'include' });
          if (response.ok) {
            const data = await response.json();
            const unfilledNav = document.getElementById('unfilled-nav');
            if (data.count > 0) {
              unfilledNav.innerHTML = 'Unfilled (' + data.count + ')';
            } else {
              unfilledNav.innerHTML = 'Unfilled';
            }
          }
        } catch (error) {
          console.error('Error fetching unfilled count:', error);
        }
      }
      
      // Check if user is authenticated and is admin
      async function checkAuth() {
        try {
          const response = await fetch('/api/auth/session', { credentials: 'include' });
          if (!response.ok) {
            window.location.href = '/admin/login';
            return;
          }
          const session = await response.json();
          if (!session.user || !session.user.isAdmin) {
            window.location.href = '/admin/login';
          }
        } catch (error) {
          window.location.href = '/admin/login';
        }
      }
      
      // Server time management
      let serverTimeOffset = 0; // Difference between server and client time in milliseconds
      let serverTimeInitialized = false;

      // Get initial server time and calculate offset
      async function initializeServerTime() {
        try {
          const clientTimeBeforeRequest = Date.now();
          const response = await fetch('/admin/api/server-time', { credentials: 'include' });
          const clientTimeAfterRequest = Date.now();
          
          if (response.ok) {
            const data = await response.json();
            
            // Parse server time (format: "HH:MM" and "DD/MM/YYYY")
            const [day, month, year] = data.current_date.split('/');
            const [hours, minutes] = data.current_time.split(':');
            
            // Create server time as Date object
            const serverTime = new Date(
              parseInt(year), 
              parseInt(month) - 1, // Month is 0-indexed
              parseInt(day),
              parseInt(hours),
              parseInt(minutes),
              0, // seconds
              0  // milliseconds
            );
            
            // Estimate network delay and adjust
            const networkDelay = (clientTimeAfterRequest - clientTimeBeforeRequest) / 2;
            const adjustedClientTime = clientTimeBeforeRequest + networkDelay;
            
            // Calculate offset
            serverTimeOffset = serverTime.getTime() - adjustedClientTime;
            serverTimeInitialized = true;
            
            console.log('Server time initialized. Offset:', serverTimeOffset, 'ms');
            updateServerTimeDisplay();
          } else {
            console.error('Failed to fetch server time:', response.status);
          }
        } catch (error) {
          console.error('Error fetching server time:', error);
        }
      }

      // Update server time display using local time + offset
      function updateServerTimeDisplay() {
        if (!serverTimeInitialized) return;
        
        const serverTime = new Date(Date.now() + serverTimeOffset);
        
        const hours = String(serverTime.getHours()).padStart(2, '0');
        const minutes = String(serverTime.getMinutes()).padStart(2, '0');
        const day = String(serverTime.getDate()).padStart(2, '0');
        const month = String(serverTime.getMonth() + 1).padStart(2, '0');
        const year = serverTime.getFullYear();

        const timeDisplay = hours + ':' + minutes;
        const dateDisplay = day + '/' + month + '/' + year;

        const serverTimeElement = document.querySelector('.server-time-display');
        if (serverTimeElement) {
          serverTimeElement.innerHTML = timeDisplay + '<br>' + dateDisplay;
        }
      }

      // Initialize
      checkAuth();
      updateUnfilledCount();
      initializeServerTime();
      
      // Update counters and time regularly
      setInterval(updateUnfilledCount, 30000); // Update unfilled count every 30 seconds
      setInterval(updateServerTimeDisplay, 1000); // Update time display every second (local calculation)
    </script>
    <style>
      .server-time-display { 
        font-size: 0.8em; 
        text-align: center; 
        line-height: 1.2; 
        color: white;
        font-weight: 500;
        min-width: 70px;
      }
      #server-time {
        background: rgba(255,255,255,0.1);
        border-radius: 4px;
        padding: 0.5rem;
      }
    </style>
  `;
}
