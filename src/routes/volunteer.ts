import { Router } from "oak";
import * as volunteerController from "../controllers/volunteer.ts";

const router = new Router();

router.get("/signup/:id", volunteerController.viewSignup);
router.get("/signup/:id/pdf", volunteerController.downloadPDF);
router.get("/signup/:id/schedule-pdf", volunteerController.downloadSchedulePDF);
router.post("/signup/:id", volunteerController.submitSignup);
router.post("/signup/:id/swap", volunteerController.swapShift);
router.delete("/signup/:id/shift", volunteerController.removeFromShift);

export default router;
