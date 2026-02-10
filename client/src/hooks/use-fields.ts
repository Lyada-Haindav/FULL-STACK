import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateFieldRequest, type UpdateFieldRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { authHeaders } from "@/lib/auth-utils";

export function useCreateField() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ stepId, formId, ...data }: { stepId: number; formId: number } & CreateFieldRequest) => {
      const url = buildUrl(api.fields.create.path, { stepId });
      const res = await fetch(url, {
        method: api.fields.create.method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create field");
      return api.fields.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.forms.get.path, variables.formId] });
      toast({ title: "Field Added" });
    },
  });
}

export function useUpdateField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formId, ...data }: { id: number; formId: number } & UpdateFieldRequest) => {
      const url = buildUrl(api.fields.update.path, { id });
      const res = await fetch(url, {
        method: api.fields.update.method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update field");
      return api.fields.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.forms.get.path, variables.formId] });
    },
  });
}

export function useDeleteField() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, formId }: { id: number; formId: number }) => {
      const url = buildUrl(api.fields.delete.path, { id });
      const res = await fetch(url, { method: api.fields.delete.method, headers: { ...authHeaders() } });
      if (!res.ok) throw new Error("Failed to delete field");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.forms.get.path, variables.formId] });
      toast({ title: "Field Deleted" });
    },
  });
}

export function useReorderFields() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stepId, formId, fields }: { stepId: number; formId: number; fields: { id: number; orderIndex: number }[] }) => {
      const url = buildUrl(api.fields.reorder.path, { stepId });
      const res = await fetch(url, {
        method: api.fields.reorder.method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ fields }),
      });
      if (!res.ok) throw new Error("Failed to reorder fields");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.forms.get.path, variables.formId] });
    },
  });
}
