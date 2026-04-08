import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Subscription {
  id: string;
  plan: "trial" | "basic" | "standard" | "premium";
  status: "active" | "trialing" | "past_due" | "canceled" | "expired";
  trial_ends_at: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        // Check if trial expired
        const trialEnd = new Date(data.trial_ends_at);
        if (data.status === "trialing" && trialEnd < new Date()) {
          await supabase
            .from("subscriptions")
            .update({ status: "expired" })
            .eq("id", data.id);
          setSubscription({ ...data, status: "expired" } as Subscription);
        } else {
          setSubscription(data as Subscription);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const isActive = subscription?.status === "active" || subscription?.status === "trialing";
  const isTrialing = subscription?.status === "trialing";
  const isExpired = subscription?.status === "expired" || subscription?.status === "canceled";
  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0;

  return { subscription, loading, isActive, isTrialing, isExpired, trialDaysLeft };
}
