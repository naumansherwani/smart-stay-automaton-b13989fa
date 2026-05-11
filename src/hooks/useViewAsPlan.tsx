import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export type ViewAsPlan = "basic" | "standard" | "premium" | null;

const STORAGE_KEY = "hostflow:view-as-plan";

function readStored(): ViewAsPlan {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "basic" || v === "standard" || v === "premium") return v;
  return null;
}

// Module-level subscribers so multiple components stay in sync without a global provider.
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach(fn => fn());
}

/**
 * View-As-Plan: admin-only UI override that makes the app render as if the
 * logged-in user were on the chosen plan. Does NOT change real subscription/billing.
 * Returns:
 *   plan: current override (null = no override, real plan applies)
 *   setPlan: change override (persists in localStorage, defaults to "premium" if you pass "premium")
 *   clear: remove override (return to real Owner/Admin view)
 *   isAdmin: whether current user can use this switcher at all
 */
export function useViewAsPlan() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [plan, setPlanState] = useState<ViewAsPlan>(() => readStored());

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  useEffect(() => {
    const fn = () => setPlanState(readStored());
    listeners.add(fn);
    window.addEventListener("storage", fn);
    return () => {
      listeners.delete(fn);
      window.removeEventListener("storage", fn);
    };
  }, []);

  const setPlan = useCallback((next: ViewAsPlan) => {
    if (next === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, next);
    }
    setPlanState(next);
    emit();
  }, []);

  const clear = useCallback(() => setPlan(null), [setPlan]);

  // Only return an active override when admin — guarantees regular users can never trip this.
  const effectiveOverride = isAdmin ? plan : null;

  return { plan: effectiveOverride, rawPlan: plan, setPlan, clear, isAdmin };
}