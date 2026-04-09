import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as ctrl from "./auth.controller.js";

const router = Router();

router.post("/signup", asyncHandler(ctrl.signupHandler));
router.post("/login", asyncHandler(ctrl.loginHandler));
router.post("/refresh", asyncHandler(ctrl.refreshHandler));
router.post("/logout", asyncHandler(ctrl.logoutHandler));

export default router;
