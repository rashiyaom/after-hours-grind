import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { createRateLimit } from "../../middleware/rateLimit.js";
import * as ctrl from "./chat.controller.js";

const router = Router();

const chatWriteLimiter = createRateLimit({
	key: "chat-write",
	windowMs: 60 * 1000,
	maxRequests: 90,
});

router.get("/threads", requireAuth, asyncHandler(ctrl.getThreadsHandler));
router.post("/threads", requireAuth, chatWriteLimiter, asyncHandler(ctrl.createThreadHandler));
router.get("/threads/:id/messages", requireAuth, asyncHandler(ctrl.getMessagesHandler));
router.post("/threads/:id/messages", requireAuth, chatWriteLimiter, asyncHandler(ctrl.sendMessageHandler));

export default router;
