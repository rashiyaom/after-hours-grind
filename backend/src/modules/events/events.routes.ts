import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { optionalAuth } from "../../middleware/optionalAuth.js";
import * as ctrl from "./events.controller.js";

const router = Router();

router.get("/", optionalAuth, asyncHandler(ctrl.getAllEventsHandler));
router.post("/:id/register", optionalAuth, asyncHandler(ctrl.registerForEventHandler));

// Admin only routes
router.post("/", requireAuth, requireRole("ADMIN"), asyncHandler(ctrl.createEventHandler));
router.patch("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(ctrl.updateEventHandler));
router.delete("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(ctrl.deleteEventHandler));

export default router;
