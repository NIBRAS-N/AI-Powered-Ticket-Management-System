import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { AxiosError } from "axios";
import api from "@/services/api";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function buildSchema(isEditing: boolean) {
  return z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    email: z.string().email("Please enter a valid email"),
    password: isEditing
      ? z.string().min(8, "Password must be at least 8 characters").or(z.literal(""))
      : z.string().min(8, "Password must be at least 8 characters"),
  });
}

type UserFormData = z.infer<ReturnType<typeof buildSchema>>;

interface UserFormDialogProps {
  user: User | "new" | null;
  onClose: () => void;
}

export default function UserFormDialog({ user, onClose }: UserFormDialogProps) {
  const isEditing = user !== null && user !== "new";
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(() => buildSchema(isEditing), [isEditing]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user === "new") {
      reset({ name: "", email: "", password: "" });
      setServerError(null);
    } else if (user) {
      reset({ name: user.name, email: user.email, password: "" });
      setServerError(null);
    }
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: (data: UserFormData) =>
      isEditing
        ? api.patch(`/users/${user.id}`, {
            name: data.name,
            email: data.email,
            ...(data.password ? { password: data.password } : {}),
          })
        : api.post("/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleClose();
    },
    onError: (error: AxiosError<{ error: string }>) => {
      setServerError(
        error.response?.data?.error ?? `Failed to ${isEditing ? "update" : "create"} user. Please try again.`
      );
    },
  });

  function handleClose() {
    reset();
    setServerError(null);
    onClose();
  }

  return (
    <Dialog open={user !== null} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Create New User"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update user details. Leave password blank to keep it unchanged."
              : "Add a new agent to the system."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="user-name">Name</Label>
            <Input
              id="user-name"
              placeholder="Full name"
              aria-invalid={errors.name ? true : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              placeholder="user@example.com"
              aria-invalid={errors.email ? true : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-password">Password</Label>
            <Input
              id="user-password"
              type="password"
              placeholder={isEditing ? "Leave blank to keep unchanged" : undefined}
              aria-invalid={errors.password ? true : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="animate-spin" />}
              {mutation.isPending
                ? isEditing ? "Saving..." : "Creating..."
                : isEditing ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
