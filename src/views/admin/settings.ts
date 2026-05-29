import type { RouterContext } from "oak";
import { renderSettingsTemplate } from "./templates/settings-template.ts";
import { getEmailDefaults } from "../../utils/email-settings.ts";

export async function showSettingsPage(ctx: RouterContext<string>) {
  const hostname = ctx.request.url.hostname;
  const isLocalHost = hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1";
  const isLocalDev = isLocalHost && Deno.env.get("DENO_ENV") !== "production";
  const emailDefaults = await getEmailDefaults();

  ctx.response.type = "text/html";
  ctx.response.body = renderSettingsTemplate({ isLocalDev, emailDefaults });
}
