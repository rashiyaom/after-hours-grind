import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { createRateLimit } from "../../middleware/rateLimit.js";
import { env } from "../../config/env.js";
import * as ctrl from "./users.controller.js";

const router = Router();

const authReadLimiter = createRateLimit({
	key: "api-auth-read",
	windowMs: env.API_AUTH_READ_RATE_LIMIT_WINDOW_MS,
	maxRequests: env.API_AUTH_READ_RATE_LIMIT_MAX_REQUESTS,
	keyResolver: (req) => req.user?.userId ?? req.ip ?? "unknown",
});

router.get("/me", requireAuth, authReadLimiter, asyncHandler(ctrl.getMeHandler));
router.get("/athletes", asyncHandler(ctrl.getFeaturedAthletesHandler)); // Public
router.patch("/me", requireAuth, asyncHandler(ctrl.updateMeHandler));
router.get("/users/:id", requireAuth, asyncHandler(ctrl.getUserHandler));
router.get("/users/:id/followers", requireAuth, asyncHandler(ctrl.getFollowersHandler));
router.get("/users/:id/following", requireAuth, asyncHandler(ctrl.getFollowingHandler));
router.post("/users/:id/follow", requireAuth, asyncHandler(ctrl.followHandler));
router.delete("/users/:id/follow", requireAuth, asyncHandler(ctrl.unfollowHandler));

export default router;
