import { Router } from "express";
import { requireWebhookSecret } from "../middleware/require-webhook-secret.js";
import { validate } from "../middleware/validate.js";
import {
  inboundEmailSchema,
  parseInboundEmail,
} from "../services/email-parser.service.js";
import * as ticketService from "../services/ticket.service.js";

const router = Router();

const validateInboundEmail = validate(inboundEmailSchema, {
  status: 200,
  formatError: (message) => ({ status: "rejected", message }),
});

router.post("/inbound-email", requireWebhookSecret, validateInboundEmail, async (req, res) => {
  const parsed = parseInboundEmail(req.body);

  const duplicate = await ticketService.isDuplicate({
    senderEmail: parsed.senderEmail,
    subject: parsed.subject,
    body: parsed.body,
  });

  if (duplicate) {
    res.status(200).json({ status: "duplicate", message: "Duplicate email ignored" });
    return;
  }

  if (parsed.referencedTicketId) {
    const ticket = await ticketService.findTicketById(parsed.referencedTicketId);

    if (ticket && ticket.senderEmail === parsed.senderEmail) {
      const message = await ticketService.addMessageToTicket({
        ticketId: ticket.id,
        senderType: "STUDENT",
        senderName: parsed.senderName,
        content: parsed.body,
      });
      res.status(200).json({
        status: "threaded",
        ticketId: ticket.id,
        messageId: message.id,
      });
      return;
    }
  }

  const ticket = await ticketService.createTicketFromEmail({
    subject: parsed.subject,
    description: parsed.body,
    senderEmail: parsed.senderEmail,
    senderName: parsed.senderName,
  });

  res.status(201).json({ status: "created", ticketId: ticket.id });
});

export default router;
