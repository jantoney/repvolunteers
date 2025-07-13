import { Router } from "oak";
import { send } from "https://deno.land/x/oak@v17.1.4/send.ts";
import adminRouter from "./admin.ts";
import volunteerRouter from "./volunteer.ts";
import authRouter from "./auth.ts";

const router = new Router();

// Serve JavaScript and CSS files from utils and admin directories
router.get("/src/utils/:filename", async (ctx) => {
  const filename = ctx.params.filename;
  if (filename && filename.endsWith('.js')) {
    try {
      await send(ctx, `src/utils/${filename}`, {
        root: Deno.cwd(),
      });
    } catch {
      ctx.response.status = 404;
    }
  } else {
    ctx.response.status = 404;
  }
});

router.get("/src/views/admin/:filename", async (ctx) => {
  const filename = ctx.params.filename;
  if (filename && (filename.endsWith('.js') || filename.endsWith('.css'))) {
    try {
      await send(ctx, `src/views/admin/${filename}`, {
        root: Deno.cwd(),
      });
    } catch {
      ctx.response.status = 404;
    }
  } else {
    ctx.response.status = 404;
  }
});

// PWA manifest
router.get("/manifest.webmanifest", async (ctx) => {
  ctx.response.headers.set("Content-Type", "application/manifest+json");
  await send(ctx, "manifest.webmanifest", {
    root: Deno.cwd(),
  });
});

// PWA service worker
router.get("/service-worker.js", async (ctx) => {
  ctx.response.headers.set("Content-Type", "application/javascript");
  await send(ctx, "service-worker.js", {
    root: Deno.cwd(),
  });
});

// PWA icons - support nested directories
router.get("/icons/:platform/:filename", async (ctx) => {
  const platform = ctx.params.platform;
  const filename = ctx.params.filename;
  if (platform && filename && filename.match(/\.(png|jpg|jpeg|svg|ico)$/)) {
    await send(ctx, `icons/${platform}/${filename}`, {
      root: Deno.cwd(),
    });
  } else {
    ctx.response.status = 404;
  }
});

// PWA icons - direct access to root icons
router.get("/icons/:filename", async (ctx) => {
  const filename = ctx.params.filename;
  if (filename && filename.match(/\.(png|jpg|jpeg|svg|ico|json)$/)) {
    await send(ctx, `icons/${filename}`, {
      root: Deno.cwd(),
    });
  } else {
    ctx.response.status = 404;
  }
});

