import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import TicketDetailPage from "./TicketDetailPage";
import type { Ticket, Message } from "@/types";

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
    expect(screen.getByText("OPEN")).toBeInTheDocument();
    expect(screen.getByText("TECHNICAL")).toBeInTheDocument();
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

  it("calls assign API when selecting an agent", async () => {
    const user = userEvent.setup();
    mockTicketResponse(createTicket({ assigneeId: null }));
    mockApi.patch.mockResolvedValue({
      data: createTicket({ assigneeId: "agent-1" }),
    });

    renderPage();

    await screen.findByText("Cannot login to dashboard");

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    const option = await screen.findByRole("option", { name: "Alice Agent" });
    await user.click(option);

    await vi.waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith("/tickets/1/assign", {
        assigneeId: "agent-1",
      });
    });
  });

  it("calls assign API with null when selecting 'Unassigned'", async () => {
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

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    const option = await screen.findByRole("option", { name: "Unassigned" });
    await user.click(option);

    await vi.waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith("/tickets/1/assign", {
        assigneeId: null,
      });
    });
  });

  it("shows correct status badge variants", async () => {
    mockTicketResponse(createTicket({ status: "RESOLVED" }));

    renderPage();

    expect(await screen.findByText("RESOLVED")).toBeInTheDocument();
  });

  it("shows dash when category is null", async () => {
    mockTicketResponse(createTicket({ category: null }));

    renderPage();

    await screen.findByText("Cannot login to dashboard");
    expect(screen.getByText("—")).toBeInTheDocument();
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
});
