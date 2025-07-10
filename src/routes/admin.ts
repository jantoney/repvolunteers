import { Router } from "oak";
import * as adminController from "../controllers/admin.ts";
import { requireAdminAuth } from "../middlewares/better-auth.ts";

const router = new Router();

// Public routes
router.get("/login", adminController.showLoginForm);
router.get("/logout", adminController.logout);
// Serve the admin password reset page (public)
router.get("/reset-password", async (ctx) => {
  await ctx.send({
    root: `${Deno.cwd()}/src/views/admin`,
    path: "reset-password.html",
  });
});

// Protected admin routes - apply middleware first
router.use(requireAdminAuth);
router.get("/dashboard", adminController.showDashboard);

// Shows management pages
router.get("/shows", adminController.showShowsPage);
router.get("/shows/new", adminController.showNewShowForm);
router.get("/shows/:id/edit", adminController.showEditShowForm);

// Shows API endpoints
router.get("/api/shows", adminController.listShows);
router.post("/api/shows", adminController.createShow);
router.put("/api/shows/:id", adminController.updateShow);
router.delete("/api/shows/:id", adminController.deleteShow);
router.get("/api/shows/:showId/dates", adminController.listShowDates);

// Show dates API endpoints
router.post("/api/show-dates", adminController.createShowDate);
router.put("/api/show-dates/:id", adminController.updateShowDate);
router.delete("/api/show-dates/:id", adminController.deleteShowDate);

// Volunteers management pages
router.get("/volunteers", adminController.showVolunteersPage);
router.get("/volunteers/:id/shifts", adminController.showVolunteerShiftsPage);
router.get("/volunteers/new", adminController.showNewVolunteerForm);
router.get("/volunteers/:id/edit", adminController.showEditVolunteerForm);

// Volunteers API endpoints
router.get("/api/volunteers", adminController.listVolunteers);
router.post("/api/volunteers", adminController.createVolunteer);
router.get("/api/volunteers/:id", adminController.getVolunteer);
router.put("/api/volunteers/:id", adminController.updateVolunteer);
router.put("/api/volunteers/:id/approval", adminController.toggleVolunteerApproval);
router.post("/api/volunteers/:id/shifts/removal-pdf", adminController.generateShiftRemovalPDF);
router.get("/api/volunteers/:id/schedule-pdf", adminController.downloadVolunteerSchedulePDF);
router.post("/api/volunteers/:id/email-schedule-pdf", adminController.emailVolunteerSchedulePDF);
router.delete("/api/volunteers/:id", adminController.deleteVolunteer);

// Shifts management pages
router.get("/shifts", adminController.showShiftsPage);
router.get("/shifts/new", adminController.showNewShiftForm);
router.get("/shifts/:id/edit", adminController.showEditShiftForm);

// Shifts API endpoints
router.get("/api/shifts", adminController.listShifts);
router.get("/api/shifts/calendar-data", adminController.getShiftCalendarData);
router.get("/api/shifts/calendar-shows", adminController.getShowsForCalendar);
router.get("/api/shifts/default-roles", adminController.getDefaultRoles);
router.post("/api/shifts", adminController.createShift);
router.put("/api/shifts/:id", adminController.updateShift);
router.delete("/api/shifts/:id", adminController.deleteShift);

// Analytics pages
router.get("/unfilled-shifts", adminController.showUnfilledShiftsPage);

// Analytics API endpoints
router.get("/api/analytics/unfilled", adminController.unfilledShifts);
router.get("/api/unfilled-shifts/count", adminController.getUnfilledShiftsCount);
router.get("/api/performances-without-shifts/count", adminController.getPerformancesWithoutShiftsCount);

// Server time API endpoint
router.get("/api/server-time", adminController.getServerTime);

// Volunteer-Shift Assignment API endpoints
router.get("/api/shifts/:shiftId/volunteers", adminController.getShiftVolunteers);
router.get("/api/shifts/:shiftId/available-roles", adminController.getAvailableRolesForShift);
router.get("/api/volunteers/:volunteerId/shifts", adminController.getVolunteerShifts);
router.get("/api/volunteers/:volunteerId/shifts/simple", adminController.getVolunteerShiftsSimple);
router.get("/api/shifts/:shiftId/available-volunteers", adminController.getAvailableVolunteersForShift);
router.get("/api/volunteers/:volunteerId/available-shifts", adminController.getAvailableShiftsForVolunteer);
router.post("/api/volunteer-shifts", adminController.assignVolunteerToShift);
router.delete("/api/volunteers/:volunteerId/shifts/:shiftId", adminController.removeVolunteerFromShift);

export default router;
