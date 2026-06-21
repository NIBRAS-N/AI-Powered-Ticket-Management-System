import { Router } from "express";
import { z } from "zod";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { hashPassword } from "better-auth/crypto";
import prisma from "../utils/prisma.js";
import { env } from "../config/env.js";
import { Role } from "../constants/role.js";
import { validate } from "../middleware/validate.js";

const adminAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },
});

const updateUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
});

const createUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().trim().min(8, "Password must be at least 8 characters"),
});

const router = Router();

router.post("/", validate(createUserSchema), async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "A user with this email already exists" });
    return;
  }

  const result = await adminAuth.api.signUpEmail({
    body: { name: name.trim(), email, password },
  });

  res.status(201).json({
    id: result.user.id,
    name: result.user.name,
    email: result.user.email,
    role: "AGENT",
    isActive: true,
    createdAt: result.user.createdAt,
  });
});

router.patch("/:id", validate(updateUserSchema), async (req, res) => {
  const { name, email, password } = req.body;
  const id = req.params.id as string;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "A user with this email already exists" });
      return;
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { name: name.trim(), email },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  if (password) {
    const hashedPassword = await hashPassword(password);
    await prisma.account.updateMany({
      where: { userId: id, providerId: "credential" },
      data: { password: hashedPassword },
    });
  }

  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id as string;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.role === Role.ADMIN) {
    res.status(403).json({ error: "Admin users cannot be deleted" });
    return;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  await prisma.session.deleteMany({ where: { userId: id } });

  res.json(updated);
});

router.get("/", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;

  const where = { isActive: true };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    data: users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export default router;
