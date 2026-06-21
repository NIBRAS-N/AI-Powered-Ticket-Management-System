import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { renderWithQuery } from "@/test/render";
import UsersPage from "./UsersPage";
import type { PaginatedResponse, User } from "@/types";

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

import api from "@/services/api";
const mockApi = vi.mocked(api);

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    name: "Alice Admin",
    email: "alice@example.com",
    role: "ADMIN",
    isActive: true,
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z",
    ...overrides,
  };
}

function createPaginatedResponse(
  users: User[],
  overrides: Partial<PaginatedResponse<User>> = {},
): PaginatedResponse<User> {
  return {
    data: users,
    total: users.length,
    page: 1,
    limit: 10,
    totalPages: 1,
    ...overrides,
  };
}

function mockUsersResponse(response: PaginatedResponse<User>) {
  mockApi.get.mockResolvedValue({ data: response });
}

function mockUsersError() {
  mockApi.get.mockRejectedValue(new Error("Network error"));
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("UsersPage", () => {
  it("shows loading skeletons while fetching", () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<UsersPage />);

    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(
      screen.getByText("Manage system users and roles."),
    ).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    // 1 header row + 5 skeleton rows
    expect(rows).toHaveLength(6);
  });

  it("renders user data after loading", async () => {
    const users = [
      createUser({ id: "1", name: "Alice Admin", email: "alice@example.com", role: "ADMIN", isActive: true }),
      createUser({ id: "2", name: "Bob Agent", email: "bob@example.com", role: "AGENT", isActive: true }),
      createUser({ id: "3", name: "Carol Inactive", email: "carol@example.com", role: "AGENT", isActive: false }),
    ];
    mockUsersResponse(createPaginatedResponse(users, { total: 3 }));

    renderWithQuery(<UsersPage />);

    expect(await screen.findByText("Alice Admin")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Bob Agent")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    expect(screen.getByText("Carol Inactive")).toBeInTheDocument();

    expect(screen.getByText("3 users total")).toBeInTheDocument();
  });

  it("displays correct role badges", async () => {
    const users = [
      createUser({ id: "1", name: "Admin User", role: "ADMIN" }),
      createUser({ id: "2", name: "Agent User", role: "AGENT" }),
    ];
    mockUsersResponse(createPaginatedResponse(users));

    renderWithQuery(<UsersPage />);

    await screen.findByText("Admin User");

    const adminRow = screen.getByText("Admin User").closest("tr")!;
    expect(within(adminRow).getByText("ADMIN")).toBeInTheDocument();

    const agentRow = screen.getByText("Agent User").closest("tr")!;
    expect(within(agentRow).getByText("AGENT")).toBeInTheDocument();
  });

  it("displays correct active/inactive status badges", async () => {
    const users = [
      createUser({ id: "1", name: "Active User", isActive: true }),
      createUser({ id: "2", name: "Inactive User", isActive: false }),
    ];
    mockUsersResponse(createPaginatedResponse(users));

    renderWithQuery(<UsersPage />);

    await screen.findByText("Active User");

    const activeRow = screen.getByText("Active User").closest("tr")!;
    expect(within(activeRow).getByText("Active")).toBeInTheDocument();

    const inactiveRow = screen.getByText("Inactive User").closest("tr")!;
    expect(within(inactiveRow).getByText("Inactive")).toBeInTheDocument();
  });

  it("shows singular 'user' for count of 1", async () => {
    const users = [createUser()];
    mockUsersResponse(createPaginatedResponse(users, { total: 1 }));

    renderWithQuery(<UsersPage />);

    expect(await screen.findByText("1 user total")).toBeInTheDocument();
  });

  it("shows error message when API call fails", async () => {
    mockUsersError();

    renderWithQuery(<UsersPage />);

    expect(
      await screen.findByText("Failed to load users. Please try again."),
    ).toBeInTheDocument();
  });

  it("renders table headers correctly", async () => {
    mockUsersResponse(createPaginatedResponse([createUser()]));
    renderWithQuery(<UsersPage />);

    await screen.findByText("Alice Admin");

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Joined")).toBeInTheDocument();
  });

  it("formats the joined date", async () => {
    const users = [createUser({ createdAt: "2025-01-15T10:00:00Z" })];
    mockUsersResponse(createPaginatedResponse(users));

    renderWithQuery(<UsersPage />);

    await screen.findByText("Alice Admin");
    const row = screen.getByText("Alice Admin").closest("tr")!;
    const cells = within(row).getAllByRole("cell");
    // Last cell is the date - verify it's a formatted date string (not raw ISO)
    expect(cells[4].textContent).not.toContain("T10:00:00Z");
    expect(cells[4].textContent).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  describe("pagination", () => {
    it("hides pagination when there is only one page", async () => {
      mockUsersResponse(
        createPaginatedResponse([createUser()], { totalPages: 1, page: 1 }),
      );

      renderWithQuery(<UsersPage />);

      await screen.findByText("Alice Admin");

      expect(screen.queryByText("Previous")).not.toBeInTheDocument();
      expect(screen.queryByText("Next")).not.toBeInTheDocument();
    });

    it("shows pagination controls when there are multiple pages", async () => {
      mockUsersResponse(
        createPaginatedResponse([createUser()], {
          totalPages: 3,
          page: 1,
          total: 25,
        }),
      );

      renderWithQuery(<UsersPage />);

      await screen.findByText("Alice Admin");

      expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
      expect(
        screen.getByRole("button", { name: /next/i }),
      ).not.toBeDisabled();
    });

    it("navigates to the next page", async () => {
      const user = userEvent.setup();

      mockUsersResponse(
        createPaginatedResponse([createUser()], {
          totalPages: 3,
          page: 1,
          total: 25,
        }),
      );

      renderWithQuery(<UsersPage />);

      await screen.findByText("Alice Admin");

      mockApi.get.mockClear();
      mockUsersResponse(
        createPaginatedResponse(
          [createUser({ id: "2", name: "Page2 User", email: "page2@example.com" })],
          { totalPages: 3, page: 2, total: 25 },
        ),
      );

      await user.click(screen.getByRole("button", { name: /next/i }));

      expect(mockApi.get).toHaveBeenCalledWith("/users", {
        params: { page: 2, limit: 10 },
      });

      expect(await screen.findByText("Page2 User")).toBeInTheDocument();
      expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    });

    it("navigates to the previous page", async () => {
      const user = userEvent.setup();

      // Start on page 2
      mockUsersResponse(
        createPaginatedResponse(
          [createUser({ name: "Page2 User" })],
          { totalPages: 3, page: 2, total: 25 },
        ),
      );

      renderWithQuery(<UsersPage />);

      // The component always starts at page 1 internally, so we need to click next first
      await screen.findByText("Page2 User");

      // Since state starts at page=1, the API was called with page=1.
      // We need to navigate forward first, then back.
      // Let's re-approach: render, go to page 2, then go back to page 1.
      mockApi.get.mockClear();
      mockUsersResponse(
        createPaginatedResponse(
          [createUser({ name: "Page2 User" })],
          { totalPages: 3, page: 2, total: 25 },
        ),
      );

      await user.click(screen.getByRole("button", { name: /next/i }));
      await screen.findByText("Page 2 of 3");

      // Now go back
      mockApi.get.mockClear();
      mockUsersResponse(
        createPaginatedResponse(
          [createUser({ name: "Page1 User" })],
          { totalPages: 3, page: 1, total: 25 },
        ),
      );

      await user.click(screen.getByRole("button", { name: /previous/i }));

      expect(mockApi.get).toHaveBeenCalledWith("/users", {
        params: { page: 1, limit: 10 },
      });

      expect(await screen.findByText("Page1 User")).toBeInTheDocument();
    });

    it("disables Next button on the last page", async () => {
      mockUsersResponse(
        createPaginatedResponse([createUser()], {
          totalPages: 2,
          page: 2,
          total: 15,
        }),
      );

      renderWithQuery(<UsersPage />);

      // Component starts at page=1, navigate to page 2
      await screen.findByText("Alice Admin");

      const user = userEvent.setup();
      mockUsersResponse(
        createPaginatedResponse([createUser()], {
          totalPages: 2,
          page: 2,
          total: 15,
        }),
      );

      await user.click(screen.getByRole("button", { name: /next/i }));
      await screen.findByText("Page 2 of 2");

      expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
      expect(
        screen.getByRole("button", { name: /previous/i }),
      ).not.toBeDisabled();
    });
  });

  it("calls the API with correct initial params", () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<UsersPage />);

    expect(mockApi.get).toHaveBeenCalledWith("/users", {
      params: { page: 1, limit: 10 },
    });
  });

  describe("create user", () => {
    it("shows Create User button", async () => {
      mockUsersResponse(createPaginatedResponse([createUser()]));
      renderWithQuery(<UsersPage />);

      await screen.findByText("Alice Admin");

      expect(
        screen.getByRole("button", { name: /create user/i }),
      ).toBeInTheDocument();
    });

    it("opens dialog when Create User button is clicked", async () => {
      const user = userEvent.setup();
      mockUsersResponse(createPaginatedResponse([createUser()]));
      renderWithQuery(<UsersPage />);

      await screen.findByText("Alice Admin");
      await user.click(screen.getByRole("button", { name: /create user/i }));

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Create New User")).toBeInTheDocument();
    });

    it("validates required fields on submit", async () => {
      const user = userEvent.setup();
      mockUsersResponse(createPaginatedResponse([createUser()]));
      renderWithQuery(<UsersPage />);

      await screen.findByText("Alice Admin");
      await user.click(screen.getByRole("button", { name: /create user/i }));

      await user.click(screen.getByRole("button", { name: /^create user$/i }));

      expect(
        await screen.findByText("Name must be at least 3 characters"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Please enter a valid email"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Password must be at least 8 characters"),
      ).toBeInTheDocument();
    });

    it("submits form and closes dialog on success", async () => {
      const user = userEvent.setup();
      mockUsersResponse(createPaginatedResponse([createUser()]));
      mockApi.post.mockResolvedValue({
        data: createUser({
          id: "new-user",
          name: "New Agent",
          email: "new@example.com",
          role: "AGENT",
        }),
      });

      renderWithQuery(<UsersPage />);

      await screen.findByText("Alice Admin");
      await user.click(screen.getByRole("button", { name: /create user/i }));

      await user.type(screen.getByLabelText("Name"), "New Agent");
      await user.type(screen.getByLabelText("Email"), "new@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");

      await user.click(screen.getByRole("button", { name: /^create user$/i }));

      await vi.waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith("/users", {
          name: "New Agent",
          email: "new@example.com",
          password: "password123",
        });
      });

      await vi.waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("shows server error on duplicate email", async () => {
      const user = userEvent.setup();
      mockUsersResponse(createPaginatedResponse([createUser()]));
      mockApi.post.mockRejectedValue({
        response: {
          data: { error: "A user with this email already exists" },
        },
      });

      renderWithQuery(<UsersPage />);

      await screen.findByText("Alice Admin");
      await user.click(screen.getByRole("button", { name: /create user/i }));

      await user.type(screen.getByLabelText("Name"), "Duplicate User");
      await user.type(screen.getByLabelText("Email"), "alice@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");

      await user.click(screen.getByRole("button", { name: /^create user$/i }));

      expect(
        await screen.findByText("A user with this email already exists"),
      ).toBeInTheDocument();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("edit user", () => {
    it("shows edit button for each user row", async () => {
      const users = [
        createUser({ id: "1", name: "Alice Admin" }),
        createUser({ id: "2", name: "Bob Agent" }),
      ];
      mockUsersResponse(createPaginatedResponse(users));
      renderWithQuery(<UsersPage />);

      await screen.findByText("Alice Admin");

      expect(screen.getByRole("button", { name: /edit alice admin/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /edit bob agent/i })).toBeInTheDocument();
    });

    it("opens edit dialog populated with user data", async () => {
      const user = userEvent.setup();
      const users = [createUser({ id: "1", name: "Alice Admin", email: "alice@example.com" })];
      mockUsersResponse(createPaginatedResponse(users));
      renderWithQuery(<UsersPage />);

      await screen.findByText("Alice Admin");
      await user.click(screen.getByRole("button", { name: /edit alice admin/i }));

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Edit User")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Alice Admin")).toBeInTheDocument();
      expect(screen.getByDisplayValue("alice@example.com")).toBeInTheDocument();
    });

    it("submits edited data and closes dialog on success", async () => {
      const user = userEvent.setup();
      const users = [createUser({ id: "1", name: "Alice Admin", email: "alice@example.com" })];
      mockUsersResponse(createPaginatedResponse(users));
      mockApi.patch.mockResolvedValue({
        data: createUser({ id: "1", name: "Alice Updated", email: "alice@example.com" }),
      });

      renderWithQuery(<UsersPage />);

      await screen.findByText("Alice Admin");
      await user.click(screen.getByRole("button", { name: /edit alice admin/i }));

      const nameInput = screen.getByDisplayValue("Alice Admin");
      await user.clear(nameInput);
      await user.type(nameInput, "Alice Updated");

      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await vi.waitFor(() => {
        expect(mockApi.patch).toHaveBeenCalledWith("/users/1", {
          name: "Alice Updated",
          email: "alice@example.com",
        });
      });

      await vi.waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("sends password only when provided", async () => {
      const user = userEvent.setup();
      const users = [createUser({ id: "1", name: "Alice Admin", email: "alice@example.com" })];
      mockUsersResponse(createPaginatedResponse(users));
      mockApi.patch.mockResolvedValue({
        data: createUser({ id: "1", name: "Alice Admin", email: "alice@example.com" }),
      });

      renderWithQuery(<UsersPage />);

      await screen.findByText("Alice Admin");
      await user.click(screen.getByRole("button", { name: /edit alice admin/i }));

      await user.type(screen.getByLabelText("Password"), "newpass123");
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await vi.waitFor(() => {
        expect(mockApi.patch).toHaveBeenCalledWith("/users/1", {
          name: "Alice Admin",
          email: "alice@example.com",
          password: "newpass123",
        });
      });
    });

    it("shows server error on duplicate email", async () => {
      const user = userEvent.setup();
      const users = [createUser({ id: "1", name: "Alice Admin", email: "alice@example.com" })];
      mockUsersResponse(createPaginatedResponse(users));
      mockApi.patch.mockRejectedValue({
        response: {
          data: { error: "A user with this email already exists" },
        },
      });

      renderWithQuery(<UsersPage />);

      await screen.findByText("Alice Admin");
      await user.click(screen.getByRole("button", { name: /edit alice admin/i }));

      const emailInput = screen.getByDisplayValue("alice@example.com");
      await user.clear(emailInput);
      await user.type(emailInput, "taken@example.com");

      await user.click(screen.getByRole("button", { name: /save changes/i }));

      expect(
        await screen.findByText("A user with this email already exists"),
      ).toBeInTheDocument();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("delete user", () => {
    it("shows delete button for AGENT users but not ADMIN users", async () => {
      const users = [
        createUser({ id: "1", name: "Admin User", role: "ADMIN" }),
        createUser({ id: "2", name: "Agent User", role: "AGENT" }),
      ];
      mockUsersResponse(createPaginatedResponse(users));
      renderWithQuery(<UsersPage />);

      await screen.findByText("Admin User");

      expect(screen.queryByRole("button", { name: /delete admin user/i })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /delete agent user/i })).toBeInTheDocument();
    });

    it("opens confirmation dialog when delete button is clicked", async () => {
      const user = userEvent.setup();
      const users = [createUser({ id: "2", name: "Bob Agent", role: "AGENT" })];
      mockUsersResponse(createPaginatedResponse(users));
      renderWithQuery(<UsersPage />);

      await screen.findByText("Bob Agent");
      await user.click(screen.getByRole("button", { name: /delete bob agent/i }));

      const dialog = screen.getByRole("alertdialog");
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText("Delete User")).toBeInTheDocument();
      expect(within(dialog).getByText(/bob agent/i)).toBeInTheDocument();
    });

    it("calls api.delete and closes dialog on confirm", async () => {
      const user = userEvent.setup();
      const users = [createUser({ id: "2", name: "Bob Agent", role: "AGENT" })];
      mockUsersResponse(createPaginatedResponse(users));
      mockApi.delete.mockResolvedValue({
        data: createUser({ id: "2", name: "Bob Agent", role: "AGENT", isActive: false }),
      });

      renderWithQuery(<UsersPage />);

      await screen.findByText("Bob Agent");
      await user.click(screen.getByRole("button", { name: /delete bob agent/i }));
      await user.click(screen.getByRole("button", { name: /^delete$/i }));

      await vi.waitFor(() => {
        expect(mockApi.delete).toHaveBeenCalledWith("/users/2");
      });

      await vi.waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
    });

    it("shows server error in dialog on failure", async () => {
      const user = userEvent.setup();
      const users = [createUser({ id: "2", name: "Bob Agent", role: "AGENT" })];
      mockUsersResponse(createPaginatedResponse(users));
      mockApi.delete.mockRejectedValue({
        response: {
          data: { error: "Admin users cannot be deleted" },
        },
      });

      renderWithQuery(<UsersPage />);

      await screen.findByText("Bob Agent");
      await user.click(screen.getByRole("button", { name: /delete bob agent/i }));
      await user.click(screen.getByRole("button", { name: /^delete$/i }));

      const dialog = screen.getByRole("alertdialog");
      expect(
        await within(dialog).findByText("Admin users cannot be deleted"),
      ).toBeInTheDocument();

      expect(dialog).toBeInTheDocument();
    });
  });
});
