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
router.patch("/users/:userId/verify-trainer", asyncHandler(ctrl.verifyTrainerHandler));
router.patch("/users/:userId/trainer", asyncHandler(ctrl.assignStudentTrainerHandler));
router.get("/stats", asyncHandler(ctrl.getAdminStatsHandler));
router.get("/permissions", asyncHandler(ctrl.getPermissionsHandler));
router.patch("/permissions", asyncHandler(ctrl.setPermissionHandler));
router.post("/permissions/reset", asyncHandler(ctrl.resetPermissionsHandler));
router.get("/moderation", asyncHandler(ctrl.getFlaggedContentHandler));
router.patch("/posts/:postId/moderation", asyncHandler(ctrl.updatePostModerationHandler));
router.delete("/posts/:postId", asyncHandler(ctrl.deletePostHandler));
router.get("/activity-logs", asyncHandler(ctrl.getActivityLogsHandler));
router.get("/exercise-templates", asyncHandler(ctrl.getExerciseTemplatesHandler));
router.post("/exercise-templates", asyncHandler(ctrl.createExerciseTemplateHandler));
router.patch("/exercise-templates/:templateId", asyncHandler(ctrl.updateExerciseTemplateHandler));
router.delete("/exercise-templates/:templateId", asyncHandler(ctrl.deleteExerciseTemplateHandler));
router.get("/exercise-templates/assignments", asyncHandler(ctrl.getExerciseTemplateAssignmentsHandler));
router.post("/exercise-templates/assign", asyncHandler(ctrl.assignExerciseTemplateHandler));
router.post("/exercise-templates/assign-bulk", asyncHandler(ctrl.assignExerciseTemplateBulkHandler));

export default router;
