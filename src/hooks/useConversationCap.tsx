import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";

const SHERLOCK_USER_ID = "d089432d-5d6b-416e-bd29-abe913121d99";
const SHERLOCK_CAP = 200_000;
const DEFAULT_CAP = 25_000;
const THRESHOLD_PCT = 0.2;

function storageKey(userId: string) {
  return `hf:conv-count:${userId}`;
}

/**
 * Tracks per-user conversation/message count in localStorage.
 * Only surfaces a "remaining" message when below 20% remaining.
 */
export function useConversationCap() {
  const { user } = useAuth();
  const cap = user?.id === SHERLOCK_USER_ID ? SHERLOCK_CAP : DEFAULT_CAP;
  const [used, setUsed] = useState(0);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(storageKey(user.id));
      setUsed(raw ? parseInt(raw, 10) || 0 : 0);
    } catch { /* noop */ }
  }, [user]);

  const increment = useCallback(() => {
    if (!user) return;
    setUsed((prev) => {
      const next = prev + 1;
      try { localStorage.setItem(storageKey(user.id), String(next)); } catch { /* noop */ }
      return next;
    });
  }, [user]);

  const remaining = Math.max(0, cap - used);
  const showRemaining = remaining / cap < THRESHOLD_PCT;

  return { cap, used, remaining, showRemaining, increment };
}