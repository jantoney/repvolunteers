// Dashboard client-side functionality

// Global variables
const currentDate = new Date();
const shiftData = new Map();
let availableShows = [];
let selectedShows = [];

// Mobile menu functionality
function toggleMobileMenu() {
  const navMenu = document.getElementById('navMenu');
  navMenu.classList.toggle('active');
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
  const navMenu = document.getElementById('navMenu');
  const toggle = document.querySelector('.mobile-menu-toggle');
  
  if (navMenu && toggle && !navMenu.contains(event.target) && !toggle.contains(event.target)) {
    navMenu.classList.remove('active');
  }
  
  // Close mobile dropdowns when clicking outside
  const dropdowns = document.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    if (!dropdown.contains(event.target)) {
      dropdown.classList.remove('active');
    }
  });
});

// Mobile dropdown toggle
function toggleMobileDropdown(event) {
  if (window.innerWidth <= 768) {
    event.preventDefault();
    const dropdown = event.target.closest('.dropdown');
    dropdown.classList.toggle('active');
  }
}

// Calendar functionality
async function initCalendar() {
  await loadAvailableShows();
  await loadShiftData();
  renderCalendar();
}

async function loadAvailableShows() {
  try {
    const response = await fetch('/admin/api/shifts/calendar-shows', { 
      credentials: 'include' 
    });
    if (response.ok) {
      availableShows = await response.json();
      console.log('Available shows loaded:', availableShows);
      selectedShows = availableShows.map(show => show.id); // Initially select all shows
      renderShowCheckboxes();
    } else {
      console.error('Failed to load shows:', response.status);
    }
  } catch (error) {
    console.error('Error loading shows:', error);
  }
}

function renderShowCheckboxes() {
  const container = document.getElementById('showCheckboxes');
  if (!container) return;
  
  if (availableShows.length === 0) {
    container.innerHTML = '<p style="color: #666; margin: 0;">No shows with shifts found.</p>';
    return;
  }
  
  container.innerHTML = availableShows.map(show => `
    <div class="show-checkbox">
      <input type="checkbox" id="show-${show.id}" value="${show.id}" 
             ${selectedShows.includes(show.id) ? 'checked' : ''} 
             onchange="updateSelectedShows()">
      <label for="show-${show.id}">${show.name} (${show.shift_count} shifts)</label>
    </div>
  `).join('');
}

function updateSelectedShows() {
  const checkboxes = document.querySelectorAll('#showCheckboxes input[type="checkbox"]');
  selectedShows = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => parseInt(cb.value));
}

function selectAllShows() {
  selectedShows = availableShows.map(show => show.id);
  renderShowCheckboxes();
}

function deselectAllShows() {
  selectedShows = [];
  renderShowCheckboxes();
}

async function applyShowFilter() {
  await loadShiftData();
  renderCalendar();
}

async function loadShiftData() {
  try {
    const showsParam = selectedShows.length > 0 ? `?shows=${selectedShows.join(',')}` : '';
    console.log('Loading shift data with params:', showsParam);
    const response = await fetch(`/admin/api/shifts/calendar-data${showsParam}`, { 
      credentials: 'include' 
    });
    if (response.ok) {
      const data = await response.json();
      console.log('Shift data loaded:', data);
      shiftData.clear();
      data.forEach(item => {
        shiftData.set(item.date, {
          total: parseInt(item.total_shifts),
          filled: parseInt(item.filled_shifts),
          shows: item.show_names
        });
      });
    } else {
      console.error('Failed to load shift data:', response.status);
    }
  } catch (error) {
    console.error('Error loading shift data:', error);
  }
}

