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

router.get("/agents", async (_req, res) => {
  const agents = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  res.json(agents);
});

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

const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "RESOLVED", "CLOSED"]).optional(),
  category: z.enum(["GENERAL", "TECHNICAL", "REFUND"]).nullable().optional(),
  assigneeId: z.string().nullable().optional(),
});

router.patch("/:id", validate(updateTicketSchema), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const { status, category, assigneeId } = req.body;

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  if (assigneeId !== undefined && assigneeId !== null) {
    const agent = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (!agent || !agent.isActive) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }
  }

  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (category !== undefined) data.category = category;
  if (assigneeId !== undefined) data.assigneeId = assigneeId;

  const updated = await prisma.ticket.update({
    where: { id },
    data,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  res.json(updated);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(ticket);
});

const createReplySchema = z.object({
  body: z.string().min(1).max(5000),
  senderType: z.enum(["STUDENT", "AGENT"]),
});

router.post("/:id/replies", validate(createReplySchema), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  if (ticket.status === "CLOSED") {
    res.status(400).json({ error: "Cannot reply to a closed ticket" });
    return;
  }

  const { body, senderType } = req.body;
  const userId = senderType === "AGENT" ? req.user!.id : null;

  const [reply] = await prisma.$transaction([
    prisma.reply.create({
      data: { body, ticketId: id, userId, senderType },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    ...(ticket.status === "RESOLVED" && senderType === "STUDENT"
      ? [prisma.ticket.update({ where: { id }, data: { status: "OPEN" } })]
      : [prisma.ticket.update({ where: { id }, data: { updatedAt: new Date() } })]),
  ]);

  res.status(201).json(reply);
});

export default router;
