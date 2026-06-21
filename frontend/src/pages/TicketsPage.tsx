import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import api from "@/services/api";
import type { Ticket, TicketStatus, TicketCategory, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

const STATUSES: TicketStatus[] = ["OPEN", "RESOLVED", "CLOSED"];
const CATEGORIES: TicketCategory[] = ["GENERAL", "TECHNICAL", "REFUND"];

function statusBadgeVariant(status: TicketStatus) {
  switch (status) {
    case "OPEN": return "default" as const;
    case "RESOLVED": return "secondary" as const;
    case "CLOSED": return "outline" as const;
  }
}

function categoryBadgeVariant(category: TicketCategory) {
  switch (category) {
    case "GENERAL": return "outline" as const;
    case "TECHNICAL": return "secondary" as const;
    case "REFUND": return "destructive" as const;
  }
}

const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground">#{row.original.id}</span>
    ),
    size: 60,
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <span className="font-medium max-w-[300px] truncate block">{row.original.subject}</span>
    ),
  },
  {
    accessorKey: "senderName",
    header: "Sender",
    cell: ({ row }) => (
      <div>
        <span>{row.original.senderName}</span>
        <span className="block text-xs text-muted-foreground">{row.original.senderEmail}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusBadgeVariant(row.original.status)}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) =>
      row.original.category ? (
        <Badge variant={categoryBadgeVariant(row.original.category)}>
          {row.original.category}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "assignee",
    header: "Assignee",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.assignee ? (
        row.original.assignee.name
      ) : (
        <span className="text-muted-foreground">Unassigned</span>
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleDateString()}
      </span>
    ),
  },
];

function SortIcon({ isSorted }: { isSorted: false | "asc" | "desc" }) {
  if (isSorted === "asc") return <ArrowUp className="size-4" />;
  if (isSorted === "desc") return <ArrowDown className="size-4" />;
  return <ArrowUpDown className="size-4 text-muted-foreground/50" />;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}

function fetchTickets(
  page: number,
  sorting: SortingState,
  status?: TicketStatus,
  category?: TicketCategory,
  search?: string,
) {
  const sortBy = sorting[0]?.id ?? "createdAt";
  const sortOrder = sorting[0]?.desc === false ? "asc" : "desc";

  return api
    .get<PaginatedResponse<Ticket>>("/tickets", {
      params: {
        page,
        limit: PAGE_SIZE,
        sortBy,
        sortOrder,
        ...(status && { status }),
        ...(category && { category }),
        ...(search && { search }),
      },
    })
    .then((res) => res.data);
}

export default function TicketsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | undefined>();
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { data, isPending, isError } = useQuery({
    queryKey: ["tickets", page, sorting, statusFilter, categoryFilter, search],
    queryFn: () => fetchTickets(page, sorting, statusFilter, categoryFilter, search),
  });

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    state: { sorting },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPage(1);
    },
  });

  const handleStatusFilter = (status?: TicketStatus) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleCategoryFilter = (category?: TicketCategory) => {
    setCategoryFilter(category);
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
        <p className="text-muted-foreground">View and manage support tickets.</p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by subject, sender..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 w-[300px]"
            />
          </div>
          <Button type="submit" variant="secondary" size="default">
            Search
          </Button>
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="default"
              onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
            >
              Clear
            </Button>
          )}
        </form>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          <div className="flex gap-1">
            <Button
              variant={statusFilter === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter(undefined)}
            >
              All
            </Button>
            {STATUSES.map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusFilter(s)}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Category:</span>
          <div className="flex gap-1">
            <Button
              variant={categoryFilter === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryFilter(undefined)}
            >
              All
            </Button>
            {CATEGORIES.map((c) => (
              <Button
                key={c}
                variant={categoryFilter === c ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryFilter(c)}
              >
                {c.charAt(0) + c.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tickets</CardTitle>
          <CardDescription>
            {data ? `${data.total} ticket${data.total !== 1 ? "s" : ""} total` : <Skeleton className="h-4 w-24" />}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="overflow-x-auto -mx-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col, i) => (
                      <TableHead key={i}>{typeof col.header === "string" ? col.header : ""}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : isError ? (
            <p className="text-center py-12 text-destructive">
              Failed to load tickets. Please try again.
            </p>
          ) : data.data.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              No tickets found.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center gap-1">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                <SortIcon isSorted={header.column.getIsSorted()} />
                              )}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {data.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {data.page} of {data.totalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    {getPageNumbers(page, data.totalPages).map((p, i) =>
                      p === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground">...</span>
                      ) : (
                        <Button
                          key={p}
                          variant={page === p ? "default" : "outline"}
                          size="icon"
                          className="size-8"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      ),
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= data.totalPages}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
