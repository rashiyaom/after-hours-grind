import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireRole } from "../../middleware/requireRole.js";
import * as ctrl from "./admin.controller.js";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/users", asyncHandler(ctrl.getAllUsersHandler));
router.patch("/users/:userId/ban", asyncHandler(ctrl.toggleUserBanHandler));
router.patch("/users/:userId/role", asyncHandler(ctrl.changeUserRoleHandler));
router.get("/stats", asyncHandler(ctrl.getAdminStatsHandler));
router.get("/moderation", asyncHandler(ctrl.getFlaggedContentHandler));
router.patch("/posts/:postId/moderation", asyncHandler(ctrl.updatePostModerationHandler));
router.delete("/posts/:postId", asyncHandler(ctrl.deletePostHandler));
router.get("/activity-logs", asyncHandler(ctrl.getActivityLogsHandler));

export default router;
