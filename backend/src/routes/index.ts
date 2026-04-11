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
import achievementsRoutes from "../modules/achievements/achievements.routes.js";

const router = Router();

router.use(healthRoutes);
router.use("/auth", authRoutes);
router.use(userRoutes);
router.use("/achievements", achievementsRoutes);
router.use(feedRoutes);
router.use(planRoutes);
router.use(notificationRoutes);
router.use(chatRoutes);
router.use("/events", eventRoutes);
router.use("/admin", adminRoutes);

export default router;
