import { Application, type Context } from "oak";
import { oakCors } from "cors";
import { load } from "dotenv";

import { auth } from "./auth.ts";
import { getPool, initDb } from "./models/db.ts";
import { renderErrorPage } from "./views/error-page.ts";

const _env = await load({ export: true });
const port = parseInt(Deno.env.get("PORT") ?? "8000");

// Initialize database first
await initDb();

// Import routes after database is initialized
const { default: router } = await import("./routes/index.ts");

const app = new Application();

function wantsHtmlPage(ctx: Context): boolean {
  const pathname = new URL(ctx.request.url).pathname;

  return ctx.request.method === "GET" &&
    !pathname.startsWith("/api/") &&
    !pathname.includes("/api/");
}

async function getVolunteerSignupHref(
  ctx: Context,
): Promise<string | undefined> {
  try {
    const request = new Request(ctx.request.url, {
      method: ctx.request.method,
      headers: ctx.request.headers,
    });
    const session = await auth.api.getSession({ headers: request.headers });
    const email = session?.user?.email;
    if (!email) return undefined;

    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.queryObject<{ id: string }>(
        "SELECT id FROM participants WHERE lower(email) = lower($1) AND approved = true ORDER BY name LIMIT 1",
        [email],
      );

      return result.rows[0]
        ? `/volunteer/signup/${result.rows[0].id}`
        : undefined;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Failed to resolve volunteer fallback link:", error);
    return undefined;
  }
}

async function renderNotFound(ctx: Context) {
  const volunteerHref = await getVolunteerSignupHref(ctx);
  ctx.response.status = 404;
  ctx.response.type = "text/html";
  ctx.response.body = renderErrorPage({
    status: 404,
    title: "Page not found",
    message: "The page you opened does not exist, or the link is out of date.",
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

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    if (
      error instanceof Error && "status" in error && error.status === 404 &&
      wantsHtmlPage(ctx)
    ) {
      await renderNotFound(ctx);
      return;
    }

    throw error;
  }

  if (
    ctx.response.status === 404 && ctx.response.body == null &&
    wantsHtmlPage(ctx)
  ) {
    await renderNotFound(ctx);
  }
});

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

console.log(`Server running on http://localhost:${port}`);
await app.listen({ port });
