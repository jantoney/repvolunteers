import type { RouterContext } from "oak";
import { getAdminNavigation, getAdminStyles } from "./components/navigation.ts";

export function renderNewVolunteerTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Add New Volunteer - Rep Volunteers</title>
      <!-- PWA Manifest -->
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}
      <style>
        .form-container { max-width: 600px; margin: 0 auto; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      ${getAdminNavigation('volunteers')}
      
      <!-- Main Content -->
      <div class="main-content">
        <div class="page-header">
          <h1 class="page-title">Add New Volunteer</h1>
        </div>

        <div class="form-container">
          <div id="successMessage" class="success" style="display: none;">
            <strong>Success!</strong> Volunteer created successfully.
            <p>Signup link: <span id="signupLink"></span></p>
          </div>

          <div class="content-card">
            <form id="volunteerForm">
              <div class="form-group">
                <label for="name">Name:</label>
                <input type="text" id="name" name="name" required>
              </div>
              
              <div class="form-group">
                <label for="email">Email (optional):</label>
                <input type="email" id="email" name="email">
              </div>
              
              <div class="form-group">
                <label for="phone">Phone (optional):</label>
                <input type="tel" id="phone" name="phone">
              </div>
              
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">Create Volunteer</button>
                <a href="/admin/volunteers" class="btn btn-secondary">Cancel</a>
              </div>
            </form>
          </div>
        </div>
      </div>

      <script src="/src/utils/modal.js"></script>
      <script>
        document.getElementById('volunteerForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = new FormData(e.target);
          const data = {
            name: formData.get('name'),
            email: formData.get('email') || null,
            phone: formData.get('phone') || null
          };
          
          try {
            const response = await fetch('/admin/api/volunteers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
              credentials: 'include'
            });
            
            if (response.ok) {
              const result = await response.json();
              document.getElementById('signupLink').textContent = result.signupLink;
              document.getElementById('successMessage').style.display = 'block';
              document.getElementById('volunteerForm').reset();
            } else {
              Modal.error('Error', 'Failed to create volunteer');
            }
          } catch (error) {
            Modal.error('Error', 'Error creating volunteer');
          }
        });
      </script>
    </body>
    </html>
  `;
}

export function showNewVolunteerForm(ctx: RouterContext<string>) {
  ctx.response.type = "text/html";
  ctx.response.body = renderNewVolunteerTemplate();
}
