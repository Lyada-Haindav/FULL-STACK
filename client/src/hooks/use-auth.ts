import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { authHeaders, clearAuthToken, getAuthToken, setAuthToken } from "@/lib/auth-utils";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface MessageResponse {
  message: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/user", {
          headers: { ...authHeaders() },
        });

        if (!res.ok) {
          clearAuthToken();
          setUser(null);
          setIsLoading(false);
          return;
        }

        const currentUser = (await res.json()) as User;
        setUser(currentUser);
      } catch {
        clearAuthToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      clearAuthToken();
      setUser(null);
      queryClient.clear();
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error((payload as MessageResponse)?.message || "Login failed.");
      }

      return payload as AuthResponse;
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      setUser(data.user);
      queryClient.invalidateQueries();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, firstName, lastName }: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error((payload as MessageResponse)?.message || "Registration failed.");
      }

      return payload as MessageResponse;
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error((payload as MessageResponse)?.message || "Failed to resend verification email.");
      }

      return payload as MessageResponse;
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error((payload as MessageResponse)?.message || "Failed to send reset email.");
      }

      return payload as MessageResponse;
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    resendVerification: resendVerificationMutation.mutateAsync,
    isResendingVerification: resendVerificationMutation.isPending,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    isSendingForgotPassword: forgotPasswordMutation.isPending,
  };
}
