import type { Request, Response, NextFunction } from "express";
import { Role } from "../constants/role.js";

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.user?.role !== Role.ADMIN) {
    res.status(403).json({ error: "Forbidden: admin access required" });
    return;
  }
  next();
}
