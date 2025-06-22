import { Router } from "https://deno.land/x/oak@12.6.1/mod.ts";
import * as volunteerController from "../controllers/volunteer.ts";

const router = new Router();

router.get("/signup/:id", volunteerController.viewSignup);
router.post("/signup/:id", volunteerController.submitSignup);

export default router;
