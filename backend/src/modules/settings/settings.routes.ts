import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as ctrl from "./settings.controller.js";

const router = Router();

router.get("/settings", requireAuth, asyncHandler(ctrl.getSettingsHandler));
router.patch("/settings", requireAuth, asyncHandler(ctrl.updateSettingsHandler));

export default router;
