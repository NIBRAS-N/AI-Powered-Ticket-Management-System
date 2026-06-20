import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuthContext } from "../context/AuthContext";
import type { AuthSession, LoginCredentials } from "../types";

export function useAuth() {
  const context = useAuthContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await api.post<AuthSession>(
        "/auth/sign-in/email",
        credentials,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      await api.post("/auth/sign-out");
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth", "session"], null);
      navigate("/login", { replace: true });
    },
  });

  return {
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    login,
    logout,
  };
}
