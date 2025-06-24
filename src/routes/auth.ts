
// --- ADMIN PASSWORD RESET SUBMIT ENDPOINT ---
// Place this after router is declared

import { Router } from "oak";
import { auth } from "../auth.ts";

console.log("Auth router loaded");

const router = new Router();

// Custom session endpoint that properly fetches admin status
// This must come BEFORE the generic auth route
router.get("/auth/session", async (ctx) => {
  //console.log("Custom session endpoint hit");
  
  try {
    const request = new Request(ctx.request.url, {
      method: ctx.request.method,
      headers: ctx.request.headers,
    });

    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session || !session.user) {
      ctx.response.status = 401;
      ctx.response.body = { user: null, session: null };
      return;
    }

    // Fetch isAdmin status from database
    const { getAuthPool } = await import("../models/db.ts");
    const pool = getAuthPool();
    const result = await pool.query(
      'SELECT "isAdmin" FROM "user" WHERE id = $1',
      [session.user.id]
    );
    
    let isAdmin = false;
    if (result.rows.length > 0) {
      isAdmin = result.rows[0].isAdmin;
    }

    // Return session with enhanced user data
    const enhancedSession = {
      ...session,
      user: {
        ...session.user,
        isAdmin
      }
    };

    //console.log("Enhanced session:", enhancedSession);
    
    ctx.response.status = 200;
    ctx.response.body = enhancedSession;
    
  } catch (error) {
    console.error("Custom session endpoint error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Session endpoint error" };
  }
});

// Add a test route to see what Better Auth exposes
router.get("/auth", (ctx) => {
  //console.log("Base auth route hit");
  ctx.response.body = { 
    message: "Auth router is working",
    endpoints: "Try /auth/session, /auth/signin, /auth/sign-in"
  };
});

// Mount all Better Auth routes - Better Auth expects to handle ALL /auth/* routes
// Since this router is mounted at /api, we handle /auth/* within this context
router.all("/auth/(.*)", async (ctx) => {
  //console.log("Auth route hit:", ctx.request.method, ctx.request.url);
  
  // Better Auth expects the URL to match its baseURL + path
  // We need to construct the request URL that Better Auth expects
  const originalUrl = new URL(ctx.request.url);
  // Create a URL that Better Auth expects: baseURL/api/auth/...
  const authUrl = new URL(originalUrl.pathname, Deno.env.get("BETTER_AUTH_URL") || "http://localhost:8044");
  
  //console.log("Original URL:", originalUrl.href);
  //console.log("Auth URL for Better Auth:", authUrl.href);
  
  const request = new Request(authUrl.href, {
    method: ctx.request.method,
    headers: ctx.request.headers,
    body: ctx.request.hasBody ? await ctx.request.body.blob() : undefined,
  });
  
  try {
    /* console.log("Calling Better Auth handler with request:", {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries())
    }); */
    
    const response = await auth.handler(request);
    
    /* console.log("Better Auth response:", {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    }); */
    
    // Special handling for session endpoint to include isAdmin field
    if (originalUrl.pathname.endsWith('/session') && response.ok && ctx.request.method === "GET") {
      try {
        const sessionData = await response.json();
        
        if (sessionData && sessionData.user) {
          // Fetch isAdmin status from database
          const { getAuthPool } = await import("../models/db.ts");
          const pool = getAuthPool();
          const result = await pool.query(
            'SELECT "isAdmin" FROM "user" WHERE id = $1',
            [sessionData.user.id]
          );
          
          if (result.rows.length > 0) {
            sessionData.user.isAdmin = result.rows[0].isAdmin;
          } else {
            sessionData.user.isAdmin = false;
          }
          
          /* console.log("Enhanced session data:", sessionData); */
        }
        
        ctx.response.status = response.status;
        response.headers.forEach((value: string, key: string) => {
          ctx.response.headers.set(key, value);
        });
        ctx.response.body = sessionData;
        return;
      } catch (error) {
        console.error("Error enhancing session data:", error);
        // Fall through to default handling
      }
    }
    
    // Default handling for all other endpoints
    ctx.response.status = response.status;
    response.headers.forEach((value: string, key: string) => {
      ctx.response.headers.set(key, value);
    });
    
    if (response.body) {
      const text = await response.text();
      /* console.log("Response body:", text); */
      ctx.response.body = text;
    }
  } catch (error) {
    console.error("Better Auth handler error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Authentication service error" };
  }
});

