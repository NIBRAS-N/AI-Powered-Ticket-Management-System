import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/services/api";
import type { User } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteUserDialogProps {
  user: User | null;
  onClose: () => void;
}

export default function DeleteUserDialog({ user, onClose }: DeleteUserDialogProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.delete(`/users/${user!.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleClose();
    },
    onError: (error: AxiosError<{ error: string }>) => {
      setServerError(
        error.response?.data?.error ?? "Failed to delete user. Please try again."
      );
    },
  });

  function handleClose() {
    setServerError(null);
    mutation.reset();
    onClose();
  }

  return (
    <AlertDialog open={!!user} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            This will deactivate <span className="font-semibold">{user?.name}</span>.
            They will no longer be able to sign in.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); mutation.mutate(); }}
            disabled={mutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
