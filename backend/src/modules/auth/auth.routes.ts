import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as ctrl from "./auth.controller.js";
import { createRateLimit } from "../../middleware/rateLimit.js";

const router = Router();

const authLimiter = createRateLimit({
	key: "auth",
	windowMs: 15 * 60 * 1000,
	maxRequests: 30,
});

const refreshLimiter = createRateLimit({
	key: "auth-refresh",
	windowMs: 15 * 60 * 1000,
	maxRequests: 60,
});

router.post("/signup", authLimiter, asyncHandler(ctrl.signupHandler));
router.post("/login", authLimiter, asyncHandler(ctrl.loginHandler));
router.post("/refresh", refreshLimiter, asyncHandler(ctrl.refreshHandler));
router.post("/logout", asyncHandler(ctrl.logoutHandler));

export default router;
