import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Form } from "@shared/schema";
import { authHeaders, getAuthToken } from "@/lib/auth-utils";
import { subDays } from "date-fns";

type AnalyticsSummary = {
  totalSubmissions: number;
  totalForms: number;
  publishedForms: number;
  recentSubmissions: number;
};

export function useAnalyticsSummary() {
  const token = getAuthToken();

  return useQuery({
    queryKey: ["analytics", "summary", token],
    queryFn: async (): Promise<AnalyticsSummary> => {
      const res = await fetch("/api/analytics/summary", {
        headers: { ...authHeaders() },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch analytics summary");
      }
      return await res.json();
    },
  });
}

export function useTotalSubmissions() {
  const token = getAuthToken();

  return useQuery({
    queryKey: ["analytics", "total-submissions", token],
    queryFn: async () => {
      try {
        const res = await fetch("/api/analytics/summary", {
          headers: { ...authHeaders() }
        });
        if (res.ok) {
          const data = await res.json();
          return data.totalSubmissions ?? 0;
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

export function useFormSubmissionsCount(formId: string) {
  const token = getAuthToken();

  return useQuery({
    queryKey: ["analytics", "form-submissions-count", formId, token],
    queryFn: async () => {
      const url = buildUrl(api.submissions.list.path, { formId });
      const res = await fetch(url, { headers: { ...authHeaders() } });
      if (!res.ok) throw new Error("Failed to fetch submissions");
      const submissions = api.submissions.list.responses[200].parse(await res.json());
      return submissions.length;
    },
  });
}

type DashboardSubmissionMetrics = {
  totalSubmissions: number;
  recentSubmissions: number;
};

export function useDashboardSubmissionMetrics(forms: Form[] | undefined) {
  const token = getAuthToken();
  const formIds = useMemo(() => (forms || []).map((form) => form.id).sort(), [forms]);

  return useQuery({
    queryKey: ["analytics", "dashboard-submission-metrics", token, ...formIds],
    enabled: !!forms,
    queryFn: async (): Promise<DashboardSubmissionMetrics> => {
      if (!forms || forms.length === 0) {
        return { totalSubmissions: 0, recentSubmissions: 0 };
      }

      const cutoff = subDays(new Date(), 30);
      const responses = await Promise.all(
        forms.map(async (form) => {
          const url = buildUrl(api.submissions.list.path, { formId: form.id });
          const res = await fetch(url, { headers: { ...authHeaders() } });
          if (!res.ok) {
            throw new Error(`Failed to fetch submissions for ${form.title}`);
          }
          return api.submissions.list.responses[200].parse(await res.json());
        }),
      );

      const flattened = responses.flat();

      return {
        totalSubmissions: flattened.length,
        recentSubmissions: flattened.filter((submission) => new Date(submission.submittedAt) > cutoff).length,
      };
    },
  });
}
