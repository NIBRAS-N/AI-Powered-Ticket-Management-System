import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import api from "@/services/api";
import type { Ticket, TicketStatus, TicketCategory, User, Reply } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString();
}

type Agent = Pick<User, "id" | "name" | "email">;

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [replyBody, setReplyBody] = useState("");

  const { data: ticket, isPending, isError } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => api.get<Ticket>(`/tickets/${id}`).then((res) => res.data),
    enabled: !!id,
  });

  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: () => api.get<Agent[]>("/tickets/agents").then((res) => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Pick<Ticket, "status" | "category" | "assigneeId">>) =>
      api.patch<Ticket>(`/tickets/${id}`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: (data: { body: string; senderType: string }) =>
      api.post<Reply>(`/tickets/${id}/replies`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setReplyBody("");
    },
  });

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="space-y-6">
        <Link to="/tickets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            Back to Tickets
          </Button>
        </Link>
        <p className="text-center py-12 text-destructive">
          Ticket not found or failed to load.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/tickets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="font-mono text-muted-foreground">#{ticket.id}</span>{" "}
            {ticket.subject}
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd className="mt-1">
                <Select
                  value={ticket.status}
                  onValueChange={(value) =>
                    updateMutation.mutate({ status: value as TicketStatus })
                  }
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Category</dt>
              <dd className="mt-1">
                <Select
                  value={ticket.category ?? "none"}
                  onValueChange={(value) =>
                    updateMutation.mutate({ category: value === "none" ? null : value as TicketCategory })
                  }
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="TECHNICAL">Technical</SelectItem>
                    <SelectItem value="REFUND">Refund</SelectItem>
                  </SelectContent>
                </Select>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Assignee</dt>
              <dd className="mt-1">
                <Select
                  value={ticket.assigneeId ?? "unassigned"}
                  onValueChange={(value) =>
                    updateMutation.mutate({ assigneeId: value === "unassigned" ? null : value })
                  }
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {agents?.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Sender</dt>
              <dd className="mt-1">
                <span>{ticket.senderName}</span>
                <span className="block text-xs text-muted-foreground">{ticket.senderEmail}</span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Created</dt>
              <dd className="mt-1 text-sm">{formatDate(ticket.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Updated</dt>
              <dd className="mt-1 text-sm">{formatDate(ticket.updatedAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {ticket.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Messages{ticket.messages && ` (${ticket.messages.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!ticket.messages || ticket.messages.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No messages yet.</p>
          ) : (
            <div className="space-y-4">
              {ticket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg border p-4 ${
                    msg.senderType === "AGENT" ? "bg-muted/50 ml-8" : "mr-8"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{msg.senderName}</span>
                      <Badge variant={msg.senderType === "AGENT" ? "secondary" : "outline"} className="text-xs">
                        {msg.senderType}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Replies{ticket.replies && ` (${ticket.replies.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!ticket.replies || ticket.replies.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No replies yet.</p>
          ) : (
            <div className="space-y-4">
              {ticket.replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`rounded-lg border p-4 ${
                    reply.senderType === "AGENT" ? "bg-muted/50 ml-8" : "mr-8"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {reply.user?.name ?? "Customer"}
                      </span>
                      <Badge variant={reply.senderType === "AGENT" ? "secondary" : "outline"} className="text-xs">
                        {reply.senderType}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{reply.body}</p>
                </div>
              ))}
            </div>
          )}

          {ticket.status !== "CLOSED" && (
            <form
              className="mt-6 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!replyBody.trim()) return;
                replyMutation.mutate({ body: replyBody.trim(), senderType: "AGENT" });
              }}
            >
              <Textarea
                placeholder="Write a reply..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={3}
                disabled={replyMutation.isPending}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyBody.trim() || replyMutation.isPending}
                >
                  <Send className="mr-2 size-4" />
                  {replyMutation.isPending ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </form>
          )}

          {ticket.status === "CLOSED" && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              This ticket is closed. Replies are disabled.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
