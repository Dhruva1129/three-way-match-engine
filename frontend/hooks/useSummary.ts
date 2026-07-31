"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SummaryResult } from "@/lib/types";

export function useSummary(poNumber: string | null) {
  return useQuery({
    queryKey: ["summary", poNumber],
    queryFn: () => api.get<SummaryResult>(`/summary/${encodeURIComponent(poNumber as string)}`),
    enabled: !!poNumber,
  });
}
