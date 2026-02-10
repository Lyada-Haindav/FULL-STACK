import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Form, type FormWithStepsAndFields, type CreateFormRequest, type UpdateFormRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { authHeaders } from "@/lib/auth-utils";

export function useForms() {
  return useQuery({
    queryKey: [api.forms.list.path],
    queryFn: async () => {
      const res = await fetch(api.forms.list.path, { headers: { ...authHeaders() } });
      if (!res.ok) throw new Error("Failed to fetch forms");
      return api.forms.list.responses[200].parse(await res.json());
    },
  });
}

export function useForm(id: number) {
  return useQuery({
    queryKey: [api.forms.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.forms.get.path, { id });
      const res = await fetch(url, { headers: { ...authHeaders() } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch form");
      return api.forms.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateFormRequest) => {
      const res = await fetch(api.forms.create.path, {
        method: api.forms.create.method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.forms.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create form");
      }
      return api.forms.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.forms.list.path] });
      toast({ title: "Form created", description: "Your new form is ready to edit." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateFormRequest) => {
      const url = buildUrl(api.forms.update.path, { id });
      const res = await fetch(url, {
        method: api.forms.update.method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update form");
      return api.forms.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.forms.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.forms.get.path, data.id] });
      toast({ title: "Changes saved", description: "Form updated successfully." });
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = `/api/forms/${id}/delete`;
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Failed to delete form");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.forms.list.path] });
      toast({ title: "Form deleted", description: "The form has been permanently removed." });
    },
  });
}

export function usePublishForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.forms.publish.path, { id });
      const res = await fetch(url, { method: api.forms.publish.method, headers: { ...authHeaders() } });
      if (!res.ok) throw new Error("Failed to publish form");
      return api.forms.publish.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.forms.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.forms.get.path, data.id] });
      if (data.isPublished) {
        toast({ title: "Form Published!", description: "Your form is now live and accepting submissions." });
      } else {
        toast({ title: "Form Unpublished", description: "Your form is now hidden and no longer accepts submissions." });
      }
    },
  });
}

export function useGenerateFormAI() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (payload: { prompt: string; model?: string; complexity?: "compact" | "balanced" | "detailed"; tone?: "professional" | "friendly" | "formal" }) => {
      const res = await fetch(api.ai.generateForm.path, {
        method: api.ai.generateForm.method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("AI Generation failed");
      return api.ai.generateForm.responses[200].parse(await res.json());
    },
    onError: (error) => {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    }
  });
}

export function useCreateCompleteForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { title: string; description?: string; steps: any[] }) => {
      const res = await fetch("/api/forms/create-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create form");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.forms.list.path] });
      toast({ title: "Form created!", description: "Your form with all steps is ready." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
