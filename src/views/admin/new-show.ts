import type { RouterContext } from "oak";
import { getPool } from "../../models/db.ts";
import { renderNewShowTemplate } from "./templates/new-show-template.ts";

export async function showNewShowForm(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  
  let existingShows: { id: number; name: string }[] = [];
  try {
    const result = await client.queryObject<{ id: number; name: string }>(
      "SELECT id, name FROM shows ORDER BY name"
    );
    existingShows = result.rows;
  } finally {
    client.release();
  }

  ctx.response.type = "text/html";
  ctx.response.body = renderNewShowTemplate({
    existingShows
  });
}
