import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Subscription {
  id: string;
  plan: "trial" | "basic" | "standard" | "premium";
  status: "active" | "trialing" | "past_due" | "canceled" | "expired";
  trial_ends_at: string;
  is_lifetime?: boolean;
}

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        if ((data as any).is_lifetime) {
          setSubscription({ ...data, status: "active", is_lifetime: true } as Subscription);
          setLoading(false);
          return;
        }

        const trialEnd = new Date(data.trial_ends_at);
        if (data.status === "trialing" && trialEnd < new Date()) {
          setSubscription({ ...data, status: "expired" } as Subscription);
        } else {
          setSubscription(data as Subscription);
        }

        if (data.plan !== "trial") {
          try {
            const { data: stripeData } = await supabase.functions.invoke("check-subscription");
            if (stripeData?.subscribed && stripeData?.plan) {
              setSubscription(prev => prev ? { ...prev, plan: stripeData.plan, status: "active" } : prev);
            }
          } catch {
            // Stripe check failed
          }
        }
      }
    } catch {
      // DB fetch failed
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // If auth is still loading, keep sub loading true  
    if (authLoading) return;

    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    // User available — fetch subscription
    setLoading(true);
    checkSubscription();

    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, authLoading, checkSubscription]);

  const isActive = subscription?.is_lifetime || subscription?.status === "active" || subscription?.status === "trialing";
  const isTrialing = subscription?.status === "trialing" && !subscription?.is_lifetime;
  const isExpired = !subscription?.is_lifetime && (subscription?.status === "expired" || subscription?.status === "canceled");
  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0;

  return { subscription, loading, isActive, isTrialing, isExpired, trialDaysLeft, refresh: checkSubscription };
}
