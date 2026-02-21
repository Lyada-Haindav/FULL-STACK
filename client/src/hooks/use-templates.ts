import { useQuery } from "@tanstack/react-query";
import type { Template } from "@shared/schema";
import { authHeaders } from "@/lib/auth-utils";

export function useTemplates() {
  return useQuery({
    queryKey: ["/api/templates"],
    queryFn: async (): Promise<Template[]> => {
      const res = await fetch("/api/templates", { headers: { ...authHeaders() } });
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });
}
