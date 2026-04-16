import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { createRateLimit } from "../../middleware/rateLimit.js";
import { env } from "../../config/env.js";
import * as ctrl from "./progress.controller.js";

const router = Router();

const authReadLimiter = createRateLimit({
	key: "api-auth-read",
	windowMs: env.API_AUTH_READ_RATE_LIMIT_WINDOW_MS,
	maxRequests: env.API_AUTH_READ_RATE_LIMIT_MAX_REQUESTS,
	keyResolver: (req) => req.user?.userId ?? req.ip ?? "unknown",
});

router.get("/progress", requireAuth, authReadLimiter, asyncHandler(ctrl.getOverallHandler));
router.get("/progress/weekly", requireAuth, authReadLimiter, asyncHandler(ctrl.getWeeklyHandler));
router.get("/progress/monthly/:planId", requireAuth, authReadLimiter, asyncHandler(ctrl.getMonthlyHandler));
router.get("/progress/heatmap", requireAuth, authReadLimiter, asyncHandler(ctrl.getHeatmapHandler));

// Compatibility routes
router.post("/progress", requireAuth, asyncHandler(ctrl.logProgressHandler));
router.post("/progress/log", requireAuth, asyncHandler(ctrl.logProgressHandler));
router.get("/progress/history", requireAuth, authReadLimiter, asyncHandler(ctrl.getHistoryHandler));
router.get("/progress/summary", requireAuth, authReadLimiter, asyncHandler(ctrl.getSummaryHandler));

export default router;
