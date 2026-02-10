import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { authHeaders } from "@/lib/auth-utils";

type SubmitFormRequest = {
  data: Record<string, any>;
};

export function useSubmissions(formId: number) {
  return useQuery({
    queryKey: [api.submissions.list.path, formId],
    queryFn: async () => {
      const url = buildUrl(api.submissions.list.path, { formId });
      const res = await fetch(url, { headers: { ...authHeaders() } });
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return api.submissions.list.responses[200].parse(await res.json());
    },
  });
}

export function useSubmitForm() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ formId, data }: { formId: number, data: Record<string, any> }) => {
      const url = buildUrl(api.submissions.create.path, { formId });
      const res = await fetch(url, {
        method: api.submissions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) throw new Error("Failed to submit form");
      return api.submissions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: "Submitted!", description: "Your response has been recorded." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit form. Please try again.", variant: "destructive" });
    },
  });
}
