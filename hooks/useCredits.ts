"use client";

import * as React from "react";
import { useAuth } from "@/components/AuthContext";

type CreditsResult = {
  credits: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Centralized credits hook:
 * - Reads userId/email from AuthContext
 * - Fetches credits from /api/me/credits
 * - Handles auth hydration timing
 * - Exposes `refresh()` to re-check credits on demand
 */
export function useCredits(): CreditsResult {
  const auth = useAuth();
  const userId = auth?.userId || null;
  const email = auth?.email || null;

  const [credits, setCredits] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadCredits = React.useCallback(async () => {
    // If there is no logged-in user yet, don't try to fetch credits
    if (!userId) {
      setCredits(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ user_id: userId });
      if (email) {
        params.set("email", email);
      }

      const res = await fetch(`/api/me/credits?${params.toString()}`, {
        method: "GET",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("useCredits: failed response", data);
        setError("Failed to load credits");
        setCredits(null);
        return;
      }

      const data = await res.json();

      if (typeof data.credits === "number") {
        setCredits(data.credits);
        setError(null);
      } else {
        console.error("useCredits: unexpected payload", data);
        setError("Failed to load credits");
        setCredits(null);
      }
    } catch (err) {
      console.error("useCredits: network error", err);
      setError("Failed to load credits");
      setCredits(null);
    } finally {
      setLoading(false);
    }
  }, [userId, email]);

  // Load credits whenever the authenticated user changes
  React.useEffect(() => {
    if (!userId) {
      // user logged out or not hydrated yet
      setCredits(null);
      setError(null);
      setLoading(false);
      return;
    }

    loadCredits();
  }, [userId, loadCredits]);

  // Allow consumers to manually refresh
  const refresh = React.useCallback(async () => {
    await loadCredits();
  }, [loadCredits]);

  return { credits, loading, error, refresh };
}
