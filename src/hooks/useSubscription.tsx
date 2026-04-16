import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { isTestMode } from "@/lib/paddle";

export interface Subscription {
  id: string;
  plan: "trial" | "basic" | "standard" | "premium";
  status: "active" | "trialing" | "past_due" | "canceled" | "expired";
  trial_ends_at: string;
  is_lifetime?: boolean;
  paddle_subscription_id?: string;
  paddle_customer_id?: string;
  product_id?: string;
  price_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  environment?: string;
}

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const env = isTestMode() ? "sandbox" : "live";

  const checkSubscription = useCallback(async () => {
    if (!user) return;

    try {
      // First try to find a paid subscription for this environment
      const { data: paidSub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("environment", env)
        .not("paddle_subscription_id", "is", null)
        .single();

      if (paidSub) {
        setSubscription(paidSub as Subscription);
        setLoading(false);
        return;
      }

      // Fall back to trial/lifetime (no environment filter — these aren't env-specific)
      const { data: trialSub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .is("paddle_subscription_id", null)
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
  }, [user, env]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    checkSubscription();

    const channel = supabase
      .channel("subscription-changes")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "subscriptions",
        filter: `user_id=eq.${user.id}`,
      }, () => {
        checkSubscription();
      })
      .subscribe();

    const interval = setInterval(checkSubscription, 60000);
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
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
