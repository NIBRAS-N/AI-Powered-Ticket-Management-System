# MVP: AI-Powered Ticket Management System

## Overview

This document defines the Minimum Viable Product for the AI-Powered Ticket Management System. The MVP focuses on the core loop: emails come in, tickets are created and classified by AI, agents view and manage tickets through a dashboard, and AI assists agents with summaries, suggested replies, and auto-generated responses drawn from a knowledge base.

---

## Ticket Model

### Statuses

* **Open** — Ticket has been created and is awaiting resolution.
* **Resolved** — An agent has addressed the ticket.
* **Closed** — The ticket is finalized and no further action is needed.

### Categories

Each ticket belongs to exactly one category:

* **General Question** — Non-technical inquiries about policies, processes, or general information.
* **Technical Question** — Questions related to technical issues, system usage, or troubleshooting.
* **Refund Request** — Requests related to refunds or payment disputes.

### Ticket Fields

| Field         | Description                                              |
| ------------- | -------------------------------------------------------- |
| ID            | Unique ticket identifier                                 |
| Subject       | Email subject line                                       |
| Description   | Full email body content                                  |
| Sender Email  | Email address of the student who submitted the request   |
| Sender Name   | Name of the student (extracted from the email)           |
| Status        | Open, Resolved, or Closed                                |
| Category      | Assigned by AI (General Question, Technical Question, Refund Request) |
| Assignee      | The agent currently responsible for the ticket           |
| Created At    | Timestamp when the ticket was created                    |
| Updated At    | Timestamp of the last status change or reply             |

---

## Roles & Authentication

The system ships with a single pre-configured **Administrator** account. There is no self-registration.

| Role          | Capabilities                                                              |
| ------------- | ------------------------------------------------------------------------- |
| Administrator | Create/update/deactivate agent accounts. Full access to all features.     |
| Agent         | View and manage assigned tickets. Use AI tools. Reply to students.        |

Both roles authenticate via email and password. Sessions are managed via server-side database sessions.

---

## MVP Features

### 1. Email-to-Ticket Creation

The system connects to a configured support mailbox, polls for new emails, and converts each incoming email into a ticket.

**Behavior:**

* The system periodically checks the support mailbox for unread emails.
* For each new email, a ticket is created with:
  * Subject and body extracted from the email.
  * Sender name and email extracted from the `From` header.
  * Status set to **Open**.
  * Category assigned automatically by the AI classification step (see Feature 2).
* If a student replies to an existing ticket thread, the reply is appended to that ticket's conversation history rather than creating a new ticket.
* Duplicate detection: if an identical email (same sender, same subject, same body) arrives within a short window, it is ignored.

---

### 2. AI-Powered Ticket Classification

When a ticket is created, the system uses AI to analyze the content and assign exactly one category.

**Behavior:**

* The AI reads the ticket subject and description.
* It classifies the ticket as one of: **General Question**, **Technical Question**, or **Refund Request**.
* The assigned category is stored on the ticket and displayed in all views.
* Classification happens automatically at ticket creation time — no manual step required.
* Agents can manually override the AI-assigned category if it is incorrect.

---

### 3. AI Response Generation

The system generates a draft response for each new ticket using the knowledge base as context.

**Behavior:**

* When a ticket is created, the system searches the knowledge base for articles relevant to the ticket content.
* The AI generates a human-friendly draft response grounded in the matched knowledge base articles.
* The draft is presented to the agent in the ticket detail view as a suggested starting point.
* The agent can edit the draft before sending, or discard it entirely.
* Responses are never sent automatically — an agent must explicitly approve and send.

---

### 4. AI Ticket Summaries

The system generates a concise summary of each ticket's conversation.

**Behavior:**

* A summary is generated when an agent opens a ticket, covering the full conversation history.
* The summary highlights: what the student is asking for, any key details (order numbers, account info, error messages), and the current state of the conversation.
* Summaries are displayed in the ticket detail view.
* As the conversation grows (new replies are added), the summary is regenerated to reflect the latest state.

---

### 5. AI Suggested Replies

The system provides agents with multiple reply options they can use or adapt.

**Behavior:**

* When an agent views a ticket, the system generates 2-3 suggested replies based on the conversation context and knowledge base.
* Suggestions range in tone and approach (e.g., a direct answer, a request for more information, an escalation message).
* The agent can select a suggestion to load it into the reply editor, then modify it before sending.
* Suggestions are regenerated when new messages are added to the conversation.

---

### 6. Ticket Dashboard

A centralized view for agents and admins to monitor all tickets at a glance.

**Behavior:**

* Displays summary counts: total tickets, tickets by status (Open, Resolved, Closed), and tickets by category.
* Shows recent tickets and any unassigned open tickets.
* Admins see all tickets across all agents. Agents see tickets assigned to them plus unassigned tickets.
* Clicking a ticket navigates to its detail view.

---

### 7. Ticket List View

A full list of all tickets with search, filtering, and sorting.

**Behavior:**

* Displays tickets in a table with columns: ID, Subject, Sender, Status, Category, Assignee, Created At.
* **Search:** Free-text search across ticket subject, description, and sender email.
* **Filter by:**
  * Status — Open, Resolved, Closed (multi-select)
  * Category — General Question, Technical Question, Refund Request (multi-select)
  * Assignee — select a specific agent, or "Unassigned"
  * Date range — filter by creation date
* **Sort by:** any column, ascending or descending. Default sort is newest first.
* Pagination for large ticket sets.
* Admins see all tickets. Agents see their own assigned tickets and unassigned tickets.

---

### 8. Ticket Detail View

The full view of a single ticket, where agents do their work.

**Behavior:**

* **Header:** Ticket ID, subject, status badge, category badge, assignee, creation date.
* **Conversation thread:** Full history of messages between the student and agent, displayed chronologically. Each message shows the sender, timestamp, and content.
* **AI panel** (sidebar or collapsible section):
  * AI-generated summary of the conversation.
  * AI-assigned category (with option to override).
  * AI-suggested replies (click to load into reply editor).
  * AI-generated draft response (from the knowledge base).
* **Reply editor:** Text area where the agent composes or edits a response. Sending a reply delivers it to the student via email and appends it to the conversation.
* **Status controls:** Agent can change status (Open → Resolved → Closed). Reopening a Closed ticket is not allowed.
* **Assignment:** Admins can reassign tickets to a different agent.

---

### 9. User Management (Admin Only)

Admins manage all user accounts in the system.

**Behavior:**

* **Create agent:** Admin provides name, email, and a temporary password. The agent uses these credentials to log in.
* **Edit agent:** Admin can update an agent's name or email.
* **Deactivate agent:** Admin can deactivate an agent account. Deactivated agents cannot log in. Their existing tickets remain in the system and can be reassigned.
* **User list:** Table of all users showing name, email, role, and active/inactive status.
* Admins cannot delete their own account or the last remaining admin account.

---

## Out of Scope for MVP

* Knowledge base management UI (knowledge base is pre-seeded or managed directly in the database).
* Ticket priority levels.
* Department or queue-based routing.
* Support Manager role.
* Reporting and analytics.
* Self-registration or public sign-up.
* Mobile application.
* Multilingual AI support.
* Fully automated responses without agent review.
* Voice, chat, or social media channels.
