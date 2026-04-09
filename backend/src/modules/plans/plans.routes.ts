import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireRole } from "../../middleware/requireRole.js";
import * as ctrl from "./plans.controller.js";

const router = Router();

router.get("/student/plan/today", requireAuth, requireRole("STUDENT"), asyncHandler(ctrl.getTodayPlanHandler));
router.post("/submissions", requireAuth, requireRole("STUDENT"), asyncHandler(ctrl.createSubmissionHandler));
router.post("/submissions/:id/approve", requireAuth, requireRole("TRAINER", "ADMIN"), asyncHandler(ctrl.approveHandler));
router.post("/submissions/:id/reject", requireAuth, requireRole("TRAINER", "ADMIN"), asyncHandler(ctrl.rejectHandler));

export default router;
