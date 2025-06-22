import type { RouterContext } from "oak";
import { getPool } from "../../models/db.ts";
import { formatDateAdelaide, formatTimeAdelaide, isDifferentDayAdelaide } from "../../utils/timezone.ts";
import { getAdminNavigation, getAdminStyles } from "./components/navigation.ts";

export interface Show {
  id: number;
  name: string;
}

export interface Shift {
  id: number;
  show_date_id: number;
  show_id: number;
  show_name: string;
  date: string;
  show_start: string;
  show_end: string;
  role: string;
  arrive_time: Date;
  depart_time: Date;
  volunteer_count: number;
}

export interface ShiftsPageData {
  shows: Show[];
  groupedShifts: Map<string, Shift[]>;
  selectedShowIds: string[];
  selectedDate: string | null;
}

export function renderShiftsTemplate(data: ShiftsPageData): string {
  const { shows, groupedShifts, selectedShowIds, selectedDate } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Manage Shifts - Theatre Shifts</title>
      <!-- PWA Manifest -->
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}      <style>
        .filters-card { margin-bottom: 1.5rem; }
        .filter-section { margin-bottom: 1.5rem; }
        .filter-section:last-child { margin-bottom: 0; }
        .filter-section h4 { margin: 0 0 0.75rem 0; color: #333; font-size: 1rem; }
        .filters-row { display: flex; gap: 1rem; align-items: end; flex-wrap: wrap; }
        .filter-group { display: flex; flex-direction: column; min-width: 200px; }
        .filter-group label { margin-bottom: 0.25rem; font-weight: 500; }
        .performance-section { margin-bottom: 2rem; }
        .performance-header { background: #f8f9fa; padding: 1rem; border-radius: 6px; margin-bottom: 1rem; }
        .performance-title { margin: 0; color: #495057; }
        .performance-details { font-size: 0.9rem; color: #6c757d; margin: 0.25rem 0 0 0; }
        .shifts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
        .shift-card { border: 1px solid #dee2e6; border-radius: 6px; padding: 1rem; background: white; }
        .shift-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
        .shift-role { font-weight: 600; font-size: 1.1rem; color: #495057; }
        .shift-status { font-size: 0.85rem; padding: 0.25rem 0.5rem; border-radius: 12px; }
        .status-filled { background: #d4edda; color: #155724; }
        .status-unfilled { background: #f8d7da; color: #721c24; }
        .shift-times { font-size: 0.9rem; color: #6c757d; margin-bottom: 0.75rem; }
        .time-range { display: block; }
        .next-day { font-size: 0.8rem; color: #dc3545; }
          /* Show filter specific styles */
        .show-checkboxes {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        
        @media (min-width: 1200px) {
          .show-checkboxes {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        @media (max-width: 768px) {
          .show-checkboxes {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
          }
        }
        
        .show-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: white;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          border: 2px solid #dee2e6;
          transition: all 0.2s;
          cursor: pointer;
        }
        
        .show-checkbox:hover {
          border-color: #007bff;
          background: #f8f9fa;
        }
        
        .show-checkbox input[type="checkbox"] {
          margin: 0;
          cursor: pointer;
        }
        
        .show-checkbox label {
          margin: 0;
          cursor: pointer;
          font-weight: 500;
          color: #495057;
        }
        
        .filter-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        
        .filter-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        }
        
        .filter-btn:hover {
          background: #5a6268;
        }
      </style>
    </head>
    <body>
      ${getAdminNavigation('shifts')}

      <!-- Main Content -->
      <div class="main-content">
        <div class="page-header">
          <h1 class="page-title">Manage Shifts</h1>
          <div class="page-actions">
            <a href="/admin/shifts/new" class="btn btn-primary">Add New Shift</a>
          </div>
        </div>        <!-- Filters -->
        <div class="content-card filters-card">
          <form method="GET" id="shiftsFilterForm">
            <div class="filter-section">
              <h4>Filter by Shows</h4>
              <div class="show-checkboxes">
                ${shows.map(show => `
                  <div class="show-checkbox">
                    <input type="checkbox" name="shows" value="${show.id}" id="show-${show.id}" 
                           ${selectedShowIds.includes(show.id.toString()) ? 'checked' : ''}
                           onchange="updateShowFilter()">
                    <label for="show-${show.id}">${show.name}</label>
                  </div>
                `).join('')}
              </div>
              
              <div class="filter-actions">
                <button type="button" class="filter-btn" onclick="selectAllShows()">Select All</button>
                <button type="button" class="filter-btn" onclick="selectNoShows()">Select None</button>
              </div>
            </div>
            
            <div class="filter-section">
              <div class="filters-row">
                <div class="filter-group">
                  <label for="date">Date:</label>
                  <input type="date" name="date" id="date" value="${selectedDate || ''}" class="form-control">
                </div>
                
                <div class="filter-group">
                  <label>&nbsp;</label>
                  <div>
                    <button type="submit" class="btn btn-primary">Apply Filters</button>
                    <a href="/admin/shifts" class="btn btn-secondary">Clear All</a>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Shifts -->
        ${Array.from(groupedShifts.entries()).map(([_performanceKey, shifts]) => {
          const firstShift = shifts[0];
          return `
            <div class="performance-section">
              <div class="performance-header">
                <h3 class="performance-title">${firstShift.show_name}</h3>
                <p class="performance-details">
                  ${formatDateAdelaide(new Date(firstShift.date))} | 
                  Show: ${firstShift.show_start} - ${firstShift.show_end}
                </p>
              </div>
              
              <div class="shifts-grid">
                ${shifts.map(shift => {
                  const arriveTime = formatTimeAdelaide(shift.arrive_time);
                  const departTime = formatTimeAdelaide(shift.depart_time);
                  const isNextDay = isDifferentDayAdelaide(shift.arrive_time, shift.depart_time);
                  const isFilled = shift.volunteer_count > 0;
                  
                  return `
                    <div class="shift-card">
                      <div class="shift-header">
                        <div class="shift-role">${shift.role}</div>
                        <span class="shift-status ${isFilled ? 'status-filled' : 'status-unfilled'}">
                          ${isFilled ? `${shift.volunteer_count} assigned` : 'Unfilled'}
                        </span>
                      </div>
                      
                      <div class="shift-times">
                        <span class="time-range">
                          ${arriveTime} - ${departTime}
                          ${isNextDay ? '<span class="next-day">+1 day</span>' : ''}
                        </span>
                      </div>
                      
                      <div class="table-actions">
                        <a href="/admin/shifts/${shift.id}/edit" class="btn btn-sm btn-secondary">Edit</a>
                        <button onclick="deleteShift(${shift.id}, '${shift.role.replace(/'/g, "\\'")}'))" class="btn btn-sm btn-danger">Delete</button>
                        <button onclick="viewShiftDetails(${shift.id})" class="btn btn-sm btn-info">Details</button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
        
        ${groupedShifts.size === 0 ? `
          <div class="content-card">
            <div style="text-align: center; padding: 2rem; color: #6c757d;">
              <h4>No shifts found</h4>
              <p>No shifts match your current filters. Try adjusting your filters or <a href="/admin/shifts/new">create a new shift</a>.</p>
            </div>
          </div>
        ` : ''}
      </div>      <script src="/src/utils/modal.js"></script>
      <script>
        function updateShowFilter() {
          // This function is called when checkboxes change
          // No immediate action needed, form will be submitted manually
        }
        
        function selectAllShows() {
          const checkboxes = document.querySelectorAll('input[name="shows"]');
          checkboxes.forEach(checkbox => checkbox.checked = true);
        }
        
        function selectNoShows() {
          const checkboxes = document.querySelectorAll('input[name="shows"]');
          checkboxes.forEach(checkbox => checkbox.checked = false);
        }
        
        // Handle form submission to collect checked show IDs
        document.getElementById('shiftsFilterForm').addEventListener('submit', function(e) {
          const checkedShows = Array.from(document.querySelectorAll('input[name="shows"]:checked'))
            .map(checkbox => checkbox.value);
          
          // Create a hidden input with comma-separated show IDs
          const existingInput = document.querySelector('input[name="shows"][type="hidden"]');
          if (existingInput) {
            existingInput.remove();
          }
          
          if (checkedShows.length > 0) {
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'shows';
            hiddenInput.value = checkedShows.join(',');
            this.appendChild(hiddenInput);
          }
        });

        async function deleteShift(id, role) {
          if (!confirm(\`Are you sure you want to delete the shift "\${role}"? This will also unassign any participants.\`)) {
            return;
          }
          
          try {
            const response = await fetch(\`/admin/api/shifts/\${id}\`, {
              method: 'DELETE',
              credentials: 'include'
            });
            
            if (response.ok) {
              location.reload();
            } else {
              Modal.error('Error', 'Failed to delete shift');
            }
          } catch (error) {
            console.error('Error:', error);
            Modal.error('Error', 'Error deleting shift');
          }
        }
        
        async function viewShiftDetails(shiftId) {
          try {
            const response = await fetch(\`/admin/api/shifts/\${shiftId}/participants\`, {
              credentials: 'include'
            });
            
            if (response.ok) {
              const participants = await response.json();
              
              if (participants.length === 0) {
                Modal.info('Shift Details', 'No participants assigned to this shift.');
              } else {
                const participantList = participants.map(p => 
                  \`<li>\${p.name}\${p.email ? \` (\${p.email})\` : ''}</li>\`
                ).join('');
                
                Modal.info('Shift Details', \`
                  <p><strong>Assigned Participants:</strong></p>
                  <ul>\${participantList}</ul>
                \`);
              }
            } else {
              Modal.error('Error', 'Failed to load shift details');
            }
          } catch (error) {
            console.error('Error:', error);
            Modal.error('Error', 'Error loading shift details');
          }
        }
      </script>
    </body>
    </html>
  `;
}

export async function showShiftsPage(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    // Get the selected show ID(s) and date from query params
    const selectedShowId = ctx.request.url.searchParams.get('show');
    const selectedShowIds = ctx.request.url.searchParams.get('shows');
    const selectedDate = ctx.request.url.searchParams.get('date');
    
    // Parse show IDs - handle both single 'show' and multiple 'shows' parameters
    let showIdArray: string[] = [];
    if (selectedShowIds) {
      showIdArray = selectedShowIds.split(',').filter(id => id.trim() !== '');
    } else if (selectedShowId) {
      showIdArray = [selectedShowId];
    }
    
    // Get all shows for the dropdown
    const showsResult = await client.queryObject<{
      id: number;
      name: string;
    }>("SELECT id, name FROM shows ORDER BY name");
    
    // Build the shifts query with optional show filter
    let shiftsQuery = `
      SELECT s.id, s.show_date_id, sh.id as show_id, sh.name as show_name, sd.date, 
             sd.start_time as show_start, sd.end_time as show_end,
             s.role, s.arrive_time, s.depart_time,
             COUNT(vs.participant_id) as volunteer_count
      FROM shifts s
      JOIN show_dates sd ON sd.id = s.show_date_id
      JOIN shows sh ON sh.id = sd.show_id
      LEFT JOIN participant_shifts vs ON vs.shift_id = s.id
    `;
    
    const queryParams = [];
    const whereConditions = [];
    
    if (showIdArray.length > 0) {
      const placeholders = showIdArray.map((_, index) => `$${queryParams.length + index + 1}`).join(',');
      whereConditions.push(`sh.id IN (${placeholders})`);
      queryParams.push(...showIdArray);
    }
    
    if (selectedDate) {
      whereConditions.push(`sd.date = $${queryParams.length + 1}`);
      queryParams.push(selectedDate);
    }
    
    if (whereConditions.length > 0) {
      shiftsQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    shiftsQuery += `
      GROUP BY s.id, sh.id, sh.name, sd.date, sd.start_time, sd.end_time
      ORDER BY sd.date, s.arrive_time
    `;
    
    const shiftsResult = await client.queryObject<{
      id: number;
      show_date_id: number;
      show_id: number;
      show_name: string;
      date: string;
      show_start: string;
      show_end: string;
      role: string;
      arrive_time: Date;
      depart_time: Date;
      volunteer_count: number;
    }>(shiftsQuery, queryParams);
    
    // Group shifts by performance (show date)
    const groupedShifts = new Map<string, Shift[]>();
    for (const shift of shiftsResult.rows) {
      const key = `${shift.show_name} - ${shift.date}`;
      if (!groupedShifts.has(key)) {
        groupedShifts.set(key, []);
      }
      groupedShifts.get(key)!.push(shift);
    }
    
    const data: ShiftsPageData = {
      shows: showsResult.rows,
      groupedShifts,
      selectedShowIds: showIdArray,
      selectedDate
    };
    
    ctx.response.type = "text/html";
    ctx.response.body = renderShiftsTemplate(data);
  } finally {
    client.release();
  }
}
