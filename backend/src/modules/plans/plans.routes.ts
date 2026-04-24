import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { createRateLimit } from "../../middleware/rateLimit.js";
import { env } from "../../config/env.js";
import * as ctrl from "./plans.controller.js";

const router = Router();

const authReadLimiter = createRateLimit({
	key: "api-auth-read",
	windowMs: env.API_AUTH_READ_RATE_LIMIT_WINDOW_MS,
	maxRequests: env.API_AUTH_READ_RATE_LIMIT_MAX_REQUESTS,
	keyResolver: (req) => req.user?.userId ?? req.ip ?? "unknown",
});

// Student
router.get("/student/plan/today", requireAuth, requireRole("STUDENT"), authReadLimiter, asyncHandler(ctrl.getTodayPlanHandler));
router.get("/student/plan/today-lite", requireAuth, requireRole("STUDENT"), authReadLimiter, asyncHandler(ctrl.getTodayPlanLiteHandler));
router.post("/student/plan/generate", requireAuth, requireRole("STUDENT"), asyncHandler(ctrl.generatePersonalizedPlanHandler));
router.post("/submissions", requireAuth, requireRole("STUDENT"), asyncHandler(ctrl.createSubmissionHandler));
router.post("/submissions/resend", requireAuth, requireRole("STUDENT"), asyncHandler(ctrl.resendSubmissionWhatsAppHandler));
router.post("/plans/:id/submit", requireAuth, requireRole("STUDENT"), asyncHandler(ctrl.submitForApprovalHandler));

// Trainer
router.get("/trainer/students", requireAuth, requireRole("TRAINER"), asyncHandler(ctrl.getTrainerStudentsHandler));
router.get("/trainer/students/:id", requireAuth, requireRole("TRAINER"), asyncHandler(ctrl.getStudentDetailHandler));
router.post("/trainer/students", requireAuth, requireRole("TRAINER"), asyncHandler(ctrl.assignStudentHandler));
router.delete("/trainer/students/:id", requireAuth, requireRole("TRAINER"), asyncHandler(ctrl.unassignStudentHandler));
router.post("/plans", requireAuth, requireRole("TRAINER"), asyncHandler(ctrl.createPlanHandler));
router.get("/plans/pending", requireAuth, requireRole("TRAINER", "ADMIN"), asyncHandler(ctrl.getPendingPlansHandler));
router.post("/plans/:id/review", requireAuth, requireRole("TRAINER", "ADMIN"), asyncHandler(ctrl.reviewPlanHandler));

// Trainer + Admin
router.get("/submissions", requireAuth, requireRole("TRAINER", "ADMIN"), authReadLimiter, asyncHandler(ctrl.getSubmissionsHandler));
router.post("/submissions/:id/approve", requireAuth, requireRole("TRAINER", "ADMIN"), asyncHandler(ctrl.approveHandler));
router.post("/submissions/:id/reject", requireAuth, requireRole("TRAINER", "ADMIN"), asyncHandler(ctrl.rejectHandler));
router.post("/submissions/:id/mark-whatsapp-received", requireAuth, requireRole("TRAINER", "ADMIN"), asyncHandler(ctrl.markSubmissionWhatsAppReceivedHandler));

export default router;
