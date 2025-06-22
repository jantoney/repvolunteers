
import type { RouterContext } from "oak";
import { renderDashboardTemplate } from "./templates/dashboard-template.ts";

export function showDashboard(ctx: RouterContext<string>) {
  ctx.response.type = "text/html";
  ctx.response.body = renderDashboardTemplate();
}
