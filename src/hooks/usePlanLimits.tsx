import { useEffect, useState } from "react";
import { fetchPlanLimits, fetchMyPlan, type PlanLimitsResponse, type PlanMeResponse, type PlanKey } from "@/lib/api";
import { handleApiError } from "@/lib/handleApiError";
import { useAuth } from "./useAuth";

/**
 * Replit is the source of truth for plan caps.
 *  - GET /api/plan/limits  → public, cached for the session
 *  - GET /api/plan/me      → JWT, the signed-in user's plan + usage
 *
 * This hook is non-blocking: UI keeps working if Replit is unreachable.
 */

let cachedAllPlans: PlanLimitsResponse | null = null;
let inflightAllPlans: Promise<PlanLimitsResponse | null> | null = null;

async function loadAllPlans(): Promise<PlanLimitsResponse | null> {
  if (cachedAllPlans) return cachedAllPlans;
  if (inflightAllPlans) return inflightAllPlans;
  inflightAllPlans = fetchPlanLimits()
    .then((d) => { cachedAllPlans = d; return d; })
    .catch((e) => { handleApiError(e, { silent: true }); return null; })
    .finally(() => { inflightAllPlans = null; });
  return inflightAllPlans;
}

export function usePlanLimits() {
  const { user } = useAuth();
  const [allPlans, setAllPlans] = useState<PlanLimitsResponse | null>(cachedAllPlans);
  const [me, setMe] = useState<PlanMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await loadAllPlans();
      if (!cancelled) setAllPlans(data);
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const meData = await fetchMyPlan();
        if (!cancelled) setMe(meData);
      } catch (e) { handleApiError(e, { silent: true }); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const plan: PlanKey | null = me?.plan ?? null;
  const aiDaily = me?.limits?.ai?.daily_messages ?? null;     // null = unlimited
  const aiHourly = me?.limits?.ai?.hourly_fair_use ?? null;
  const industries = me?.limits?.core?.industries ?? null;
  const voiceMinutes = me?.limits?.voice?.monthly_minutes ?? null;

  return {
    loading,
    allPlans,
    me,
    plan,
    aiDaily,
    aiHourly,
    industries,
    voiceMinutes,
  };
}