import { Application } from "oak";
import { oakCors } from "cors";
import { load } from "dotenv";

import { initDb } from "./models/db.ts";

const _env = await load({ export: true });
const port = parseInt(Deno.env.get("PORT") ?? "8000");

// Initialize database first
await initDb();

// Import routes after database is initialized
const { default: router } = await import("./routes/index.ts");

const app = new Application();
app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

console.log(`Server running on http://localhost:${port}`);
await app.listen({ port });
