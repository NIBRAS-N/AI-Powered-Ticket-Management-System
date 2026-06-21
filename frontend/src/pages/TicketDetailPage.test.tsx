import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import TicketDetailPage from "./TicketDetailPage";
import type { Ticket, Message, Reply } from "@/types";

vi.mock("@/services/api", () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

import { render } from "@testing-library/react";
import api from "@/services/api";
const mockApi = vi.mocked(api);

function createTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 1,
    subject: "Cannot login to dashboard",
    description: "I keep getting a 403 error when trying to login.",
    senderEmail: "john@example.com",
    senderName: "John Doe",
    status: "OPEN",
    category: "TECHNICAL",
    assigneeId: null,
    createdAt: "2025-06-01T10:00:00Z",
    updatedAt: "2025-06-01T12:00:00Z",
    messages: [],
    replies: [],
    ...overrides,
  };
}

function createReply(overrides: Partial<Reply> = {}): Reply {
  return {
    id: 1,
    body: "We are looking into this issue.",
    ticketId: 1,
    userId: "agent-1",
    user: { id: "agent-1", name: "Alice Agent", email: "alice@example.com" },
    senderType: "AGENT",
    createdAt: "2025-06-01T14:00:00Z",
    ...overrides,
  };
}

function createMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 1,
    ticketId: 1,
    senderType: "STUDENT",
    senderName: "John Doe",
    content: "I keep getting a 403 error when trying to login.",
    createdAt: "2025-06-01T10:00:00Z",
    ...overrides,
  };
}

const agents = [
  { id: "agent-1", name: "Alice Agent", email: "alice@example.com" },
  { id: "agent-2", name: "Bob Agent", email: "bob@example.com" },
];

function renderPage(ticketId = "1") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/tickets/${ticketId}`]}>
        <Routes>
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/tickets" element={<div>Tickets List</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function mockTicketResponse(ticket: Ticket) {
  mockApi.get.mockImplementation((url: string) => {
    if (url === `/tickets/${ticket.id}`) {
      return Promise.resolve({ data: ticket });
    }
    if (url === "/tickets/agents") {
      return Promise.resolve({ data: agents });
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`));
  });
}

