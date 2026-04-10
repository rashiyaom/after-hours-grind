import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireRole } from "../../middleware/requireRole.js";
import * as ctrl from "./plans.controller.js";

const router = Router();

router.get("/student/plan/today", requireAuth, requireRole("STUDENT"), asyncHandler(ctrl.getTodayPlanHandler));
router.post("/submissions", requireAuth, requireRole("STUDENT"), asyncHandler(ctrl.createSubmissionHandler));
router.get("/submissions", requireAuth, requireRole("TRAINER", "ADMIN"), asyncHandler(ctrl.getSubmissionsHandler));
router.post("/submissions/:id/approve", requireAuth, requireRole("TRAINER", "ADMIN"), asyncHandler(ctrl.approveHandler));
router.post("/submissions/:id/reject", requireAuth, requireRole("TRAINER", "ADMIN"), asyncHandler(ctrl.rejectHandler));

// Trainer plan management
router.get("/trainer/students", requireAuth, requireRole("TRAINER"), asyncHandler(ctrl.getTrainerStudentsHandler));
router.post("/plans", requireAuth, requireRole("TRAINER"), asyncHandler(ctrl.createPlanHandler));

export default router;
