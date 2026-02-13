import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, getCurrentUser, signIn, signUp, signOut } from "@/lib/supabase";
import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser?.email) {
          const userObj: User = {
            id: currentUser.id,
            email: currentUser.email,
            user_metadata: currentUser.user_metadata,
          };
          setUser(userObj);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && session.user.email) {
          const userObj: User = {
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
          };
          setUser(userObj);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
      setUser(null);
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await signIn(email, password);
      if (error) throw error;
      return data;
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, firstName, lastName }: { 
      email: string; 
      password: string; 
      firstName?: string; 
      lastName?: string 
    }) => {
      const { data, error } = await signUp(email, password, firstName || '', lastName || '');
      if (error) throw error;
      return data;
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
  };
}