function renderCalendar() {
  const calendar = document.getElementById('calendar');
  const monthSpan = document.getElementById('currentMonth');
  
  if (!calendar || !monthSpan) return;
  
  // Clear calendar
  calendar.innerHTML = '';
  
  // Set month header using AdelaideTime utility
  monthSpan.textContent = AdelaideTime.getMonthYearAdelaide(currentDate);
  
  // Add day headers
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayHeaders.forEach(day => {
    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    header.textContent = day;
    calendar.appendChild(header);
  });
    // Get first day of month and number of days
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  // Generate calendar days
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
    const isToday = AdelaideTime.isTodayAdelaide(date);
    
    if (!isCurrentMonth) {
      dayElement.classList.add('other-month');
    }
    if (isToday) {
      dayElement.classList.add('today');
    }
    
    // Add day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayElement.appendChild(dayNumber);
    
    // Add shift information if available
    const dateStr = date.toISOString().split('T')[0];
    const shifts = shiftData.get(dateStr);
    
    if (shifts && shifts.total > 0) {
      dayElement.classList.add('has-shifts');
      
      // Determine status color
      if (shifts.filled === shifts.total) {
        // All shifts filled - keep default green
      } else if (shifts.filled > 0) {
        dayElement.classList.add('partial');
      } else {
        dayElement.classList.add('unfilled');
      }
      
      // Add shift indicator
      const indicator = document.createElement('div');
      indicator.className = 'shift-indicator';
      
      const countDiv = document.createElement('div');
      countDiv.className = 'shift-count';
      countDiv.textContent = `(${shifts.filled}/${shifts.total})`;
      
      const showsDiv = document.createElement('div');
      showsDiv.className = 'shift-shows';
      showsDiv.textContent = shifts.shows;
      showsDiv.title = shifts.shows; // Full text on hover
      
      indicator.appendChild(countDiv);
      indicator.appendChild(showsDiv);
      dayElement.appendChild(indicator);
      
      // Add click handler to go to shifts page
      dayElement.addEventListener('click', () => {
        // Navigate to shifts page filtered by this date and selected shows
        const url = new URL('/admin/shifts', window.location.origin);
        url.searchParams.set('date', dateStr);
        if (selectedShows.length > 0 && selectedShows.length < availableShows.length) {
          // Only add show filter if not all shows are selected
          url.searchParams.set('shows', selectedShows.join(','));
        }
        window.location.href = url.toString();
      });
      dayElement.style.cursor = 'pointer';
    }
    
    calendar.appendChild(dayElement);
  }
}

function changeMonth(delta) {
  currentDate.setMonth(currentDate.getMonth() + delta);
  renderCalendar();
}

// Authentication check
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initCalendar();
  loadCounters();
  
  // Add logout handler - the navigation component uses a link, so we need to handle it differently
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await fetch('/api/auth/sign-out', {
          method: 'POST',
          credentials: 'include'
        });
        window.location.href = '/admin/login';
      } catch (error) {
        console.error('Logout failed:', error);
        // Fallback - still redirect to login
        window.location.href = '/admin/login';
      }
    });
  }
});

// Counter loading functions
async function loadCounters() {
  await Promise.all([
    loadUnfilledShiftsCount(),
    loadPerformancesWithoutShiftsCount()
  ]);
}

async function loadUnfilledShiftsCount() {
  try {
    const response = await fetch('/admin/api/unfilled-shifts/count', { 
      credentials: 'include' 
    });
    if (response.ok) {
      const data = await response.json();
      const countElement = document.getElementById('unfilledShiftsCount');
      if (countElement) {
        countElement.textContent = data.count;
      }
    } else {
      console.error('Failed to load unfilled shifts count:', response.status);
    }
  } catch (error) {
    console.error('Error loading unfilled shifts count:', error);
  }
}

async function loadPerformancesWithoutShiftsCount() {
  try {
    const response = await fetch('/admin/api/performances-without-shifts/count', { 
      credentials: 'include' 
    });
    if (response.ok) {
      const data = await response.json();
      const countElement = document.getElementById('performancesWithoutShiftsCount');
      if (countElement) {
        countElement.textContent = data.count;
      }
    } else {
      console.error('Failed to load performances without shifts count:', response.status);
    }
  } catch (error) {
    console.error('Error loading performances without shifts count:', error);
  }
}

// Export functions that need to be available globally
window.toggleMobileMenu = toggleMobileMenu;
window.toggleMobileDropdown = toggleMobileDropdown;
window.changeMonth = changeMonth;
window.selectAllShows = selectAllShows;
window.deselectAllShows = deselectAllShows;
window.applyShowFilter = applyShowFilter;
window.updateSelectedShows = updateSelectedShows;
