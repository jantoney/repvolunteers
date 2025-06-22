import type { RouterContext } from "oak";
import { getPool } from "../../models/db.ts";
import { renderNewShiftTemplate, type NewShiftPageData, type Show } from "./templates/new-shift-template.ts";

export async function showNewShiftForm(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const showsResult = await client.queryObject<Show>("SELECT id, name FROM shows ORDER BY name");
    
    const data: NewShiftPageData = {
      shows: showsResult.rows
    };
    
    ctx.response.type = "text/html";
    ctx.response.body = renderNewShiftTemplate(data);
  } finally {
    client.release();
  }
}
