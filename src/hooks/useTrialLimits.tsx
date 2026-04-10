import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useSubscription } from "./useSubscription";

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

export interface FeatureUsage {
  ai_pricing: number;
  ai_follow_ups: number;
  crm_contacts: number;
}

const DEFAULT_TRIAL: TrialLimits = {
  crmContacts: 150, bookings: -1, aiCalendar: true,
  aiPricingUses: 20, aiFollowUps: 10,
  advancedCrm: false, voiceAssistant: false, whiteLabel: false, multiTeam: false,
};

const FULL_ACCESS: TrialLimits = {
  crmContacts: -1, bookings: -1, aiCalendar: true,
  aiPricingUses: -1, aiFollowUps: -1,
  advancedCrm: true, voiceAssistant: true, whiteLabel: true, multiTeam: true,
};

const EXPIRED_LIMITS: TrialLimits = {
  crmContacts: 10, bookings: 5, aiCalendar: false,
  aiPricingUses: 0, aiFollowUps: 0,
  advancedCrm: false, voiceAssistant: false, whiteLabel: false, multiTeam: false,
};

function mapBackendLimits(rows: { feature_key: string; limit_value: number; is_unlimited: boolean }[]): TrialLimits {
  const get = (key: string) => rows.find(r => r.feature_key === key);
  return {
    crmContacts: get("crm_contacts")?.is_unlimited ? -1 : (get("crm_contacts")?.limit_value ?? 150),
    bookings: get("bookings")?.is_unlimited ? -1 : (get("bookings")?.limit_value ?? -1),
    aiCalendar: get("ai_calendar")?.is_unlimited || (get("ai_calendar")?.limit_value ?? -1) !== 0,
    aiPricingUses: get("ai_pricing")?.is_unlimited ? -1 : (get("ai_pricing")?.limit_value ?? 20),
    aiFollowUps: get("ai_follow_ups")?.is_unlimited ? -1 : (get("ai_follow_ups")?.limit_value ?? 10),
    advancedCrm: (get("advanced_crm")?.limit_value ?? 0) !== 0 || !!get("advanced_crm")?.is_unlimited,
    voiceAssistant: (get("voice_assistant")?.limit_value ?? 0) !== 0 || !!get("voice_assistant")?.is_unlimited,
    whiteLabel: (get("white_label")?.limit_value ?? 0) !== 0 || !!get("white_label")?.is_unlimited,
    multiTeam: (get("multi_team")?.limit_value ?? 0) !== 0 || !!get("multi_team")?.is_unlimited,
  };
}

export function useTrialLimits() {
  const { user } = useAuth();
  const { subscription, isTrialing, isExpired, isActive } = useSubscription();
  const [limits, setLimits] = useState<TrialLimits>(DEFAULT_TRIAL);
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
          setLimits(mapBackendLimits(data));
        } else if (isExpired) {
          setLimits(EXPIRED_LIMITS);
        } else if (isTrialing) {
          setLimits(DEFAULT_TRIAL);
        } else {
          setLimits(FULL_ACCESS);
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

  const isPaid = isActive && subscription?.plan !== "trial";

  if (isExpired) return { limits: loaded ? limits : EXPIRED_LIMITS, usage, incrementUsage, isTrial: false, isExpired: true, isPaid: false };
  if (isTrialing) return { limits: loaded ? limits : DEFAULT_TRIAL, usage, incrementUsage, isTrial: true, isExpired: false, isPaid: false };
  if (isPaid) return { limits: loaded ? limits : FULL_ACCESS, usage, incrementUsage, isTrial: false, isExpired: false, isPaid: true };

  return { limits: loaded ? limits : DEFAULT_TRIAL, usage, incrementUsage, isTrial: true, isExpired: false, isPaid: false };
}
