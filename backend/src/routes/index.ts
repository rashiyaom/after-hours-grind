import { Router } from "express";
import healthRoutes from "./health.js";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/users.routes.js";
import feedRoutes from "../modules/feed/feed.routes.js";
import planRoutes from "../modules/plans/plans.routes.js";
import notificationRoutes from "../modules/notifications/notifications.routes.js";
import chatRoutes from "../modules/chat/chat.routes.js";
import eventRoutes from "../modules/events/events.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import achievementRoutes from "../modules/achievements/achievements.routes.js";
import leaderboardRoutes from "../modules/leaderboard/leaderboard.routes.js";
import progressRoutes from "../modules/progress/progress.routes.js";
import settingsRoutes from "../modules/settings/settings.routes.js";
import realtimeRoutes from "../modules/realtime/realtime.routes.js";
import uploadsRoutes from "../modules/uploads/uploads.routes.js";

const router = Router();

router.use(healthRoutes);
router.use("/auth", authRoutes);
router.use(userRoutes);
router.use(feedRoutes);
router.use(planRoutes);
router.use(notificationRoutes);
router.use(chatRoutes);
router.use("/events", eventRoutes);
router.use("/admin", adminRoutes);
router.use(achievementRoutes);
router.use(leaderboardRoutes);
router.use(progressRoutes);
router.use(settingsRoutes);
router.use(realtimeRoutes);
router.use(uploadsRoutes);

export default router;
