import type { Context, RouterContext } from "oak";
import { auth, type User } from "../auth.ts";
import { getAuthPool, getPool } from "../models/db.ts";
import { getMicrosoftAdminAccessForUser } from "../utils/microsoft-admin.ts";
import { renderErrorPage } from "../views/error-page.ts";

function wantsHtmlPage(ctx: Context): boolean {
  const pathname = new URL(ctx.request.url).pathname;

  return ctx.request.method === "GET" &&
    !pathname.includes("/api/");
}

async function getVolunteerSignupHref(
  email?: string | null,
): Promise<string | undefined> {
  if (!email) return undefined;

  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.queryObject<{ id: string }>(
      "SELECT id FROM participants WHERE lower(email) = lower($1) AND approved = true AND status = 'active' ORDER BY name LIMIT 1",
      [email],
    );

    const volunteer = result.rows[0];
    return volunteer ? `/volunteer/signup/${volunteer.id}` : undefined;
  } finally {
    client.release();
  }
}

async function respondWithAdminAccessPage(ctx: Context, email?: string | null) {
  const volunteerHref = await getVolunteerSignupHref(email);
  ctx.response.status = 403;
  ctx.response.type = "text/html";
  ctx.response.body = renderErrorPage({
    status: 403,
    title: "Admin access required",
    message:
      "This page is only available to administrators. Sign in with an admin account, or return to your volunteer shifts.",
    actions: [
      { href: "/admin/login", label: "Admin Login" },
      {
        href: volunteerHref ?? "/",
        label: volunteerHref ? "My Volunteer Shifts" : "Volunteer Login",
        variant: "secondary",
      },
    ],
  });
}

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

export async function requireAdminAuth(
  ctx: Context,
  next: () => Promise<unknown>,
) {
  const request = new Request(ctx.request.url, {
    method: ctx.request.method,
    headers: ctx.request.headers,
  });

  let session;
  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    if (wantsHtmlPage(ctx)) {
      await respondWithAdminAccessPage(ctx);
      return;
    }
    ctx.response.status = 403;
    ctx.response.body = { error: "Admin access required" };
    return;
  }

  if (!session || !session.user) {
    if (wantsHtmlPage(ctx)) {
      await respondWithAdminAccessPage(ctx);
      return;
    }
    ctx.response.status = 403;
    ctx.response.body = { error: "Admin access required" };
    return;
  }

  let adminAccess;
  try {
    adminAccess = await getMicrosoftAdminAccessForUser(session.user.id);
  } catch (error) {
    console.error("Admin access lookup error:", error);
    if (wantsHtmlPage(ctx)) {
      await respondWithAdminAccessPage(ctx);
      return;
    }
    ctx.response.status = 403;
    ctx.response.body = { error: "Admin access required" };
    return;
  }

  const isAdmin = adminAccess.isAdmin;
  if (!isAdmin) {
    console.log(
      "User is not admin:",
      session.user.email,
      "microsoftAccount:",
      adminAccess.hasMicrosoftAccount,
    );
    if (wantsHtmlPage(ctx)) {
      await respondWithAdminAccessPage(ctx, session.user.email);
      return;
    }
    ctx.response.status = 403;
    ctx.response.body = { error: "Admin access required" };
    return;
  }

  // Add user to context with isAdmin field
  const user = { ...session.user, isAdmin } as User;
  ctx.state.user = user;
  ctx.state.session = session;

  // Controller errors must propagate to the application's error handler rather
  // than being reported as authentication failures.
  await next();
}

export async function requireVolunteerAccessOrAdmin(
  ctx: RouterContext<string>,
  next: () => Promise<unknown>,
) {
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

    // Check if user is a Microsoft admin
    const adminAccess = await getMicrosoftAdminAccessForUser(session.user.id);
    const isAdmin = adminAccess.isAdmin;

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
    const pool = getAuthPool();
    const volunteerCheckResult = await pool.query(
      'SELECT id FROM "user" WHERE id = $1 AND email IN (SELECT email FROM participants WHERE id = $2)',
      [session.user.id, volunteerId],
    );

    if (volunteerCheckResult.rows.length === 0) {
      ctx.response.status = 403;
      ctx.response.body = {
        error: "Access denied - you can only access your own data",
      };
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
