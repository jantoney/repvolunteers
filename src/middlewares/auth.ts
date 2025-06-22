import { Context, Status } from "https://deno.land/x/oak@12.6.1/mod.ts";

export async function requireAuth(ctx: Context, next: () => Promise<unknown>) {
  const auth = ctx.request.headers.get("authorization");
  if (!auth || auth !== `Bearer ${Deno.env.get("ADMIN_TOKEN")}`) {
    ctx.response.status = Status.Unauthorized;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }
  await next();
}
