import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as ctrl from "./feed.controller.js";

const router = Router();

router.get("/feed", requireAuth, asyncHandler(ctrl.getFeedHandler));
router.post("/posts", requireAuth, asyncHandler(ctrl.createPostHandler));
router.post("/posts/:id/comments", requireAuth, asyncHandler(ctrl.addCommentHandler));
router.post("/posts/:id/likes", requireAuth, asyncHandler(ctrl.likeHandler));
router.delete("/posts/:id/likes", requireAuth, asyncHandler(ctrl.unlikeHandler));
router.get("/posts/:id/comments", requireAuth, asyncHandler(ctrl.getCommentsHandler));

export default router;
