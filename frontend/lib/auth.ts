"use client";

import { useEffect, useState } from "react";
import { getToken } from "./api";

/**
 * Simple client-side auth-presence check. Real verification happens on the
 * backend (every protected route requires a valid Bearer token); this just
 * gates which screens the frontend renders.
 */
export function useAuthGuard() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = getToken();
    setAuthenticated(!!token);
    setReady(true);
  }, []);

  return { ready, authenticated };
}
