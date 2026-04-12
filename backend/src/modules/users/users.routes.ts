import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as ctrl from "./users.controller.js";

const router = Router();

router.get("/me", requireAuth, asyncHandler(ctrl.getMeHandler));
router.get("/athletes", asyncHandler(ctrl.getFeaturedAthletesHandler)); // Public
router.patch("/me", requireAuth, asyncHandler(ctrl.updateMeHandler));
router.get("/users/:id", requireAuth, asyncHandler(ctrl.getUserHandler));
router.get("/users/:id/followers", requireAuth, asyncHandler(ctrl.getFollowersHandler));
router.get("/users/:id/following", requireAuth, asyncHandler(ctrl.getFollowingHandler));
router.post("/users/:id/follow", requireAuth, asyncHandler(ctrl.followHandler));
router.delete("/users/:id/follow", requireAuth, asyncHandler(ctrl.unfollowHandler));

export default router;
