import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import healthRouter from "./routes/health.js";
import { requireAuth } from "./middleware/require-auth.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.use("/api/health", healthRouter);

app.get("/api/me", requireAuth, (req, res) => {
  res.json(req.user);
});

app.use(errorHandler);

export default app;
