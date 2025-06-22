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
        input[type="email"], input[type="password"] { 
          width: 100%; 
          padding: 0.75rem; 
          border: 1px solid #dee2e6; 
          border-radius: 4px; 
          box-sizing: border-box;
          font-size: 1rem;
        }
        input[type="email"]:focus, input[type="password"]:focus { 
          outline: none; 
          border-color: #007bff; 
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
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
        
        <form id="loginForm">
          <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required autocomplete="email">
          </div>
          
          <div class="form-group">
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required autocomplete="current-password">
          </div>
          
          <button type="submit" class="btn" id="loginBtn">
            Login
          </button>
          
          <div class="loading" id="loading">
            Signing in...
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
          const loading = document.getElementById('loading');
          const errorMessage = document.getElementById('errorMessage');
          
          // Show loading state
          btn.disabled = true;
          btn.textContent = 'Signing in...';
          loading.style.display = 'block';
          errorMessage.style.display = 'none';
          
          const formData = new FormData(e.target);
          const email = formData.get('email');
          const password = formData.get('password');
          
          try {
            // First attempt to sign in
            const response = await fetch('/api/auth/sign-in/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
              credentials: 'include'
            });
            
            if (response.ok) {
              // After successful login, check the session to verify admin status
              const sessionResponse = await fetch('/api/auth/session', {
                credentials: 'include'
              });
              
              if (sessionResponse.ok) {
                const sessionData = await sessionResponse.json();
                
                if (sessionData.user && sessionData.user.isAdmin) {
                  // Redirect to admin dashboard
                  window.location.href = '/admin/dashboard';
                } else {
                  errorMessage.textContent = 'Admin access required';
                  errorMessage.style.display = 'block';
                }
              } else {
                errorMessage.textContent = 'Failed to verify admin status';
                errorMessage.style.display = 'block';
              }
            } else {
              const error = await response.text();
              errorMessage.textContent = error || 'Invalid email or password';
              errorMessage.style.display = 'block';
            }
          } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = 'Login failed. Please try again.';
            errorMessage.style.display = 'block';
          } finally {
            // Reset button state
            btn.disabled = false;
            btn.textContent = 'Login';
            loading.style.display = 'none';
          }
        });
        
        // Focus on email field when page loads
        document.getElementById('email').focus();
      </script>
    </body>
    </html>
  `;
}

export function showLoginForm(ctx: RouterContext<string>) {
  ctx.response.headers.set("Content-Type", "text/html");
  ctx.response.body = renderLoginTemplate();
}
