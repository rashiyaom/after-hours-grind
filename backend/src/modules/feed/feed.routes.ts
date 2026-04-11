import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { createRateLimit } from "../../middleware/rateLimit.js";
import * as ctrl from "./feed.controller.js";

const router = Router();

const feedWriteLimiter = createRateLimit({
	key: "feed-write",
	windowMs: 60 * 1000,
	maxRequests: 120,
});

router.get("/feed", requireAuth, asyncHandler(ctrl.getFeedHandler));
router.post("/posts", requireAuth, feedWriteLimiter, asyncHandler(ctrl.createPostHandler));
router.post("/posts/:id/comments", requireAuth, feedWriteLimiter, asyncHandler(ctrl.addCommentHandler));
router.post("/posts/:id/likes", requireAuth, feedWriteLimiter, asyncHandler(ctrl.likeHandler));
router.delete("/posts/:id/likes", requireAuth, feedWriteLimiter, asyncHandler(ctrl.unlikeHandler));
router.get("/posts/:id/comments", requireAuth, asyncHandler(ctrl.getCommentsHandler));

export default router;
