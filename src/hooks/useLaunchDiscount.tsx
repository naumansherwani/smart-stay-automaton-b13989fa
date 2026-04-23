import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LaunchDiscountStatus, PlanKey } from "@/lib/pricingConfig";
import { PLAN_PRICING, discountedPrice } from "@/lib/pricingConfig";

export function useLaunchDiscount() {
  const [status, setStatus] = useState<LaunchDiscountStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_launch_discount_status");
    if (!error && data) setStatus(data as unknown as LaunchDiscountStatus);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000); // live update every 30s
    return () => clearInterval(id);
  }, [refresh]);

  function priceFor(plan: PlanKey): { original: number; final: number; isDiscounted: boolean; remaining: number; planStatus: string } {
    const base = PLAN_PRICING[plan].basePriceGBP;
    const planInfo = status?.plans?.[plan];
    const isActive = planInfo?.status === "active";
    return {
      original: base,
      final: isActive ? discountedPrice(plan) : base,
      isDiscounted: !!isActive,
      remaining: planInfo?.remaining ?? 0,
      planStatus: planInfo?.status ?? "active",
    };
  }

  return { status, loading, refresh, priceFor };
}