import type { RouterContext } from "oak";
import { renderHelpTemplate } from "./templates/help-template.ts";

export function showHelpPage(ctx: RouterContext<string>) {
  ctx.response.type = "text/html";
  ctx.response.body = renderHelpTemplate();
}
