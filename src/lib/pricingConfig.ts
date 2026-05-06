/**
 * Central pricing configuration for HostFlow AI.
 * Used by frontend pricing cards AND backend (mirror in edge functions).
 * Base currency: GBP (£). Polar prices created in GBP.
 */

export const LAUNCH_DISCOUNT = {
  campaignStart: "2026-04-24T00:00:00Z",
  campaignEnd: "2026-07-31T23:59:59Z",
  capPerPlan: 100,
  // 12-month price lock for users who claim during the window
  lockMonths: 12,
} as const;

export type PlanKey = "basic" | "standard" | "premium";

export interface PlanPricing {
  key: PlanKey;
  name: string;
  basePriceGBP: number;
  discountPercent: number;
}

export const PLAN_PRICING: Record<PlanKey, PlanPricing> = {
  basic:   { key: "basic",   name: "Basic",   basePriceGBP: 25,  discountPercent: 12 },
  standard:{ key: "standard",name: "Standard",basePriceGBP: 52,  discountPercent: 15 },
  premium: { key: "premium", name: "Premium", basePriceGBP: 108, discountPercent: 20 },
};

export function discountedPrice(plan: PlanKey): number {
  const p = PLAN_PRICING[plan];
  return Math.round(p.basePriceGBP * (1 - p.discountPercent / 100) * 100) / 100;
}

export type LaunchPlanStatus = "upcoming" | "active" | "sold_out" | "expired";

export interface LaunchDiscountStatus {
  campaign_start: string;
  campaign_end: string;
  now: string;
  cap_per_plan: number;
  plans: Record<PlanKey, {
    discount_percent: number;
    redeemed: number;
    remaining: number;
    status: LaunchPlanStatus;
  }>;
}