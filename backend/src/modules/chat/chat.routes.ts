import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as ctrl from "./chat.controller.js";

const router = Router();

router.get("/threads", requireAuth, asyncHandler(ctrl.getThreadsHandler));
router.get("/threads/:id/messages", requireAuth, asyncHandler(ctrl.getMessagesHandler));
router.post("/threads/:id/messages", requireAuth, asyncHandler(ctrl.sendMessageHandler));

export default router;
