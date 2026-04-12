import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { corsOrigins, env } from "./config/env.js";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { requestContext } from "./middleware/requestContext.js";
import { createRateLimit } from "./middleware/rateLimit.js";
import { csrfProtection } from "./middleware/csrfProtection.js";

const apiGlobalLimiter = createRateLimit({
  key: "api-global",
  windowMs: 60 * 1000,
  maxRequests: 300,
});

const app = express();
if (env.TRUST_PROXY) {
  app.set("trust proxy", 1);
}

// Security
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(requestContext);
app.use(csrfProtection);

// Base Route Check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to The After Hours Socials API",
    version: "1.0.0"
  });
});

// Routes
app.use("/api", apiGlobalLimiter, apiRouter);

// 404 + error
app.use(notFound);
app.use(errorHandler);

export default app;
