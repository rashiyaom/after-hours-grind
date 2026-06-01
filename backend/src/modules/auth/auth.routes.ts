import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as ctrl from "./auth.controller.js";
import { createRateLimit } from "../../middleware/rateLimit.js";
import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/requireAuth.js";

const router = Router();

const effectiveAuthMax = env.NODE_ENV === "development" ? Math.max(env.AUTH_RATE_LIMIT_MAX_REQUESTS, 200) : env.AUTH_RATE_LIMIT_MAX_REQUESTS;

const authLimiter = createRateLimit({
	key: "auth",
	windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
	maxRequests: effectiveAuthMax,
	keyResolver: (req) => {
		const ip = req.ip || "unknown";
		const path = req.path || "unknown";
		const email =
			typeof req.body?.email === "string"
				? req.body.email.trim().toLowerCase()
				: "no-email";
		// Route-aware key avoids one noisy auth path starving others on the same IP.
		return `${ip}:${path}:${email}`;
	},
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
router.post("/change-password", requireAuth, authLimiter, asyncHandler(ctrl.changePasswordHandler));
router.post("/refresh", refreshLimiter, asyncHandler(ctrl.refreshHandler));
router.post("/logout", asyncHandler(ctrl.logoutHandler));

export default router;
