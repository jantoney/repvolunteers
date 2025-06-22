import { getAdminNavigation, getAdminStyles } from "../components/navigation.ts";
import { formatDateAdelaide, formatTimeAdelaide, isDifferentDayAdelaide } from "../../../utils/timezone.ts";

export interface UnfilledShift {
  id: number;
  show_date_id: number;
  show_name: string;
  date: string;
  show_start: string;
  show_end: string;
  role: string;
  arrive_time: Date;
  depart_time: Date;
}

export interface UnfilledShiftsPageData {
  shifts: UnfilledShift[];
}

export function renderUnfilledShiftsTemplate(data: UnfilledShiftsPageData): string {
  const { shifts } = data;
  
  // Group shifts by show and date
  const grouped = new Map<string, UnfilledShift[]>();
  for (const shift of shifts) {
    const key = `${shift.show_name} - ${shift.date}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(shift);
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Unfilled Shifts - Theatre Shifts</title>
      <!-- PWA Manifest -->
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}
      <style>
        .alert { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .urgent { background-color: #fff3cd; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: white; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 2rem; font-weight: bold; color: #dc3545; }
        .stat-label { color: #6c757d; font-size: 0.9rem; }
        .performance-group { margin-bottom: 2rem; }
        .performance-header { background: #f8f9fa; padding: 1rem; border-radius: 6px; margin-bottom: 1rem; border-left: 4px solid #dc3545; }
        .performance-title { margin: 0; color: #495057; }
        .performance-details { font-size: 0.9rem; color: #6c757d; margin: 0.25rem 0 0 0; }
        .shifts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
        .shift-card { border: 1px solid #f5c6cb; border-radius: 6px; padding: 1rem; background: #fff5f5; }
        .shift-role { font-weight: 600; font-size: 1.1rem; color: #721c24; margin-bottom: 0.5rem; }
        .shift-times { font-size: 0.9rem; color: #6c757d; margin-bottom: 0.75rem; }        .time-range { display: block; }
        .next-day { font-size: 0.8rem; color: #dc3545; }
        
        /* Assignment Modal Styles */
        .modal { display: none; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); }
        .modal-content { background-color: #fefefe; margin: 5% auto; padding: 2rem; border-radius: 8px; width: 90%; max-width: 500px; position: relative; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .modal-title { margin: 0; color: #333; }
        .close { color: #aaa; font-size: 28px; font-weight: bold; cursor: pointer; }
        .close:hover { color: #000; }
        .participant-list { max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; }
        .participant-item { padding: 0.75rem; border-bottom: 1px solid #eee; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .participant-item:hover { background-color: #f8f9fa; }
        .participant-item:last-child { border-bottom: none; }
        .participant-info { flex: 1; }
        .participant-name { font-weight: 500; margin-bottom: 0.25rem; }
        .participant-details { font-size: 0.9rem; color: #666; }
      </style>
    </head>
    <body>
      ${getAdminNavigation('unfilled')}

      <!-- Main Content -->
      <div class="main-content">
        <div class="page-header">
          <h1 class="page-title">Unfilled Shifts</h1>
          <div class="page-actions">
            <a href="/admin/shifts" class="btn btn-secondary">All Shifts</a>
          </div>
        </div>        ${shifts.length > 0 ? `
          <div class="alert">
            <strong>Attention Required!</strong> There ${shifts.length === 1 ? 'is' : 'are'} ${shifts.length} unfilled shift${shifts.length !== 1 ? 's' : ''} that need${shifts.length === 1 ? 's' : ''} participants assigned.
          </div>
        ` : ''}

        <!-- Stats -->
        <div class="stats">
          <div class="stat-card">
            <div class="stat-number">${shifts.length}</div>
            <div class="stat-label">Unfilled Shifts</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${new Set(shifts.map(s => s.show_name)).size}</div>
            <div class="stat-label">Shows Affected</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${new Set(shifts.map(s => s.date)).size}</div>
            <div class="stat-label">Performance Dates</div>
          </div>
        </div>

        ${shifts.length === 0 ? `          <div class="form-container">
            <div style="text-align: center; padding: 2rem; color: #28a745;">
              <h4>🎉 All Shifts Filled!</h4>
              <p>Excellent! All shifts currently have participants assigned. Great job on the coordination!</p>
              <a href="/admin/shifts" class="btn btn-primary">View All Shifts</a>
            </div>
          </div>
        ` : `
          <!-- Unfilled Shifts -->
          ${Array.from(grouped.entries()).map(([_key, shiftsGroup]) => {
            const firstShift = shiftsGroup[0];
            return `
              <div class="performance-group">
                <div class="performance-header">
                  <h3 class="performance-title">${firstShift.show_name}</h3>
                  <p class="performance-details">
                    ${formatDateAdelaide(new Date(firstShift.date))} | 
                    Show: ${firstShift.show_start} - ${firstShift.show_end}
                  </p>
                </div>
                
                <div class="shifts-grid">
                  ${shiftsGroup.map(shift => {
                    const arriveTime = formatTimeAdelaide(shift.arrive_time);
                    const departTime = formatTimeAdelaide(shift.depart_time);
                    const isNextDay = isDifferentDayAdelaide(shift.arrive_time, shift.depart_time);
                    
                    return `
                      <div class="shift-card">
                        <div class="shift-role">${shift.role}</div>
                        
                        <div class="shift-times">
                          <span class="time-range">
                            ${arriveTime} - ${departTime}
                            ${isNextDay ? '<span class="next-day">+1 day</span>' : ''}
                          </span>
                        </div>
                          <div class="table-actions">
                          <button class="btn btn-sm btn-primary" onclick="assignParticipant(${shift.id})">Assign Participant</button>
                          <a href="/admin/shifts/${shift.id}/edit" class="btn btn-sm btn-secondary">Edit Shift</a>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}        `}
      </div>

      <!-- Assignment Modal -->
      <div id="assignmentModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Assign Participant to Shift</h3>
            <span class="close" onclick="closeAssignmentModal()">&times;</span>
          </div>
          <div id="modalContent">
            <p>Loading available participants...</p>
          </div>
        </div>
      </div>

      <script src="/src/views/admin/unfilled-shifts.js"></script>
    </body>
    </html>
  `;
}
