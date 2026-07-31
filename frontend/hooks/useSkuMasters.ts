"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SkuMaster } from "@/lib/types";

export function useSkuMasters(search?: string) {
  return useQuery({
    queryKey: ["skuMasters", search || ""],
    queryFn: () => api.get<SkuMaster[]>(`/masters/sku${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  });
}

export function useCreateSkuMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<SkuMaster>) => api.post<SkuMaster>("/masters/sku", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["skuMasters"] }),
  });
}

export function useUpdateSkuMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SkuMaster> }) => api.patch<SkuMaster>(`/masters/sku/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["skuMasters"] }),
  });
}

export function useDeleteSkuMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/masters/sku/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["skuMasters"] }),
  });
}
