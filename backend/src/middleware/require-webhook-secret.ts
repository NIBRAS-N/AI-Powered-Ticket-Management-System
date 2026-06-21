import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export function requireWebhookSecret(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers["x-webhook-secret"];

  if (!env.WEBHOOK_AUTH_TOKEN) {
    res.status(500).json({ error: "Webhook secret is not configured" });
    return;
  }

  if (!secret) {
    res.status(401).json({ error: "Missing x-webhook-secret header" });
    return;
  }

  if (secret !== env.WEBHOOK_AUTH_TOKEN) {
    res.status(403).json({ error: "Invalid webhook secret" });
    return;
  }

  next();
}
