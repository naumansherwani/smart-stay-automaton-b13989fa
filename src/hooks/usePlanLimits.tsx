import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyPlan, type PlanLimitsResponse, type PlanMeResponse, type PlanKey, type PlanLimitBucket } from "@/lib/api";
import { handleApiError } from "@/lib/handleApiError";
import { useAuth } from "./useAuth";

/**
 * SQL = high command.
 *
 * Plan caps live in `plan_feature_limits` (personal Supabase). Backend
 * (Hetzner runtime-schema-sync) keeps that table fresh. Frontend reads
 * directly from SQL + subscribes to Realtime so any change auto-syncs.
 *
 * Replit `/api/plan/me` is still hit (best-effort, optional) to overlay
 * live usage counters onto the SQL-derived limits. If Replit is down,
 * limits still render from SQL — UI never breaks.
 */

type FeatureRow = {
  plan: PlanKey;
  feature_key: string;
  limit_value: number | null;
  is_unlimited: boolean | null;
};

let cachedAllPlans: PlanLimitsResponse | null = null;
let inflightAllPlans: Promise<PlanLimitsResponse | null> | null = null;
let realtimeBound = false;
const subscribers = new Set<(d: PlanLimitsResponse | null) => void>();

/** Convert raw SQL rows into the nested PlanLimitBucket shape consumers expect. */
function rowsToPlans(rows: FeatureRow[]): PlanLimitsResponse {
  const plans: Record<string, any> = {};
  for (const r of rows) {
    const bucket = plans[r.plan] ?? { ai: {}, core: {}, voice: {} };
    const value = r.is_unlimited ? null : (r.limit_value ?? 0);
    switch (r.feature_key) {
      case "ai_daily_messages":
        bucket.ai.daily_messages = value;
        break;
      case "ai_hourly_fairuse":
        bucket.ai.hourly_fair_use = value;
        break;
      case "industries":
        bucket.core.industries = value;
        break;
      case "voice_assistant":
      case "ai_voice_assistant":
        bucket.voice.monthly_minutes = value;
        break;
    }
    bucket[r.feature_key] = value;
    plans[r.plan] = bucket;
  }
  return { plans: plans as Record<PlanKey, PlanLimitBucket> };
}

async function loadAllPlans(): Promise<PlanLimitsResponse | null> {
  if (cachedAllPlans) return cachedAllPlans;
  if (inflightAllPlans) return inflightAllPlans;
  inflightAllPlans = (async () => {
    const { data, error } = await supabase
      .from("plan_feature_limits")
      .select("plan, feature_key, limit_value, is_unlimited");
    if (error || !data) return null;
    cachedAllPlans = rowsToPlans(data as unknown as FeatureRow[]);
    bindRealtime();
    return cachedAllPlans;
  })().finally(() => { inflightAllPlans = null; });
  return inflightAllPlans;
}

function bindRealtime() {
  if (realtimeBound) return;
  realtimeBound = true;
  supabase
    .channel("plan_feature_limits-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "plan_feature_limits" }, async () => {
      const { data } = await supabase
        .from("plan_feature_limits")
        .select("plan, feature_key, limit_value, is_unlimited");
      if (!data) return;
      cachedAllPlans = rowsToPlans(data as unknown as FeatureRow[]);
      subscribers.forEach((cb) => cb(cachedAllPlans));
    })
    .subscribe();
}

export function usePlanLimits() {
  const { user } = useAuth();
  const [allPlans, setAllPlans] = useState<PlanLimitsResponse | null>(cachedAllPlans);
  const [me, setMe] = useState<PlanMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const onChange = (d: PlanLimitsResponse | null) => { if (!cancelled) setAllPlans(d); };
    subscribers.add(onChange);

    (async () => {
      const data = await loadAllPlans();
      if (!cancelled) setAllPlans(data);

      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      // 1. Read user's plan + status straight from SQL (source of truth).
      let sqlPlan: PlanKey | null = null;
      try {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("plan, status, trial_ends_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (sub && data) {
          sqlPlan = sub.plan as PlanKey;
          const limits = data.plans[sqlPlan] ?? {};
          if (!cancelled) setMe({
            plan: sqlPlan,
            status: sub.status as string,
            limits,
            trial_ends_at: (sub as any).trial_ends_at ?? null,
          });
        }
      } catch { /* fall through to Replit */ }

      // 2. Overlay live usage counters from Replit (best effort, optional).
      try {
        const meData = await fetchMyPlan();
        if (!cancelled && meData) setMe((prev) => prev ? { ...prev, usage: meData.usage } : meData);
      } catch (e) { handleApiError(e, { silent: true }); }
      finally { if (!cancelled) setLoading(false); }
    })();

    return () => { cancelled = true; subscribers.delete(onChange); };
  }, [user]);

  const plan: PlanKey | null = me?.plan ?? null;
  const aiDaily = me?.limits?.ai?.daily_messages ?? null;
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