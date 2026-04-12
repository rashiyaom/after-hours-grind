import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as ctrl from "./uploads.controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
    cb(null, allowed);
  },
});

router.post(
  "/uploads/media",
  requireAuth,
  upload.single("file"),
  asyncHandler(ctrl.uploadMediaHandler)
);

export default router;
