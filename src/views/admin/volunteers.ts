import type { RouterContext } from "oak";
import { getPool } from "../../models/db.ts";
import { renderVolunteersTemplate, type VolunteersPageData } from "./templates/volunteers-template.ts";

export async function showVolunteersPage(ctx: RouterContext<string>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.queryObject<{ id: number; name: string; email: string; phone: string }>(
      "SELECT id, name, email, phone FROM participants ORDER BY name"
    );
    
    const data: VolunteersPageData = {
      volunteers: result.rows
    };
    
    ctx.response.type = "text/html";
    ctx.response.body = renderVolunteersTemplate(data);
  } finally {
    client.release();
  }
}
