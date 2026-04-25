import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireRole } from "../../middleware/requireRole.js";
import * as ctrl from "./strava.controller.js";

const router = Router();

router.get("/strava/status", requireAuth, requireRole("STUDENT"), asyncHandler(ctrl.getStatusHandler));
router.get("/strava/connect-url", requireAuth, requireRole("STUDENT"), asyncHandler(ctrl.getConnectUrlHandler));
router.post("/strava/exchange", requireAuth, requireRole("STUDENT"), asyncHandler(ctrl.exchangeCodeHandler));
router.post("/strava/sync", requireAuth, requireRole("STUDENT"), asyncHandler(ctrl.syncHandler));
router.delete("/strava/connection", requireAuth, requireRole("STUDENT"), asyncHandler(ctrl.disconnectHandler));

export default router;
