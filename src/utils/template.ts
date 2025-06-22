import Mustache from "https://deno.land/x/mustache@v0.3.0/mod.ts";

export async function render(templatePath: string, data: Record<string, unknown>) {
  const template = await Deno.readTextFile(templatePath);
  return Mustache.render(template, data);
}
