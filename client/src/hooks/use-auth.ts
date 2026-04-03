import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authHeaders, clearAuthToken, getAuthToken, setAuthToken, TOKEN_KEY } from "@/lib/auth-utils";

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

const REQUEST_TIMEOUT_MS = 12000;

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Server is taking too long to respond. Please retry in a few seconds.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
  login: (input: { email: string; password: string }) => Promise<AuthResponse>;
  isLoggingIn: boolean;
  register: (input: { email: string; password: string; firstName?: string; lastName?: string }) => Promise<MessageResponse>;
  isRegistering: boolean;
  resendVerification: (input: { email: string }) => Promise<MessageResponse>;
  isResendingVerification: boolean;
  forgotPassword: (input: { email: string }) => Promise<MessageResponse>;
  isSendingForgotPassword: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetchWithTimeout("/api/auth/user", {
        headers: { ...authHeaders() },
      }, 8000);

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
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key !== TOKEN_KEY) {
        return;
      }
      checkUser();
    };

    window.addEventListener("storage", syncAcrossTabs);
    return () => window.removeEventListener("storage", syncAcrossTabs);
  }, [checkUser]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      clearAuthToken();
      setUser(null);
      queryClient.clear();
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetchWithTimeout("/api/auth/login", {
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
      const res = await fetchWithTimeout("/api/auth/register", {
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
      const res = await fetchWithTimeout("/api/auth/resend-verification", {
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
      const res = await fetchWithTimeout("/api/auth/forgot-password", {
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

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    resendVerification: resendVerificationMutation.mutateAsync,
    isResendingVerification: resendVerificationMutation.isPending,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    isSendingForgotPassword: forgotPasswordMutation.isPending,
  }), [
    user,
    isLoading,
    logoutMutation.mutateAsync,
    logoutMutation.isPending,
    loginMutation.mutateAsync,
    loginMutation.isPending,
    registerMutation.mutateAsync,
    registerMutation.isPending,
    resendVerificationMutation.mutateAsync,
    resendVerificationMutation.isPending,
    forgotPasswordMutation.mutateAsync,
    forgotPasswordMutation.isPending,
  ]);

  return createElement(AuthContext.Provider, { value }, children);
}