function mockTicketError() {
  mockApi.get.mockImplementation((url: string) => {
    if (url === "/tickets/agents") {
      return Promise.resolve({ data: agents });
    }
    return Promise.reject(new Error("Network error"));
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("TicketDetailPage", () => {
  it("shows loading skeletons while fetching", () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.queryByText("Cannot login to dashboard")).not.toBeInTheDocument();
  });

  it("renders ticket details after loading", async () => {
    const ticket = createTicket();
    mockTicketResponse(ticket);

    renderPage();

    expect(await screen.findByText("Cannot login to dashboard")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Technical")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("shows error state when ticket fails to load", async () => {
    mockTicketError();

    renderPage();

    expect(
      await screen.findByText("Ticket not found or failed to load."),
    ).toBeInTheDocument();
    expect(screen.getByText("Back to Tickets")).toBeInTheDocument();
  });

  it("shows description card", async () => {
    mockTicketResponse(createTicket());

    renderPage();

    expect(
      await screen.findByText("I keep getting a 403 error when trying to login."),
    ).toBeInTheDocument();
  });

  it("shows 'No messages yet' when ticket has no messages", async () => {
    mockTicketResponse(createTicket({ messages: [] }));

    renderPage();

    expect(await screen.findByText("No messages yet.")).toBeInTheDocument();
  });

  it("renders messages with sender info and badges", async () => {
    const messages = [
      createMessage({ id: 1, senderType: "STUDENT", senderName: "John Doe", content: "Help me please" }),
      createMessage({ id: 2, senderType: "AGENT", senderName: "Alice Agent", content: "I can help!" }),
    ];
    mockTicketResponse(createTicket({ messages }));

    renderPage();

    expect(await screen.findByText("Help me please")).toBeInTheDocument();
    expect(screen.getByText("I can help!")).toBeInTheDocument();
    expect(screen.getByText("Messages (2)")).toBeInTheDocument();
    expect(screen.getByText("STUDENT")).toBeInTheDocument();
    expect(screen.getByText("AGENT")).toBeInTheDocument();
  });

  it("shows assignee as 'Unassigned' when no assignee", async () => {
    mockTicketResponse(createTicket({ assigneeId: null, assignee: undefined }));

    renderPage();

    await screen.findByText("Cannot login to dashboard");
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("shows assigned agent name in the select", async () => {
    mockTicketResponse(
      createTicket({
        assigneeId: "agent-1",
        assignee: { id: "agent-1", name: "Alice Agent", email: "alice@example.com", role: "AGENT", isActive: true, createdAt: "", updatedAt: "" },
      }),
    );

    renderPage();

    await screen.findByText("Cannot login to dashboard");
    expect(screen.getByText("Alice Agent")).toBeInTheDocument();
  });

  it("navigates back to tickets list via back button", async () => {
    const user = userEvent.setup();
    mockTicketResponse(createTicket());

    renderPage();

    await screen.findByText("Cannot login to dashboard");

    const backLinks = screen.getAllByRole("link");
    const backLink = backLinks.find((l) => l.getAttribute("href") === "/tickets");
    expect(backLink).toBeInTheDocument();

    await user.click(backLink!);
    expect(await screen.findByText("Tickets List")).toBeInTheDocument();
  });

  it("fetches ticket and agents on mount", async () => {
    mockTicketResponse(createTicket());

    renderPage();

    await screen.findByText("Cannot login to dashboard");

    expect(mockApi.get).toHaveBeenCalledWith("/tickets/1");
    expect(mockApi.get).toHaveBeenCalledWith("/tickets/agents");
  });

  describe("assign ticket", () => {
    it("calls update API when selecting an agent", async () => {
      const user = userEvent.setup();
      mockTicketResponse(createTicket({ assigneeId: null }));
      mockApi.patch.mockResolvedValue({
        data: createTicket({ assigneeId: "agent-1" }),
      });

      renderPage();
      await screen.findByText("Cannot login to dashboard");

      const comboboxes = screen.getAllByRole("combobox");
      const assigneeSelect = comboboxes[2];
      await user.click(assigneeSelect);

      const option = await screen.findByRole("option", { name: "Alice Agent" });
      await user.click(option);

      await vi.waitFor(() => {
        expect(mockApi.patch).toHaveBeenCalledWith("/tickets/1", {
          assigneeId: "agent-1",
        });
      });
    });

    it("calls update API with null when selecting 'Unassigned'", async () => {
      const user = userEvent.setup();
      mockTicketResponse(
        createTicket({
          assigneeId: "agent-1",
          assignee: { id: "agent-1", name: "Alice Agent", email: "alice@example.com", role: "AGENT", isActive: true, createdAt: "", updatedAt: "" },
        }),
      );
      mockApi.patch.mockResolvedValue({
        data: createTicket({ assigneeId: null }),
      });

      renderPage();
      await screen.findByText("Cannot login to dashboard");

      const comboboxes = screen.getAllByRole("combobox");
      const assigneeSelect = comboboxes[2];
      await user.click(assigneeSelect);

      const option = await screen.findByRole("option", { name: "Unassigned" });
      await user.click(option);

      await vi.waitFor(() => {
        expect(mockApi.patch).toHaveBeenCalledWith("/tickets/1", {
          assigneeId: null,
        });
      });
    });
  });

  describe("update status", () => {
    it("shows current status in the select", async () => {
      mockTicketResponse(createTicket({ status: "RESOLVED" }));

      renderPage();

      expect(await screen.findByText("Resolved")).toBeInTheDocument();
    });

    it("calls update API when changing status", async () => {
      const user = userEvent.setup();
      mockTicketResponse(createTicket({ status: "OPEN" }));
      mockApi.patch.mockResolvedValue({
        data: createTicket({ status: "RESOLVED" }),
      });

      renderPage();
      await screen.findByText("Cannot login to dashboard");

      const comboboxes = screen.getAllByRole("combobox");
      const statusSelect = comboboxes[0];
      await user.click(statusSelect);

      const option = await screen.findByRole("option", { name: "Resolved" });
      await user.click(option);

      await vi.waitFor(() => {
        expect(mockApi.patch).toHaveBeenCalledWith("/tickets/1", {
          status: "RESOLVED",
        });
      });
    });

    it("calls update API when changing status to Closed", async () => {
      const user = userEvent.setup();
      mockTicketResponse(createTicket({ status: "OPEN" }));
      mockApi.patch.mockResolvedValue({
        data: createTicket({ status: "CLOSED" }),
      });

      renderPage();
      await screen.findByText("Cannot login to dashboard");

      const comboboxes = screen.getAllByRole("combobox");
      const statusSelect = comboboxes[0];
      await user.click(statusSelect);

      const option = await screen.findByRole("option", { name: "Closed" });
      await user.click(option);

      await vi.waitFor(() => {
        expect(mockApi.patch).toHaveBeenCalledWith("/tickets/1", {
          status: "CLOSED",
        });
      });
    });
  });

  describe("update category", () => {
    it("shows current category in the select", async () => {
      mockTicketResponse(createTicket({ category: "REFUND" }));

      renderPage();

      expect(await screen.findByText("Refund")).toBeInTheDocument();
    });

    it("shows 'None' when category is null", async () => {
      mockTicketResponse(createTicket({ category: null }));

      renderPage();

      await screen.findByText("Cannot login to dashboard");
      expect(screen.getByText("None")).toBeInTheDocument();
    });

    it("calls update API when changing category", async () => {
      const user = userEvent.setup();
      mockTicketResponse(createTicket({ category: "TECHNICAL" }));
      mockApi.patch.mockResolvedValue({
        data: createTicket({ category: "REFUND" }),
      });

      renderPage();
      await screen.findByText("Cannot login to dashboard");

      const comboboxes = screen.getAllByRole("combobox");
      const categorySelect = comboboxes[1];
      await user.click(categorySelect);

      const option = await screen.findByRole("option", { name: "Refund" });
      await user.click(option);

      await vi.waitFor(() => {
        expect(mockApi.patch).toHaveBeenCalledWith("/tickets/1", {
          category: "REFUND",
        });
      });
    });

    it("calls update API with null when selecting 'None'", async () => {
      const user = userEvent.setup();
      mockTicketResponse(createTicket({ category: "GENERAL" }));
      mockApi.patch.mockResolvedValue({
        data: createTicket({ category: null }),
      });

      renderPage();
      await screen.findByText("Cannot login to dashboard");

      const comboboxes = screen.getAllByRole("combobox");
      const categorySelect = comboboxes[1];
      await user.click(categorySelect);

      const option = await screen.findByRole("option", { name: "None" });
      await user.click(option);

      await vi.waitFor(() => {
        expect(mockApi.patch).toHaveBeenCalledWith("/tickets/1", {
          category: null,
        });
      });
    });
  });

  describe("replies", () => {
    it("shows 'No replies yet' when ticket has no replies", async () => {
      mockTicketResponse(createTicket({ replies: [] }));

      renderPage();

      expect(await screen.findByText("No replies yet.")).toBeInTheDocument();
    });

    it("renders replies with sender info and badges", async () => {
      const replies = [
        createReply({ id: 1, senderType: "STUDENT", userId: null, user: null, body: "I need more help" }),
        createReply({ id: 2, senderType: "AGENT", body: "Sure, let me check" }),
      ];
      mockTicketResponse(createTicket({ replies }));

      renderPage();

      expect(await screen.findByText("I need more help")).toBeInTheDocument();
      expect(screen.getByText("Sure, let me check")).toBeInTheDocument();
      expect(screen.getByText("Replies (2)")).toBeInTheDocument();
    });

    it("shows 'Customer' for replies without a user", async () => {
      const replies = [
        createReply({ id: 1, senderType: "STUDENT", userId: null, user: null, body: "Customer question" }),
      ];
      mockTicketResponse(createTicket({ replies }));

      renderPage();

      await screen.findByText("Customer question");
      expect(screen.getByText("Customer")).toBeInTheDocument();
    });

    it("shows agent name for agent replies", async () => {
      const replies = [
        createReply({ id: 1, senderType: "AGENT", user: { id: "agent-1", name: "Alice Agent", email: "alice@example.com" }, body: "Agent response" }),
      ];
      mockTicketResponse(createTicket({ replies }));

      renderPage();

      expect(await screen.findByText("Agent response")).toBeInTheDocument();
    });

    it("shows reply form for OPEN tickets", async () => {
      mockTicketResponse(createTicket({ status: "OPEN" }));

      renderPage();

      await screen.findByText("Cannot login to dashboard");
      expect(screen.getByPlaceholderText("Write a reply...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /send reply/i })).toBeInTheDocument();
    });

    it("shows reply form for RESOLVED tickets", async () => {
      mockTicketResponse(createTicket({ status: "RESOLVED" }));

      renderPage();

      await screen.findByText("Cannot login to dashboard");
      expect(screen.getByPlaceholderText("Write a reply...")).toBeInTheDocument();
    });

    it("hides reply form and shows disabled message for CLOSED tickets", async () => {
      mockTicketResponse(createTicket({ status: "CLOSED" }));

      renderPage();

      await screen.findByText("Cannot login to dashboard");
      expect(screen.queryByPlaceholderText("Write a reply...")).not.toBeInTheDocument();
      expect(screen.getByText("This ticket is closed. Replies are disabled.")).toBeInTheDocument();
    });

    it("disables send button when textarea is empty", async () => {
      mockTicketResponse(createTicket({ status: "OPEN" }));

      renderPage();

      await screen.findByText("Cannot login to dashboard");
      expect(screen.getByRole("button", { name: /send reply/i })).toBeDisabled();
    });

    it("enables send button when textarea has content", async () => {
      const user = userEvent.setup();
      mockTicketResponse(createTicket({ status: "OPEN" }));

      renderPage();

      await screen.findByText("Cannot login to dashboard");
      await user.type(screen.getByPlaceholderText("Write a reply..."), "My reply");
      expect(screen.getByRole("button", { name: /send reply/i })).toBeEnabled();
    });

    it("calls POST API when submitting a reply", async () => {
      const user = userEvent.setup();
      mockTicketResponse(createTicket({ status: "OPEN" }));
      mockApi.post.mockResolvedValue({
        data: createReply({ body: "My reply text" }),
      });

      renderPage();

      await screen.findByText("Cannot login to dashboard");
      await user.type(screen.getByPlaceholderText("Write a reply..."), "My reply text");
      await user.click(screen.getByRole("button", { name: /send reply/i }));

      await vi.waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith("/tickets/1/replies", {
          body: "My reply text",
          senderType: "AGENT",
        });
      });
    });

    it("clears textarea after successful reply", async () => {
      const user = userEvent.setup();
      mockTicketResponse(createTicket({ status: "OPEN" }));
      mockApi.post.mockResolvedValue({
        data: createReply({ body: "My reply text" }),
      });

      renderPage();

      await screen.findByText("Cannot login to dashboard");
      const textarea = screen.getByPlaceholderText("Write a reply...");
      await user.type(textarea, "My reply text");
      await user.click(screen.getByRole("button", { name: /send reply/i }));

      await vi.waitFor(() => {
        expect(textarea).toHaveValue("");
      });
    });

    it("does not submit when textarea only has whitespace", async () => {
      const user = userEvent.setup();
      mockTicketResponse(createTicket({ status: "OPEN" }));

      renderPage();

      await screen.findByText("Cannot login to dashboard");
      await user.type(screen.getByPlaceholderText("Write a reply..."), "   ");
      expect(screen.getByRole("button", { name: /send reply/i })).toBeDisabled();
    });
  });
});
