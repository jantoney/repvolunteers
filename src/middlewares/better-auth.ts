import type { Context, RouterContext } from "oak";
import { auth, type User } from "../auth.ts";
import { getAuthPool } from "../models/db.ts";

export async function requireAuth(ctx: Context, next: () => Promise<unknown>) {
  try {
    const request = new Request(ctx.request.url, {
      method: ctx.request.method,
      headers: ctx.request.headers,
    });

    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session || !session.user) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    // Add user to context for later use
    ctx.state.user = session.user as User;
    ctx.state.session = session;
    
    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
  }
}

export async function requireAdminAuth(ctx: Context, next: () => Promise<unknown>) {
  try {
    const request = new Request(ctx.request.url, {
      method: ctx.request.method,
      headers: ctx.request.headers,
    });

    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session || !session.user) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Admin access required" };
      return;
    }

    // Manually check isAdmin status from database since Better Auth might not include it
    const pool = getAuthPool();
    const result = await pool.query(
      'SELECT "isAdmin" FROM "user" WHERE id = $1',
      [session.user.id]
    );
    
    const isAdmin = result.rows.length > 0 ? result.rows[0].isAdmin : false;
    
    if (!isAdmin) {
      console.log("User is not admin:", session.user.email, "isAdmin:", isAdmin);
      ctx.response.status = 403;
      ctx.response.body = { error: "Admin access required" };
      return;
    }

    // Add user to context with isAdmin field
    const user = { ...session.user, isAdmin } as User;
    ctx.state.user = user;
    ctx.state.session = session;
    
    await next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    ctx.response.status = 403;
    ctx.response.body = { error: "Admin access required" };
  }
}

export async function requireVolunteerAccessOrAdmin(ctx: RouterContext<string>, next: () => Promise<unknown>) {
  try {
    const request = new Request(ctx.request.url, {
      method: ctx.request.method,
      headers: ctx.request.headers,
    });

    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session || !session.user) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Authentication required" };
      return;
    }

    // Get the volunteer ID from the URL parameter
    const volunteerId = ctx.params.id;
    if (!volunteerId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Volunteer ID required" };
      return;
    }

    // Check if user is admin
    const pool = getAuthPool();
    const result = await pool.query(
      'SELECT "isAdmin" FROM "user" WHERE id = $1',
      [session.user.id]
    );
    
    const isAdmin = result.rows.length > 0 ? result.rows[0].isAdmin : false;
    
    if (isAdmin) {
      // Admin can access anyone's data
      const user = { ...session.user, isAdmin } as User;
      ctx.state.user = user;
      ctx.state.session = session;
      await next();
      return;
    }

    // For non-admin users, check if they're accessing their own data
    // We need to check if the session user corresponds to the volunteer ID
    // This requires checking if there's a link between the auth user and participant
    const volunteerCheckResult = await pool.query(
      'SELECT id FROM "user" WHERE id = $1 AND email IN (SELECT email FROM participants WHERE id = $2)',
      [session.user.id, volunteerId]
    );

    if (volunteerCheckResult.rows.length === 0) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Access denied - you can only access your own data" };
      return;
    }

    // User is accessing their own data
    ctx.state.user = session.user as User;
    ctx.state.session = session;
    
    await next();
  } catch (error) {
    console.error("Volunteer access middleware error:", error);
    ctx.response.status = 403;
    ctx.response.body = { error: "Access denied" };
  }
}
