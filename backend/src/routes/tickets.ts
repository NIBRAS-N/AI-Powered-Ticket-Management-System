import { Router } from "express";
import { z } from "zod";
import prisma from "../utils/prisma.js";
import { validate } from "../middleware/validate.js";

const ticketQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(["OPEN", "RESOLVED", "CLOSED"]).optional(),
  category: z.enum(["GENERAL", "TECHNICAL", "REFUND"]).optional(),
});

const router = Router();

router.get("/", validate(ticketQuerySchema, { source: "query" }), async (req, res) => {
  const { page, limit, status, category } = req.body;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (category) where.category = category;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({
    data: tickets,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export default router;
