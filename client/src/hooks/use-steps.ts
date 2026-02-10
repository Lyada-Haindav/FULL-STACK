import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateStepRequest, type UpdateStepRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { authHeaders } from "@/lib/auth-utils";

export function useCreateStep() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ formId, ...data }: { formId: number } & CreateStepRequest) => {
      const url = buildUrl(api.steps.create.path, { formId });
      const res = await fetch(url, {
        method: api.steps.create.method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create step");
      return api.steps.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.forms.get.path, variables.formId] });
      toast({ title: "Step Added" });
    },
  });
}

export function useUpdateStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formId, ...data }: { id: number; formId: number } & UpdateStepRequest) => {
      const url = buildUrl(api.steps.update.path, { id });
      const res = await fetch(url, {
        method: api.steps.update.method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update step");
      return api.steps.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.forms.get.path, variables.formId] });
    },
  });
}

export function useDeleteStep() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, formId }: { id: number; formId: number }) => {
      const url = buildUrl(api.steps.delete.path, { id });
      const res = await fetch(url, { method: api.steps.delete.method, headers: { ...authHeaders() } });
      if (!res.ok) throw new Error("Failed to delete step");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.forms.get.path, variables.formId] });
      toast({ title: "Step Deleted" });
    },
  });
}

export function useReorderSteps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formId, steps }: { formId: number; steps: { id: number; orderIndex: number }[] }) => {
      const url = buildUrl(api.steps.reorder.path, { formId });
      const res = await fetch(url, {
        method: api.steps.reorder.method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ steps }),
      });
      if (!res.ok) throw new Error("Failed to reorder steps");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.forms.get.path, variables.formId] });
    },
  });
}
