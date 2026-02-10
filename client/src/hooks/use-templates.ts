import { useQuery } from "@tanstack/react-query";
import type { Template } from "@shared/schema";
import { authHeaders } from "@/lib/auth-utils";

export function useTemplates() {
  return useQuery({
    queryKey: ["/api/templates"],
    queryFn: async (): Promise<Template[]> => {
      // Temporarily remove auth headers for debugging
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });
}
