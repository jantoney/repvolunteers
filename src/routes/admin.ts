import { Router } from "https://deno.land/x/oak@12.6.1/mod.ts";
import * as adminController from "../controllers/admin.ts";
import { requireAuth } from "../middlewares/auth.ts";

const router = new Router();

router.post("/login", adminController.login);
router.use(requireAuth);
router.get("/shows", adminController.listShows);
router.post("/shows", adminController.createShow);
router.put("/shows/:id", adminController.updateShow);
router.delete("/shows/:id", adminController.deleteShow);

router.get("/volunteers", adminController.listVolunteers);
router.post("/volunteers", adminController.createVolunteer);
router.get("/volunteers/:id", adminController.getVolunteer);
router.put("/volunteers/:id", adminController.updateVolunteer);
router.delete("/volunteers/:id", adminController.deleteVolunteer);

router.get("/shifts", adminController.listShifts);
router.post("/shifts", adminController.createShift);
router.put("/shifts/:id", adminController.updateShift);
router.delete("/shifts/:id", adminController.deleteShift);

router.get("/analytics/unfilled", adminController.unfilledShifts);

export default router;