// Custom routes for volunteer management
router.post("/send-link", async (ctx) => {
  try {
    const body = await ctx.request.body.json();
    const { email } = body as { email: string };
    
    if (!email) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Email is required" };
      return;
    }

    // Check if volunteer exists
    const { getPool } = await import("../models/db.ts");
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      const result = await client.queryObject(
        "SELECT id, name, email FROM participants WHERE email = $1 AND approved = true", 
        [email]
      );

      if (result.rows.length === 0) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Email not found" };
        return;
      }

      const volunteer = result.rows[0] as { id: number; name: string; email: string };
      
      // Import and use the email utility
      const { sendVolunteerLoginEmail, createVolunteerLoginUrl } = await import("../utils/email.ts");
      
      const loginUrl = createVolunteerLoginUrl(ctx.request.url.origin, volunteer.id);
      
      // Send the email using our template
      const emailSent = await sendVolunteerLoginEmail({
        volunteerName: volunteer.name,
        volunteerEmail: volunteer.email,
        loginUrl: loginUrl
      });
      
      if (emailSent) {
        console.log(`Email sent to ${email} with login link: ${loginUrl}`);
        ctx.response.status = 200;
        ctx.response.body = { message: "Link sent successfully" };
      } else {
        console.error(`Failed to send email to ${email}`);
        ctx.response.status = 500;
        ctx.response.body = { error: "Failed to send email" };
      }
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error("Error sending link:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to send link" };
  }
});

router.post("/register", async (ctx) => {
  try {
    const body = await ctx.request.body.json();
    const { name, email, phone } = body as { name: string; email: string; phone: string };
    
    if (!name || !email || !phone) {
      ctx.response.status = 400;
      ctx.response.body = { error: "All fields are required" };
      return;
    }

    const { getPool } = await import("../models/db.ts");
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Check if email already exists
      const existingResult = await client.queryObject(
        "SELECT id FROM participants WHERE email = $1", 
        [email]
      );

      if (existingResult.rows.length > 0) {
        ctx.response.status = 409;
        ctx.response.body = { error: "Email already exists" };
        return;
      }

      // Insert new pending volunteer
      const result = await client.queryObject(
        `INSERT INTO participants (name, email, phone, approved, created_at) 
         VALUES ($1, $2, $3, false, NOW()) 
         RETURNING id`,
        [name, email, phone]
      );

      const newVolunteer = result.rows[0] as { id: number };
      console.log(`New registration: ${name} (${email}) - ID: ${newVolunteer.id}`);
      
      // TODO: Send notification email to admin
      
      ctx.response.status = 200;
      ctx.response.body = { 
        message: "Registration submitted successfully",
        id: newVolunteer.id
      };
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error("Error registering volunteer:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Registration failed" };
  }
});

export default router;

// --- ADMIN PASSWORD RESET SUBMIT ENDPOINT ---
router.post("/admin/reset-password", async (ctx) => {
  try {
    const { token, password } = await ctx.request.body.json();
    if (!token || !password) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Missing token or password." };
      return;
    }

    // Use Better Auth API directly with correct parameters
    const result = await auth.api.resetPassword({
      body: {
        newPassword: password,
        token: token,
      },
    });

    if (!result.status) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Failed to reset password." };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = { message: "Password reset successful. You may now log in with your new password." };
  } catch (error) {
    console.error("Error in admin password reset submit:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to reset password." };
  }
});

// --- ADMIN PASSWORD RESET ENDPOINT ---
// Use Better Auth's built-in API for password reset requests
router.post("/admin/password-reset", async (ctx) => {
  try {
    const { email } = await ctx.request.body.json();
    if (!email) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Email is required" };
      return;
    }

    // Forward to Better Auth's request-password-reset endpoint
    const req = new Request(
      new URL("/api/auth/request-password-reset", ctx.request.url),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );
    const response = await auth.handler(req);
    const result = await response.json();

    if (!response.ok || result.error) {
      ctx.response.status = 400;
      ctx.response.body = { error: result?.error || "Failed to send password reset email." };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = { message: result?.message || `Password reset email sent to ${email}` };
  } catch (error) {
    console.error("Error in admin password reset:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to process password reset request" };
  }
});
