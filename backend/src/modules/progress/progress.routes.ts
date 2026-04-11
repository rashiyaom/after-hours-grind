import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as ctrl from "./progress.controller.js";

const router = Router();

router.get("/progress", requireAuth, asyncHandler(ctrl.getOverallHandler));
router.get("/progress/weekly", requireAuth, asyncHandler(ctrl.getWeeklyHandler));
router.get("/progress/monthly/:planId", requireAuth, asyncHandler(ctrl.getMonthlyHandler));
router.get("/progress/heatmap", requireAuth, asyncHandler(ctrl.getHeatmapHandler));

// Compatibility routes
router.post("/progress", requireAuth, asyncHandler(ctrl.logProgressHandler));
router.post("/progress/log", requireAuth, asyncHandler(ctrl.logProgressHandler));
router.get("/progress/history", requireAuth, asyncHandler(ctrl.getHistoryHandler));
router.get("/progress/summary", requireAuth, asyncHandler(ctrl.getSummaryHandler));

export default router;