// Root route - welcome page
router.get("/", (ctx) => {
  ctx.response.type = "text/html";
  ctx.response.body = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">      <title>Theatre Shifts</title>
      <!-- PWA Manifest -->
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 2rem; 
          text-align: center;
          background-color: #f8f9fa;
          padding-bottom: 6rem;
        }
        .container {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section { 
          margin: 2rem 0; 
          padding: 1.5rem; 
          border: 1px solid #dee2e6; 
          border-radius: 8px;
          background: #f8f9fa;
        }
        .section h2 {
          color: #333;
          margin-bottom: 1rem;
          border-bottom: 2px solid #007bff;
          padding-bottom: 0.5rem;
        }
        .btn { 
          display: inline-block; 
          padding: 0.75rem 1.5rem; 
          margin: 0.5rem; 
          background: #007bff; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px;
          font-size: 1rem;
          transition: background-color 0.2s;
          border: none;
          cursor: pointer;
        }
        .btn:hover { 
          background: #0056b3; 
          transform: translateY(-1px);
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
        .btn-danger {
          background: #dc3545;
        }
        .btn-danger:hover {
          background: #c82333;
        }
        .volunteer-list {
          display: grid;
          gap: 1rem;
          margin-top: 1rem;
        }
        .volunteer-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .volunteer-info {
          text-align: left;
        }
        .volunteer-name {
          font-weight: bold;
          color: #333;
          margin-bottom: 0.25rem;
        }
        .volunteer-last-visit {
          font-size: 0.875rem;
          color: #666;
        }
        .volunteer-actions {
          display: flex;
          gap: 0.5rem;
        }
        .no-volunteers {
          color: #666;
          font-style: italic;
          padding: 2rem;
        }
        .admin-section {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 2px solid #dee2e6;
        }
        .clear-btn {
          margin-top: 1rem;
        }        h1 {
          color: #333;
          margin-bottom: 0.5rem;
        }
        .subtitle {
          color: #666;
          margin-bottom: 2rem;
        }
        
        /* Form styling */
        .form-group {
          margin-bottom: 1rem;
          text-align: left;
        }
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }
        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          font-size: 1rem;
          box-sizing: border-box;
        }
        .form-group input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }
        .form-actions {
          text-align: center;
          margin-top: 1rem;
        }
        .hidden {
          display: none;
        }
        .error-message, .success-message {
          padding: 0.75rem;
          margin: 1rem 0;
          border-radius: 6px;
          text-align: center;
        }
        .error-message {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }        .success-message {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }
        
        /* Two-column access layout */
        .access-methods {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        
        .access-column {
          padding: 1.5rem;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          background: #f8f9fa;
        }
        
        .access-column h3 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          color: #333;
        }
        
        .access-column p {
          margin-bottom: 1rem;
          color: #666;
        }
          /* Mobile responsiveness */
        @media (max-width: 768px) {
          body {
            padding: 1rem;
          }
          .volunteer-item {
            flex-direction: column;
            gap: 1rem;
          }
          .volunteer-actions {
            width: 100%;
            justify-content: center;
          }
          .access-methods {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      </style>
    </head>
    <body>      <div class="container">
        <h1>🎭 Theatre Shifts</h1>
        <p class="subtitle">Shift management system for productions</p>
        
        <div id="recentAccessSection" class="section hidden">
          <h2>Your Recent Access</h2>
          <p>Quick access to your shift signup pages</p>
          <div id="volunteerList" class="volunteer-list">
          </div>
          <button id="clearVolunteers" class="btn btn-danger clear-btn" style="display: none;" onclick="clearSavedVolunteers()">
            Clear All Saved Profiles
          </button>
        </div>
          <div class="section">
          <h2>Access Your Shifts</h2>
          
          <div class="access-methods">
            <div class="access-column">
              <h3>Enter Account ID</h3>
              <form id="directAccessForm">
                <div class="form-group">
                  <label for="volunteerIdInput">Account ID</label>
                  <input type="text" id="volunteerIdInput" name="volunteerId" required placeholder="Enter your volunteer UUID">
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn">Access My Shifts</button>
                </div>
              </form>
              <div id="directAccessMessage"></div>
            </div>
            
            <div class="access-column">
              <h3>Login to your account</h3>
              <p>Get your personal shift login link via email. Existing users only.</p>
              <div class="form-actions">
                <button type="button" class="btn" onclick="showEmailLoginModal()">Send My Link</button>
              </div>
            </div>
          </div>
          
          <div>
            <h3>New? Register Here</h3>
            <p>Register to be added to the shift system</p>
            <form id="registerForm">
              <div class="form-group">
                <label for="registerName">Full Name</label>
                <input type="text" id="registerName" name="name" required>
              </div>
              <div class="form-group">
                <label for="registerEmail">Email Address</label>
                <input type="email" id="registerEmail" name="email" required>
              </div>
              <div class="form-group">
                <label for="registerPhone">Phone Number</label>
                <input type="tel" id="registerPhone" name="phone" required>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn">Register</button>
              </div>
            </form>
            <div id="registerMessage"></div>
          </div>
          
        </div>
        
        <!-- Admin section moved to bottom -->
        <div class="section admin-section">
          <h2>Administration</h2>
          <p>Manage shows, participants, and shifts</p>
          <a href="/admin/login" class="btn btn-outline">Admin Login</a>
        </div>      </div>

      <!-- Modal and PWA scripts -->
      <script src="/src/utils/modal.js"></script>
      <script>
        // PWA Service Worker Registration
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/service-worker.js')
            .then(() => console.log('SW registered'))
            .catch(err => console.error('SW registration failed:', err));
        }

        // iOS PWA Install Banner functions (similar to signup page)
        function isIos() {
          return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
        }

        function isInStandaloneMode() {
          return window.navigator.standalone === true;
        }

        function showIOSInstallBanner() {
          if (isIos() && !isInStandaloneMode()) {
            if (localStorage.getItem('ios-install-banner-dismissed') === 'true') {
              return;
            }

            const banner = document.createElement('div');
            banner.style.cssText = \`
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              background: #fff;
              border-top: 1px solid #ccc;
              padding: 1rem;
              text-align: center;
              font-family: inherit;
              z-index: 1000;
              box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            \`;
            banner.innerHTML = \`
              📲 To install this app, tap <strong>Share</strong> then <strong>Add to Home Screen</strong>
              <button style="background: #dc3545; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; margin-left: 0.5rem; cursor: pointer; font-size: 0.8rem;" onclick="this.parentNode.remove(); localStorage.setItem('ios-install-banner-dismissed', 'true');">✖️</button>
            \`;
            document.body.appendChild(banner);
          }
        }        // Load and display saved volunteers
        function loadSavedVolunteers() {
          const savedVolunteers = JSON.parse(localStorage.getItem('savedVolunteers') || '[]');
          const volunteerList = document.getElementById('volunteerList');
          const clearBtn = document.getElementById('clearVolunteers');
          const recentSection = document.getElementById('recentAccessSection');

          if (savedVolunteers.length === 0) {
            recentSection.classList.add('hidden');
          } else {
            recentSection.classList.remove('hidden');
            volunteerList.innerHTML = savedVolunteers.map(volunteer => \`
              <div class="volunteer-item">
                <div class="volunteer-info">
                  <div class="volunteer-name">\${volunteer.name}</div>
                  <div class="volunteer-last-visit">Last visited: \${formatDate(volunteer.lastVisited)}</div>
                </div>
                <div class="volunteer-actions">
                  <a href="/volunteer/signup/\${volunteer.id}" class="btn">Access Shifts</a>
                  <button class="btn btn-danger" onclick="removeSavedVolunteer('\${volunteer.id}')">Remove</button>
                </div>
              </div>
            \`).join('');
            clearBtn.style.display = 'block';
          }
        }

        function formatDate(dateString) {
          const date = new Date(dateString);
          const now = new Date();
          const diffTime = Math.abs(now - date);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            return 'Today';
          } else if (diffDays === 2) {
            return 'Yesterday';
          } else if (diffDays <= 7) {
            return \`\${diffDays - 1} days ago\`;
          } else {
            return date.toLocaleDateString();
          }
        }

        function removeSavedVolunteer(volunteerId) {
          const savedVolunteers = JSON.parse(localStorage.getItem('savedVolunteers') || '[]');
          const filteredVolunteers = savedVolunteers.filter(v => v.id !== volunteerId);
          localStorage.setItem('savedVolunteers', JSON.stringify(filteredVolunteers));
          loadSavedVolunteers();
        }        function clearSavedVolunteers() {
          if (confirm('Are you sure you want to clear all saved profiles?')) {
            localStorage.removeItem('savedVolunteers');
            loadSavedVolunteers();
          }
        }        // Show email login modal
        function showEmailLoginModal() {
          const modal = Modal.createModal('email-login', {
            title: 'Login to your account',
            body: \`
              <form id="modalEmailForm">
                <div class="form-group">
                  <label for="modalEmailInput">Email Address</label>
                  <input type="email" id="modalEmailInput" name="email" required>
                </div>
                <div id="modalEmailMessage"></div>
              </form>
            \`,
            buttons: [
              {
                text: 'Cancel',
                className: 'modal-btn-outline',
                action: 'cancel'
              },
              {
                text: 'Send My Link',
                className: 'modal-btn-primary',
                action: 'submit',
                handler: async () => {
                  const email = document.getElementById('modalEmailInput').value;
                  const messageEl = document.getElementById('modalEmailMessage');
                  
                  if (!email) {
                    messageEl.innerHTML = '<div class="error-message">Please enter your email address.</div>';
                    return false; // Don't close modal
                  }
                  
                  try {
                    const response = await fetch('/api/send-link', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email })
                    });
                    
                    if (response.ok) {
                      Modal.success('Success', 'Link sent! Check your email for your personal shift signup link.');
                      return true; // Close modal
                    } else if (response.status === 404) {
                      messageEl.innerHTML = '<div class="error-message">Email not found. Please register first or contact the administrator.</div>';
                      return false; // Don't close modal
                    } else {
                      throw new Error('Failed to send email');
                    }
                  } catch (error) {
                    messageEl.innerHTML = '<div class="error-message">Failed to send email. Please try again.</div>';
                    return false; // Don't close modal
                  }
                }
              }
            ]
          });
          
          Modal.showModal('email-login');
        }

        // Make function globally accessible
        window.showEmailLoginModal = showEmailLoginModal;

        // Handle direct ID access form
        document.getElementById('directAccessForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const volunteerId = document.getElementById('volunteerIdInput').value;
          const messageEl = document.getElementById('directAccessMessage');
          
          if (!volunteerId) {
            messageEl.innerHTML = '<div class="error-message">Please enter your volunteer ID.</div>';
            return;
          }
          
          // Validate that the volunteer ID exists by trying to redirect
          // The server will handle the 404 if the volunteer doesn't exist
          window.location.href = \`/volunteer/signup/\${volunteerId}\`;
        });

        // Handle registration form
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = {
            name: document.getElementById('registerName').value,
            email: document.getElementById('registerEmail').value,
            phone: document.getElementById('registerPhone').value
          };
          const messageEl = document.getElementById('registerMessage');
          
          try {
            const response = await fetch('/api/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
            });
            
            if (response.ok) {
              messageEl.innerHTML = '<div class="success-message">Registration submitted! You will be contacted once approved.</div>';
              document.getElementById('registerForm').reset();            } else if (response.status === 409) {
              messageEl.innerHTML = '<div class="error-message">Email already exists. Use "Login to your account" instead.</div>';
            } else {
              throw new Error('Registration failed');
            }
          } catch (error) {
            messageEl.innerHTML = '<div class="error-message">Registration failed. Please try again.</div>';
          }
        });

        // Initialize page
        window.addEventListener('load', () => {
          loadSavedVolunteers();
          setTimeout(showIOSInstallBanner, 2000);
        });
      </script>
    </body>
    </html>
  `;
});

router.use("/admin", adminRouter.routes(), adminRouter.allowedMethods());
router.use("/volunteer", volunteerRouter.routes(), volunteerRouter.allowedMethods());
router.use("/api", authRouter.routes(), authRouter.allowedMethods());

export default router;
