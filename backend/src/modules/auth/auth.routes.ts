import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as ctrl from "./auth.controller.js";
import { createRateLimit } from "../../middleware/rateLimit.js";
import { env } from "../../config/env.js";

const router = Router();

const authLimiter = createRateLimit({
	key: "auth",
	windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
	maxRequests: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
});

const refreshLimiter = createRateLimit({
	key: "auth-refresh",
	windowMs: env.AUTH_REFRESH_RATE_LIMIT_WINDOW_MS,
	maxRequests: env.AUTH_REFRESH_RATE_LIMIT_MAX_REQUESTS,
});

router.post("/signup", authLimiter, asyncHandler(ctrl.signupHandler));
router.post("/login", authLimiter, asyncHandler(ctrl.loginHandler));
router.post("/forgot-password", authLimiter, asyncHandler(ctrl.forgotPasswordHandler));
router.post("/forgot-password/verify-code", authLimiter, asyncHandler(ctrl.verifyForgotPasswordCodeHandler));
router.post("/reset-password", authLimiter, asyncHandler(ctrl.resetPasswordHandler));
router.post("/refresh", refreshLimiter, asyncHandler(ctrl.refreshHandler));
router.post("/logout", asyncHandler(ctrl.logoutHandler));

export default router;
