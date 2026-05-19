import type { RouterContext } from "oak";
import { renderSettingsTemplate } from "./templates/settings-template.ts";

export function showSettingsPage(ctx: RouterContext<string>) {
  ctx.response.type = "text/html";
  ctx.response.body = renderSettingsTemplate();
}
