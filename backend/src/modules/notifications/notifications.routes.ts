import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as ctrl from "./notifications.controller.js";

const router = Router();

router.get("/notifications", requireAuth, asyncHandler(ctrl.getNotificationsHandler));
router.post("/notifications/:id/read", requireAuth, asyncHandler(ctrl.markReadHandler));

export default router;
