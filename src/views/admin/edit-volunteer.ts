import type { RouterContext } from "oak";
import { getPool } from "../../models/db.ts";
import { renderEditVolunteerTemplate, type EditVolunteerPageData, type Volunteer } from "./templates/edit-volunteer-template.ts";

export async function showEditVolunteerForm(ctx: RouterContext<string>) {
  const id = ctx.params.id;
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const result = await client.queryObject<Volunteer>(
      "SELECT id, name, email, phone FROM participants WHERE id=$1", [id]
    );
    
    if (result.rows.length === 0) {
      ctx.throw(404, "Volunteer not found");
    }
    
    const data: EditVolunteerPageData = {
      volunteer: result.rows[0]
    };
    
    ctx.response.type = "text/html";
    ctx.response.body = renderEditVolunteerTemplate(data);
  } finally {
    client.release();
  }
}
