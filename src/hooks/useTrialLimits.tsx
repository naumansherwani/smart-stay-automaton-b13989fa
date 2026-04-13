import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useSubscription } from "./useSubscription";

// All feature keys that map to pricing card features
export type FeatureKey =
  | "crm_contacts"
  | "bookings"
  | "ai_calendar"
  | "ai_pricing"
  | "ai_scheduling"
  | "ai_followups"
  | "lead_scoring"
  | "advanced_analytics"
  | "basic_analytics"
  | "competitor_insights"
  | "gap_filling"
  | "calendar_sync"
  | "double_booking_protection"
  | "email_notifications"
  | "advanced_crm"
  | "voice_assistant"
  | "ai_voice_assistant"
  | "white_label"
  | "multi_team"
  | "custom_ai_training"
  | "smart_tasks"
  | "deal_pipeline"
  | "google_workspace"
  | "ai_demand_forecasting"
  | "ai_conflict_resolution"
  | "revenue_optimization"
  | "dynamic_route_optimization"
  | "industries";

interface FeatureLimit {
  limit_value: number;
  is_unlimited: boolean;
}

export interface FeatureUsage {
  ai_pricing: number;
  ai_follow_ups: number;
  crm_contacts: number;
}

// Legacy interface for backward compatibility
export interface TrialLimits {
  crmContacts: number;
  bookings: number;
  aiCalendar: boolean;
  aiPricingUses: number;
  aiFollowUps: number;
  advancedCrm: boolean;
  voiceAssistant: boolean;
  whiteLabel: boolean;
  multiTeam: boolean;
}

export function useTrialLimits() {
  const { user } = useAuth();
  const { subscription, isTrialing, isExpired, isActive } = useSubscription();
  const [featureLimits, setFeatureLimits] = useState<Record<string, FeatureLimit>>({});
  const [usage, setUsage] = useState<FeatureUsage>({ ai_pricing: 0, ai_follow_ups: 0, crm_contacts: 0 });
  const [loaded, setLoaded] = useState(false);

  // Fetch limits from backend based on plan
  useEffect(() => {
    if (!subscription) return;
    const plan = subscription.plan;

    supabase
      .from("plan_feature_limits")
      .select("feature_key, limit_value, is_unlimited")
      .eq("plan", plan)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const map: Record<string, FeatureLimit> = {};
          data.forEach(r => {
            map[r.feature_key] = { limit_value: r.limit_value, is_unlimited: r.is_unlimited };
          });
          setFeatureLimits(map);
        }
        setLoaded(true);
      });
  }, [subscription, isTrialing, isExpired]);

  // Fetch usage from backend
  useEffect(() => {
    if (!user) return;

    supabase
      .from("feature_usage")
      .select("feature_key, usage_count")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          const u: FeatureUsage = { ai_pricing: 0, ai_follow_ups: 0, crm_contacts: 0 };
          data.forEach(r => {
            if (r.feature_key in u) {
              (u as any)[r.feature_key] = r.usage_count;
            }
          });
          setUsage(u);
        }
      });
  }, [user]);

  // Increment usage helper
  const incrementUsage = useCallback(async (featureKey: keyof FeatureUsage) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from("feature_usage")
      .select("id, usage_count")
      .eq("user_id", user.id)
      .eq("feature_key", featureKey)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("feature_usage")
        .update({ usage_count: existing.usage_count + 1, last_used_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("feature_usage")
        .insert({ user_id: user.id, feature_key: featureKey, usage_count: 1 });
    }

    setUsage(prev => ({ ...prev, [featureKey]: (prev[featureKey] || 0) + 1 }));
  }, [user]);

  /**
   * Check if a feature is accessible on the current plan.
   * - is_unlimited = true → allowed
   * - limit_value > 0 → allowed (with limits)
   * - limit_value = 0 → locked
   * - not found in DB → locked for trial/expired, allowed for paid
   */
  const canAccess = useCallback((key: FeatureKey): boolean => {
    if (subscription?.is_lifetime) return true;
    if (isExpired) return false;

    const feat = featureLimits[key];
    if (!feat) {
      // If no DB row exists, default: paid plans get access, trial doesn't for premium features
      const isPaid = isActive && subscription?.plan !== "trial";
      return isPaid;
    }
    return feat.is_unlimited || feat.limit_value > 0;
  }, [featureLimits, subscription, isActive, isExpired]);

  /**
   * Get the numeric limit for a feature (-1 = unlimited, 0 = locked)
   */
  const getLimit = useCallback((key: FeatureKey): number => {
    if (subscription?.is_lifetime) return -1;
    if (isExpired) return 0;

    const feat = featureLimits[key];
    if (!feat) return isActive && subscription?.plan !== "trial" ? -1 : 0;
    return feat.is_unlimited ? -1 : feat.limit_value;
  }, [featureLimits, subscription, isActive, isExpired]);

  /**
   * Get the minimum required plan name for a feature
   */
  const requiredPlan = useCallback((key: FeatureKey): string => {
    // Map features to their minimum plan
    const proFeatures: FeatureKey[] = [
      "ai_scheduling", "ai_followups", "lead_scoring", "advanced_analytics",
      "competitor_insights", "gap_filling",
    ];
    const premiumFeatures: FeatureKey[] = [
      "advanced_crm", "voice_assistant", "ai_voice_assistant", "white_label",
      "multi_team", "custom_ai_training", "smart_tasks", "deal_pipeline",
      "google_workspace", "ai_demand_forecasting", "ai_conflict_resolution",
      "revenue_optimization", "dynamic_route_optimization",
    ];
    if (premiumFeatures.includes(key)) return "Premium";
    if (proFeatures.includes(key)) return "Pro";
    return "Basic";
  }, []);

  // Legacy limits object for backward compatibility
  const limits = useMemo<TrialLimits>(() => ({
    crmContacts: getLimit("crm_contacts") === 0 ? 10 : getLimit("crm_contacts"),
    bookings: getLimit("bookings"),
    aiCalendar: canAccess("ai_calendar"),
    aiPricingUses: getLimit("ai_pricing"),
    aiFollowUps: getLimit("ai_followups") === 0 ? getLimit("ai_follow_ups" as any) : getLimit("ai_followups"),
    advancedCrm: canAccess("advanced_crm"),
    voiceAssistant: canAccess("voice_assistant") || canAccess("ai_voice_assistant"),
    whiteLabel: canAccess("white_label"),
    multiTeam: canAccess("multi_team"),
  }), [canAccess, getLimit]);

  const isPaid = isActive && subscription?.plan !== "trial";

  return {
    limits,
    usage,
    incrementUsage,
    isTrial: isTrialing ?? false,
    isExpired: isExpired ?? false,
    isPaid: isPaid ?? false,
    // New API
    canAccess,
    getLimit,
    requiredPlan,
    loaded,
    plan: subscription?.plan ?? "trial",
  };
}
