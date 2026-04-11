import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as ctrl from "./achievements.controller.js";

const router = Router();

router.get("/achievements", requireAuth, asyncHandler(ctrl.getMyAchievementsHandler));
router.post("/achievements/check", requireAuth, asyncHandler(ctrl.checkAchievementsHandler));
router.get("/achievements/definitions", asyncHandler(ctrl.getAllDefsHandler));

export default router;
