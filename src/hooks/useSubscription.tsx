import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Subscription {
  id: string;
  plan: "trial" | "basic" | "pro" | "premium" | "enterprise";
  status: "active" | "trialing" | "past_due" | "canceled" | "expired";
  trial_ends_at: string;
  is_lifetime?: boolean;
  product_id?: string;
  price_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!user) return;

    try {
      // Payment provider being migrated — only trial / lifetime subs are active.
      const { data: trialSub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (trialSub) {
        if ((trialSub as any).is_lifetime) {
          setSubscription({ ...trialSub, status: "active", is_lifetime: true } as Subscription);
          setLoading(false);
          return;
        }

        const trialEnd = trialSub.trial_ends_at ? new Date(trialSub.trial_ends_at) : null;
        if (trialSub.status === "trialing" && trialEnd && trialEnd < new Date()) {
          setSubscription({ ...trialSub, status: "expired" } as Subscription);
        } else {
          setSubscription(trialSub as Subscription);
        }
      }
    } catch {
      // DB fetch failed
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    checkSubscription();

    // Poll for changes (realtime removed for security)
    const interval = setInterval(checkSubscription, 30000);
    return () => {
      clearInterval(interval);
    };
  }, [user, authLoading, checkSubscription]);

  const isActive = subscription?.is_lifetime || subscription?.status === "active" || subscription?.status === "trialing";
  const isTrialing = subscription?.status === "trialing" && !subscription?.is_lifetime;
  const isExpired = !subscription?.is_lifetime && (subscription?.status === "expired" || subscription?.status === "canceled");
  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0;

  return { subscription, loading, isActive, isTrialing, isExpired, trialDaysLeft, refresh: checkSubscription };
}
