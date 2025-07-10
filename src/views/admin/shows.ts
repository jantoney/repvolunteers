import type { RouterContext } from "oak";
import { getPool } from "../../models/db.ts";
import { formatDate } from "../../utils/timezone.ts";
import { getAdminNavigation, getAdminStyles, getAdminScripts } from "./components/navigation.ts";

export interface Show {
  id: number;
  name: string;
  created_at: Date;
  show_date_count: number;
  first_date: Date | null;
  last_date: Date | null;
  total_shifts: number;
  filled_shifts: number;
}

export interface ShowsPageData {
  shows: Show[];
}

export function renderShowsTemplate(data: ShowsPageData): string {
  const { shows } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Manage Shows - Theatre Shifts</title>
      <!-- PWA Manifest -->
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}      <style>
        .expandable-row { display: none; }
        .expandable-row.expanded { display: table-row; }
        .expandable-row td { background: #f8f9fa; border-left: 3px solid #007bff; }
        .expand-btn { background: none; border: none; color: #007bff; cursor: pointer; padding: 0; font-size: 0.875rem; }
        .expand-btn:hover { text-decoration: underline; }
        
        /* Traffic light indicator styles */
        .traffic-light {
          display: inline-block;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          margin-right: 8px;
          border: 2px solid;
        }
        .traffic-light.green {
          background-color: #28a745;
          border-color: #1e7e34;
        }
        .traffic-light.yellow {
          background-color: #ffc107;
          border-color: #d39e00;
        }
        .traffic-light.red {
          background-color: #dc3545;
          border-color: #bd2130;
        }
        .traffic-light.grey {
          background-color: #6c757d;
          border-color: #545b62;
        }
        
        .shift-stats {
          font-size: 0.875rem;
          color: #6c757d;
          margin-left: 4px;
        }
        
        .performance-link {
          color: #007bff;
          text-decoration: none;
          font-weight: 500;
        }
        .performance-link:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      ${getAdminNavigation('shows')}

      <!-- Main Content -->
      <div class="main-content">
        <div class="page-header">
          <h1 class="page-title">Manage Shows</h1>
          <div class="page-actions">
            <a href="/admin/shows/new" class="btn btn-primary">Add New Show</a>
          </div>
        </div>

        <div class="content-card">
          <div class="alert info-alert" style="background: #e9f5fd; border: 1px solid #c5e5fc; border-left: 4px solid #007bff; padding: 0.75rem 1rem; margin-bottom: 1rem; border-radius: 0.25rem; display: flex; align-items: center;">
            <i class="fas fa-info-circle" style="color: #007bff; margin-right: 0.5rem;"></i>
            <div>
              <strong>All times are displayed in Adelaide, Australia timezone</strong><br>
              <span id="currentAdelaideTime" style="color: #666; font-size: 0.875rem;"></span>
            </div>
          </div>
          
          <div class="table-container">
            <table class="table">              <thead>
                <tr>
                  <th>Show Name</th>
                  <th>Performance Dates</th>
                  <th>Date Range</th>
                  <th>Shift Status</th>
                  <th>Actions</th>
                </tr>
              </thead>              <tbody>                ${shows.map(show => {                  // Calculate traffic light color based on filled vs total shifts
    let trafficColor = 'grey';
    let statusText = 'No shifts';

    if (show.total_shifts > 0) {
      const fillPercentage = (show.filled_shifts / show.total_shifts) * 100;
      if (fillPercentage >= 80) {
        trafficColor = 'green';
        statusText = `${show.filled_shifts}/${show.total_shifts} filled`;
      } else if (fillPercentage >= 50) {
        trafficColor = 'yellow';
        statusText = `${show.filled_shifts}/${show.total_shifts} filled`;
      } else {
        trafficColor = 'red';
        statusText = `${show.filled_shifts}/${show.total_shifts} filled`;
      }
    }

    return `                    <tr>                      <td>
                        <strong>${show.name}</strong>
                        ${show.show_date_count > 0 ? `<br><button class="expand-btn" onclick="toggleDates(${show.id})">View ${show.show_date_count} performance date(s)</button>` : ''}
                      </td>
                      <td>${show.show_date_count} performance${show.show_date_count !== 1 ? 's' : ''}</td>
                      <td>
                        ${show.first_date && show.last_date ?
        (show.first_date.getTime() === show.last_date.getTime() ?
          formatDate(show.first_date) :
          `${formatDate(show.first_date)} - ${formatDate(show.last_date)}`
        ) : 'No dates set'
      }
                      </td>
                      <td>
                        <span class="traffic-light ${trafficColor}" title="${statusText}"></span>
                        <span class="shift-stats">${statusText}</span>
                      </td>
                      <td>
                        <div class="table-actions">
                          <a href="/admin/shows/${show.id}/edit" class="btn btn-sm btn-secondary">Edit</a>
                          <button onclick="deleteShow(${show.id}, '${show.name.replace(/'/g, "\\'")}')" class="btn btn-sm btn-danger">Delete</button>
                        </div>
                      </td>
                    </tr>
                    <tr class="expandable-row" id="dates-${show.id}">
                      <td colspan="5">
                        <div id="dates-content-${show.id}" style="padding: 1rem;">Loading dates...</div>
                      </td>
                    </tr>
                  `;
  }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <script src="/src/utils/modal.js"></script>
      <script src="/src/utils/timezone-client.js"></script>
      ${getAdminScripts()}
      <script>
        // Global variable for tracking expanded shows
        var expandedShows = new Set();
        
        // Display and update current Adelaide time
        function updateAdelaideTime() {
          const timeElement = document.getElementById('currentAdelaideTime');
          if (timeElement) {
            const adelaideTZ = DateTimeFormat.ADELAIDE_TIMEZONE;
            const now = new Date();
            const adelaideTime = DateTimeFormat.formatDateTime(now);
          }
        }
        
        // Update time immediately and then every minute
        updateAdelaideTime();
        setInterval(updateAdelaideTime, 60000);
        
        // Global function for toggling show dates
        window.toggleDates = async function(showId) {
          const row = document.getElementById(\`dates-\${showId}\`);
          const content = document.getElementById(\`dates-content-\${showId}\`);
          
          if (expandedShows.has(showId)) {
            row.classList.remove('expanded');
            expandedShows.delete(showId);
          } else {
            row.classList.add('expanded');
            expandedShows.add(showId);
            
            if (content.textContent === 'Loading dates...') {
              try {
                const response = await fetch(\`/admin/api/shows/\${showId}/dates\`, {
                  credentials: 'include'
                });
                
                if (response.ok) {
                  const dates = await response.json();
                  
                  if (dates.length === 0) {
                    content.innerHTML = '<em>No performance dates set</em>';
                  } else {                    content.innerHTML = \`
                      <table style="width: 100%; margin: 0;">
                        <thead>
                          <tr style="background: none;">
                            <th style="padding: 0.5rem; border: none;">Date</th>
                            <th style="padding: 0.5rem; border: none;">Show Time</th>
                            <th style="padding: 0.5rem; border: none;">Shifts</th>
                            <th style="padding: 0.5rem; border: none;">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          \${dates.map(date => {
                            // Calculate shift status for this performance
                            const fillPercentage = date.total_shifts > 0 ? (date.filled_shifts / date.total_shifts) * 100 : 0;
                            let trafficColor = 'grey';
                            if (date.total_shifts > 0) {
                              if (fillPercentage >= 80) trafficColor = 'green';
                              else if (fillPercentage >= 50) trafficColor = 'yellow';
                              else trafficColor = 'red';
                            }
                            
                            return \`
                              <tr>
                                <td style="padding: 0.5rem; border: none;">\${DateTimeFormat.formatDate(new Date(date.start_time))}</td>
                                <td style="padding: 0.5rem; border: none;">\${DateTimeFormat.formatShowTimeRange(new Date(date.start_time), new Date(date.end_time))}</td>
                                <td style="padding: 0.5rem; border: none;">
                                  <span class="traffic-light \${trafficColor}" style="width: 16px; height: 16px; margin-right: 6px;" 
                                        title="\${date.total_shifts > 0 ? date.filled_shifts + '/' + date.total_shifts + ' filled' : 'No shifts'}"></span>
                                  \${date.total_shifts > 0 ? date.filled_shifts + '/' + date.total_shifts : 'No shifts'}
                                </td>
                                <td style="padding: 0.5rem; border: none;">
                                  \${date.total_shifts > 0 ? 
                                    \`<a href="/admin/shifts?shows=\${showId}&date=\${DateTimeFormat.formatDateForInput(new Date(date.start_time))}" class="performance-link">View Shifts</a>\` : 
                                    '<span style="color: #6c757d;">No shifts</span>'
                                  }
                                </td>
                              </tr>
                            \`;
                          }).join('')}
                        </tbody>
                      </table>
                    \`;
                  }
                } else {
                  content.innerHTML = '<em>Error loading dates</em>';
                }
              } catch (error) {
                console.error('Error:', error);
                content.innerHTML = '<em>Error loading dates</em>';
              }
            }
          }
        }
        
        // Global function for deleting shows
        window.deleteShow = async function(id, name) {
          if (!confirm(\`Are you sure you want to delete the show "\${name}"? This will also delete all associated performance dates and shifts.\`)) {
            return;
          }
          
          try {
            const response = await fetch(\`/admin/api/shows/\${id}\`, {
              method: 'DELETE',
              credentials: 'include'
            });
            
            if (response.ok) {
              location.reload();
            } else {
              Modal.error('Error', 'Failed to delete show');
            }
          } catch (error) {
            console.error('Error:', error);
            Modal.error('Error', 'Error deleting show');
          }
        }
      </script>
    </body>
    </html>
  `;
}

export async function showShowsPage(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.queryObject<Show>(`
      SELECT s.id, s.name, s.created_at,
             COUNT(DISTINCT sd.id) as show_date_count,
             MIN(sd.start_time) as first_date,
             MAX(sd.start_time) as last_date,
             COUNT(DISTINCT sh.id) as total_shifts,
             COUNT(DISTINCT CASE WHEN vs.participant_id IS NOT NULL THEN sh.id END) as filled_shifts
      FROM shows s
      LEFT JOIN show_dates sd ON sd.show_id = s.id
      LEFT JOIN shifts sh ON sh.show_date_id = sd.id
      LEFT JOIN participant_shifts vs ON vs.shift_id = sh.id
      GROUP BY s.id, s.name, s.created_at
      ORDER BY s.name    `);

    // Convert BigInt count values to numbers
    const shows = result.rows.map(show => ({
      ...show,
      show_date_count: Number(show.show_date_count),
      total_shifts: Number(show.total_shifts),
      filled_shifts: Number(show.filled_shifts)
    }));

    const data: ShowsPageData = {
      shows
    };

    ctx.response.type = "text/html";
    ctx.response.body = renderShowsTemplate(data);
  } finally {
    client.release();
  }
}
