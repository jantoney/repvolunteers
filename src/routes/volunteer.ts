import { Router } from "oak";
import * as volunteerController from "../controllers/volunteer.ts";

import { rejectDeletedVolunteer } from "../middlewares/deleted-volunteer.ts";

const router = new Router();
router.use(async (ctx, next) => {
  const match = ctx.request.url.pathname.match(/\/signup\/([^/]+)/);
  if (match && await rejectDeletedVolunteer(ctx, match[1])) return;
  await next();
});

router.get("/signup/:id", volunteerController.viewSignup);
router.get("/signup/:id/pdf", volunteerController.downloadPDF);
router.get("/signup/:id/schedule-pdf", volunteerController.downloadSchedulePDF);
router.put(
  "/signup/:id/unavailable-performances",
  volunteerController.updateUnavailablePerformances,
);
router.post("/signup/:id", volunteerController.submitSignup);
router.post("/signup/:id/swap", volunteerController.swapShift);
router.post(
  "/signup/:id/opt-out",
  volunteerController.optOutFutureVolunteering,
);
router.post(
  "/signup/:id/opt-in",
  volunteerController.optInFutureVolunteering,
);
router.delete("/signup/:id/shift", volunteerController.removeFromShift);

export default router;
