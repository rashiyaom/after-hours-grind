import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as ctrl from "./leaderboard.controller.js";

const router = Router();

router.get("/leaderboard", requireAuth, asyncHandler(ctrl.getLeaderboardHandler));

export default router;
