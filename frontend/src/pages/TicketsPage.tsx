import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/services/api";
import type { Ticket, TicketStatus, TicketCategory, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

function fetchTickets(page: number, status?: TicketStatus, category?: TicketCategory) {
  return api
    .get<PaginatedResponse<Ticket>>("/tickets", {
      params: {
        page,
        limit: PAGE_SIZE,
        ...(status && { status }),
        ...(category && { category }),
      },
    })
    .then((res) => res.data);
}

export default function TicketsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | undefined>();

  const { data, isPending, isError } = useQuery({
    queryKey: ["tickets", page, statusFilter, categoryFilter],
    queryFn: () => fetchTickets(page, statusFilter, categoryFilter),
  });

  const handleStatusFilter = (status?: TicketStatus) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleCategoryFilter = (category?: TicketCategory) => {
    setCategoryFilter(category);
    setPage(1);
  };

  const tableHeaders = (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[60px]">ID</TableHead>
        <TableHead>Subject</TableHead>
        <TableHead>Sender</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Category</TableHead>
        <TableHead>Assignee</TableHead>
        <TableHead>Created</TableHead>
      </TableRow>
    </TableHeader>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
        <p className="text-muted-foreground">View and manage support tickets.</p>
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
                {tableHeaders}
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
                  {tableHeaders}
                  <TableBody>
                    {data.data.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-muted-foreground">#{ticket.id}</TableCell>
                        <TableCell className="font-medium max-w-[300px] truncate">{ticket.subject}</TableCell>
                        <TableCell>
                          <div>
                            <span>{ticket.senderName}</span>
                            <span className="block text-xs text-muted-foreground">{ticket.senderEmail}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ticket.category ? (
                            <Badge variant={categoryBadgeVariant(ticket.category)}>
                              {ticket.category}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {ticket.assignee ? (
                            ticket.assignee.name
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </TableCell>
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= data.totalPages}
                    >
                      Next
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
