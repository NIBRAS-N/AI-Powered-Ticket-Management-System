import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export function verifyWebhook(req: Request, res: Response, next: NextFunction) {
  if (!env.WEBHOOK_AUTH_TOKEN) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const [, token] = credentials.split(":");

  if (token !== env.WEBHOOK_AUTH_TOKEN) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
}
