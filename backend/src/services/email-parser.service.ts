import { z } from "zod";

export const inboundEmailSchema = z.object({
  from: z.string().min(1, "Sender is required"),
  to: z.string().min(1, "Recipient is required"),
  subject: z.string().default("(no subject)"),
  text: z.string().min(1, "Email body is required"),
  envelope: z
    .object({
      from: z.string(),
      to: z.array(z.string()),
    })
    .optional(),
});

export type InboundEmailPayload = z.infer<typeof inboundEmailSchema>;

export interface ParsedEmail {
  senderEmail: string;
  senderName: string;
  subject: string;
  body: string;
  referencedTicketId: number | null;
}

export function parseInboundEmail(payload: InboundEmailPayload): ParsedEmail {
  const { name, email } = parseSender(payload.from);
  const subject = stripSubjectPrefixes(payload.subject);
  const ticketId = extractTicketId(payload.to, payload.envelope?.to, payload.subject);

  return {
    senderEmail: email,
    senderName: name,
    subject,
    body: payload.text.trim(),
    referencedTicketId: ticketId,
  };
}

function parseSender(from: string): { name: string; email: string } {
  const match = from.match(/^"?(.+?)"?\s*<(\S+@\S+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].toLowerCase() };
  }

  const emailOnly = from.trim().toLowerCase();
  const localPart = emailOnly.split("@")[0] || emailOnly;
  return { name: localPart, email: emailOnly };
}

function stripSubjectPrefixes(subject: string): string {
  return subject.replace(/^(Re:\s*|Fwd:\s*|FW:\s*|RE:\s*)+/i, "").trim();
}

function extractTicketId(
  to: string,
  envelopeTo: string[] | undefined,
  subject: string,
): number | null {
  const allAddresses = [to, ...(envelopeTo || [])].join(" ");
  const plusMatch = allAddresses.match(/support\+(\d+)@/i);
  if (plusMatch) {
    return parseInt(plusMatch[1], 10);
  }

  const subjectMatch = subject.match(/\[Ticket\s*#(\d+)\]/i);
  if (subjectMatch) {
    return parseInt(subjectMatch[1], 10);
  }

  return null;
}
