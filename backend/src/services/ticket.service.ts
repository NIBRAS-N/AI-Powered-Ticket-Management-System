import prisma from "../utils/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import type { SenderType } from "../generated/prisma-client/index.js";

export async function createTicketFromEmail(data: {
  subject: string;
  description: string;
  senderEmail: string;
  senderName: string;
}) {
  return prisma.ticket.create({
    data: {
      subject: data.subject,
      description: data.description,
      senderEmail: data.senderEmail,
      senderName: data.senderName,
      messages: {
        create: {
          senderType: "STUDENT" as SenderType,
          senderName: data.senderName,
          content: data.description,
        },
      },
    },
    include: { messages: true },
  });
}

export async function addMessageToTicket(data: {
  ticketId: number;
  senderType: SenderType;
  senderName: string;
  content: string;
}) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: data.ticketId },
  });

  if (!ticket) {
    throw new AppError(404, "Ticket not found");
  }

  if (ticket.status === "CLOSED") {
    throw new AppError(400, "Cannot add messages to a closed ticket");
  }

  return prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        ticketId: data.ticketId,
        senderType: data.senderType,
        senderName: data.senderName,
        content: data.content,
      },
    });

    if (ticket.status === "RESOLVED" && data.senderType === "STUDENT") {
      await tx.ticket.update({
        where: { id: data.ticketId },
        data: { status: "OPEN" },
      });
    } else {
      await tx.ticket.update({
        where: { id: data.ticketId },
        data: { updatedAt: new Date() },
      });
    }

    return message;
  });
}

export async function findTicketById(id: number) {
  return prisma.ticket.findUnique({ where: { id } });
}

export async function isDuplicate(data: {
  senderEmail: string;
  subject: string;
  body: string;
  windowMinutes?: number;
}): Promise<boolean> {
  const windowMs = (data.windowMinutes ?? 5) * 60 * 1000;
  const cutoff = new Date(Date.now() - windowMs);

  const existing = await prisma.ticket.findFirst({
    where: {
      senderEmail: data.senderEmail,
      subject: data.subject,
      description: data.body,
      createdAt: { gte: cutoff },
    },
  });

  if (existing) return true;

  const existingMessage = await prisma.message.findFirst({
    where: {
      content: data.body,
      senderType: "STUDENT",
      createdAt: { gte: cutoff },
      ticket: { senderEmail: data.senderEmail },
    },
  });

  return !!existingMessage;
}
