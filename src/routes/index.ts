import { Router } from "https://deno.land/x/oak@12.6.1/mod.ts";
import adminRouter from "./admin.ts";
import volunteerRouter from "./volunteer.ts";

const router = new Router();
router.use("/admin", adminRouter.routes(), adminRouter.allowedMethods());
router.use("/volunteer", volunteerRouter.routes(), volunteerRouter.allowedMethods());

export default router;
