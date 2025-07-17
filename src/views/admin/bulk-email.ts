import type { RouterContext } from "oak";
import { renderBulkEmailTemplate } from "./templates/bulk-email-template.ts";

export function showBulkEmailPage(ctx: RouterContext<string>) {
  ctx.response.type = "text/html";
  ctx.response.body = renderBulkEmailTemplate();
}
