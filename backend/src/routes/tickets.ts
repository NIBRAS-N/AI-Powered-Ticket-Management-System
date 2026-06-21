import { Router } from "express";
import { z } from "zod";
import prisma from "../utils/prisma.js";
import { validate } from "../middleware/validate.js";

const sortableFields = ["id", "subject", "senderName", "status", "category", "createdAt"] as const;

const ticketQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(["OPEN", "RESOLVED", "CLOSED"]).optional(),
  category: z.enum(["GENERAL", "TECHNICAL", "REFUND"]).optional(),
  sortBy: z.enum(sortableFields).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().trim().optional(),
});

const router = Router();

router.get("/", validate(ticketQuerySchema, { source: "query" }), async (req, res) => {
  const { page, limit, status, category, sortBy, sortOrder, search } = req.body;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { senderName: { contains: search, mode: "insensitive" } },
      { senderEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
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
