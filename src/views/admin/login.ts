import type { RouterContext } from "oak";

export function renderLoginTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Admin Login - Theatre Shifts</title>
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
          max-width: 450px; 
          margin: 2rem auto; 
          padding: 2rem; 
          background: #f8f9fa;
        }
        .login-form { 
          background: white; 
          padding: 2.5rem; 
          border-radius: 8px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { 
          text-align: center; 
          color: #333; 
          margin-bottom: 2rem;
          font-size: 1.8rem;
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
        .btn { 
          width: 100%; 
          padding: 0.75rem; 
          background: #007bff; 
          color: white; 
          border: none; 
          border-radius: 4px; 
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        .btn:hover { 
          background: #0056b3; 
        }
        .btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        .microsoft-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          background: #2f2f2f;
        }
        .microsoft-btn:hover {
          background: #1f1f1f;
        }
        .microsoft-mark {
          display: grid;
          grid-template-columns: repeat(2, 0.55rem);
          grid-template-rows: repeat(2, 0.55rem);
          gap: 0.12rem;
          flex: 0 0 auto;
        }
        .microsoft-mark span:nth-child(1) { background: #f25022; }
        .microsoft-mark span:nth-child(2) { background: #7fba00; }
        .microsoft-mark span:nth-child(3) { background: #00a4ef; }
        .microsoft-mark span:nth-child(4) { background: #ffb900; }
        .login-copy {
          color: #495057;
          line-height: 1.5;
          margin: 0 0 1.5rem;
          text-align: center;
        }
        .error { 
          background: #f8d7da; 
          border: 1px solid #f5c6cb; 
          color: #721c24; 
          padding: 0.75rem; 
          border-radius: 4px; 
          margin-bottom: 1rem;
          text-align: center;
        }
        .loading {
          display: none;
          text-align: center;
          margin-top: 1rem;
          color: #6c757d;
        }        .form-footer {
          text-align: center;
          margin-top: 2rem;
          color: #6c757d;
          font-size: 0.9rem;
        }
        .home-link {
          color: #007bff;
          text-decoration: none;
          margin-top: 0.5rem;
          display: inline-block;
          font-size: 0.9rem;
          transition: color 0.2s;
        }
        .home-link:hover {
          color: #0056b3;
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="login-form">
        <h1>Admin Login</h1>
        
        <div id="errorMessage" class="error" style="display: none;"></div>
        
        <p class="login-copy">
          Sign in with your Microsoft 365 account. Admin access is limited to members of the Theatre Shifts Web App Admins group.
        </p>

        <form id="loginForm">
          <button type="submit" class="btn microsoft-btn" id="loginBtn">
            <span class="microsoft-mark" aria-hidden="true">
              <span></span><span></span><span></span><span></span>
            </span>
            <span id="loginBtnText">Sign in with Microsoft</span>
          </button>
          
          <div class="loading" id="loading">
            Redirecting to Microsoft...
          </div>
        </form>
          <div class="form-footer">
          Theatre Shifts Admin Panel
          <br>
          <a href="/" class="home-link">← Back to Home</a>
        </div>
      </div>      <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const btn = document.getElementById('loginBtn');
          const btnText = document.getElementById('loginBtnText');
          const loading = document.getElementById('loading');
          const errorMessage = document.getElementById('errorMessage');
          
          // Show loading state
          btn.disabled = true;
          btnText.textContent = 'Redirecting...';
          loading.style.display = 'block';
          errorMessage.style.display = 'none';

          try {
            const response = await fetch('/api/auth/sign-in/social', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                provider: 'microsoft',
                callbackURL: '/admin/dashboard',
                errorCallbackURL: '/admin/login'
              }),
              credentials: 'include'
            });

            let result = {};
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              try {
                result = await response.json();
              } catch (_) {
                result = {};
              }
            }

            if (!response.ok || !result.url) {
              errorMessage.textContent = result.message || result.error || 'Microsoft sign-in could not be started.';
              errorMessage.style.display = 'block';
              return;
            }

            window.location.href = result.url;
          } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = 'Microsoft sign-in failed. Please try again.';
            errorMessage.style.display = 'block';
          } finally {
            btn.disabled = false;
            btnText.textContent = 'Sign in with Microsoft';
            loading.style.display = 'none';
          }
        });

        const query = new URLSearchParams(window.location.search);
        const error = query.get('error') || query.get('error_description');
        if (error) {
          const errorMessage = document.getElementById('errorMessage');
          errorMessage.textContent = error.replaceAll('_', ' ');
          errorMessage.style.display = 'block';
        }
      </script>
    </body>
    </html>
  `;
}

export function showLoginForm(ctx: RouterContext<string>) {
  ctx.response.headers.set("Content-Type", "text/html");
  ctx.response.body = renderLoginTemplate();
}
