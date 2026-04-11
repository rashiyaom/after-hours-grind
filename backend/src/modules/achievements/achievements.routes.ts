import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as ctrl from "./achievements.controller.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(ctrl.getAchievementsHandler));
router.get("/progress", requireAuth, asyncHandler(ctrl.getAchievementProgressHandler));
router.post("/:badgeId/earn", requireAuth, asyncHandler(ctrl.earnBadgeHandler));

export default router;
