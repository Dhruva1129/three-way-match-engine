"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MatchResult } from "@/lib/types";

export function useMatch(poNumber: string | null) {
  return useQuery({
    queryKey: ["match", poNumber],
    queryFn: () => api.get<MatchResult>(`/match/${encodeURIComponent(poNumber as string)}`),
    enabled: !!poNumber,
  });
}
