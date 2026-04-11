import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as ctrl from "./progress.controller.js";

const router = Router();

router.post("/progress", requireAuth, asyncHandler(ctrl.logProgressHandler));
router.get("/progress", requireAuth, asyncHandler(ctrl.getHistoryHandler));
router.get("/progress/summary", requireAuth, asyncHandler(ctrl.getSummaryHandler));

export default router;
