"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * TanStack Query is the chosen state-management approach (see README for
 * rationale): the backend is the source of truth, the match/summary/
 * document endpoints are re-derived server-side on every read, and Query's
 * cache + invalidation model maps directly onto "refetch match after
 * upload" without hand-rolled global state.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
