import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { authHeaders } from "@/lib/auth-utils";

export function useTotalSubmissions() {
  return useQuery({
    queryKey: ["analytics", "total-submissions"],
    queryFn: async () => {
      // Try to get total submissions from an analytics endpoint
      try {
        const res = await fetch("/api/analytics/total-submissions", { 
          headers: { ...authHeaders() } 
        });
        if (res.ok) {
          const data = await res.json();
          return data.total;
        }
      } catch (error) {
        console.warn("Analytics endpoint not available, calculating from forms");
      }

      // Fallback: Calculate from all forms' submissions
      const formsRes = await fetch(api.forms.list.path, { 
        headers: { ...authHeaders() } 
      });
      if (!formsRes.ok) throw new Error("Failed to fetch forms");
      
      const forms = api.forms.list.responses[200].parse(await formsRes.json());
      
      // Get submissions for each form and sum them up
      let totalSubmissions = 0;
      for (const form of forms) {
        try {
          const submissionsRes = await fetch(buildUrl(api.submissions.list.path, { formId: form.id }), { 
            headers: { ...authHeaders() } 
          });
          if (submissionsRes.ok) {
            const submissions = api.submissions.list.responses[200].parse(await submissionsRes.json());
            totalSubmissions += submissions.length;
          }
        } catch (error) {
          console.warn(`Failed to get submissions for form ${form.id}:`, error);
        }
      }
      
      return totalSubmissions;
    },
  });
}

export function useFormSubmissionsCount(formId: number) {
  return useQuery({
    queryKey: ["analytics", "form-submissions-count", formId],
    queryFn: async () => {
      const url = buildUrl(api.submissions.list.path, { formId });
      const res = await fetch(url, { headers: { ...authHeaders() } });
      if (!res.ok) throw new Error("Failed to fetch submissions");
      const submissions = api.submissions.list.responses[200].parse(await res.json());
      return submissions.length;
    },
  });
}
