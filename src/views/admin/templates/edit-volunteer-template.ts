import { getAdminNavigation, getAdminStyles, getAdminScripts } from "../components/navigation.ts";

export interface Volunteer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface EditVolunteerPageData {
  volunteer: Volunteer;
}

export function renderEditVolunteerTemplate(data: EditVolunteerPageData): string {
  const { volunteer } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Edit Volunteer - Rep Volunteers</title>
      <!-- PWA Manifest -->
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}
      <link rel="stylesheet" href="/src/views/admin/edit-volunteer.css">
    </head>
    <body>
      ${getAdminNavigation('volunteers')}
      
      <!-- Main Content -->
      <div class="main-content">
        <div class="page-header">
          <h1 class="page-title">Edit Volunteer</h1>
        </div>

        <div class="form-container">
          <form id="volunteerForm">
            <div class="form-group">
              <label for="name">Name:</label>
              <input type="text" id="name" name="name" value="${volunteer.name}" required>
            </div>
            
            <div class="form-group">
              <label for="email">Email (optional):</label>
              <input type="email" id="email" name="email" value="${volunteer.email || ''}">
            </div>
            
            <div class="form-group">
              <label for="phone">Phone (optional):</label>
              <input type="tel" id="phone" name="phone" value="${volunteer.phone || ''}">
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Update Volunteer</button>
              <a href="/admin/volunteers" class="btn btn-secondary">Cancel</a>
            </div>
          </form>
        </div>

        <!-- Email History Section -->
        <div class="email-history-section" style="margin-top: 2rem;">
          <div class="section-header">
            <h2>Email History</h2>
            <p class="text-muted">All emails sent to this volunteer</p>
          </div>
          
          <div id="emailHistoryContainer" class="email-history-container">
            <div class="loading-spinner" id="emailHistoryLoading">
              <div class="spinner"></div>
              <span>Loading email history...</span>
            </div>
            <div id="emailHistoryContent" style="display: none;">
              <!-- Email history will be loaded here -->
            </div>
            <div id="emailHistoryError" style="display: none;" class="alert alert-warning">
              No email history found for this volunteer.
            </div>
          </div>
        </div>
      </div>

      <!-- Email Content Modal -->
      <div id="emailContentModal" class="modal modal-fullscreen" style="display: none;">
  <div class="modal-content modal-lg" style="max-width: calc(100vw - 4vw); width: 100%; max-height: calc(100vh - 4vw); margin: 0 auto; box-sizing: border-box;">
          <div class="modal-header">
            <h3 id="emailContentTitle">Email Details</h3>
            <button type="button" class="close" onclick="closeEmailModal()">&times;</button>
          </div>
          <div class="modal-body" id="emailContentBody">
            <!-- Email content will be loaded here -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeEmailModal()">Close</button>
          </div>
        </div>
      </div>

      <script src="/src/utils/modal.js"></script>
      ${getAdminScripts()}
      <script src="/src/views/admin/edit-volunteer.js" data-volunteer-id="${volunteer.id}"></script>
    </body>
    </html>
  `;
}
