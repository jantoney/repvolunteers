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
      </div>

      <script src="/src/utils/modal.js"></script>
      ${getAdminScripts()}
      <script src="/src/views/admin/edit-volunteer.js" data-volunteer-id="${volunteer.id}"></script>
    </body>
    </html>
  `;
}
