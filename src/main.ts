import { Application } from "https://deno.land/x/oak@12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { load } from "https://deno.land/std@0.203.0/dotenv/mod.ts";

import router from "./routes/index.ts";
import { initDb } from "./models/db.ts";

const env = await load({ export: true });
const port = parseInt(Deno.env.get("PORT") ?? "8000");

await initDb();

const app = new Application();
app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

console.log(`Server running on http://localhost:${port}`);
await app.listen({ port });
