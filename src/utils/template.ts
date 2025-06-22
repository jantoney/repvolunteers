import { render as mustacheRender } from "mustache";

export async function render(templatePath: string, data: Record<string, unknown>) {
  const template = await Deno.readTextFile(templatePath);
  return mustacheRender(template, data);
}
