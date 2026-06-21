export type Role = "ADMIN" | "AGENT";

export type TicketStatus = "OPEN" | "RESOLVED" | "CLOSED";

export type TicketCategory = "GENERAL" | "TECHNICAL" | "REFUND";

export type SenderType = "STUDENT" | "AGENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  expiresAt: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface AuthSession {
  user: User;
  session: Session;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Ticket {
  id: number;
  subject: string;
  description: string;
  senderEmail: string;
  senderName: string;
  status: TicketStatus;
  category: TicketCategory | null;
  assigneeId: string | null;
  assignee?: User;
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  ticketId: number;
  senderType: SenderType;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalTickets: number;
  byStatus: Record<TicketStatus, number>;
  byCategory: Record<TicketCategory, number>;
  recentTickets: Ticket[];
  unassignedCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
