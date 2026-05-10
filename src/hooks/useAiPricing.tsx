import { useState, useCallback, useEffect } from "react";
import { replitCall } from "@/lib/replitApi";
import { supportsAutoPricing } from "@/lib/industryFeatures";
import type { IndustryType } from "@/lib/industryConfig";
import { toast } from "sonner";

export interface AiPriceSuggestion {
  resourceName: string;
  date: string;
  basePrice: number;
  suggestedPrice: number;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  factors: { name: string; impact: number }[];
}

export interface AiPricingResult {
  suggestions: AiPriceSuggestion[];
  marketInsight: string;
  recommendedAction: string;
  generatedAt: string;
}

interface UseAiPricingOptions {
  industry: IndustryType;
}

export function useAiPricing({ industry }: UseAiPricingOptions) {
  const [data, setData] = useState<AiPricingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policyVersion, setPolicyVersion] = useState(0);

  // Phase 2 — listen for policy/pricing config sync events from LiveFeed SSE
  // bridge. When founder updates rules in /settings or /founder/pricing, the
  // backend emits and the next call uses the fresh config.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      if (!detail.industry || detail.industry === industry || detail.scope === "global") {
        setPolicyVersion((v) => v + 1);
        toast.info("Pricing rules updated — refresh to apply");
      }
    };
    window.addEventListener("hf:policy-updated", handler as EventListener);
    return () => window.removeEventListener("hf:policy-updated", handler as EventListener);
  }, [industry]);

  const fetchPricing = useCallback(async (
    resources: { name: string; basePrice: number; occupancy?: number }[],
    opts?: {
      days?: number;
      competitorData?: { name: string; avgPrice: number; occupancy: number; trend: string }[];
      occupancyRate?: number;
      bookingVelocity?: number;
    }
  ) => {
    if (!supportsAutoPricing(industry)) {
      setError("AI Pricing is not available for this industry");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await replitCall<any>(
        "/pricing/suggest",
        {
          industry,
          resources,
          days: opts?.days ?? 7,
          competitorData: opts?.competitorData,
          occupancyRate: opts?.occupancyRate,
          bookingVelocity: opts?.bookingVelocity,
        },
      );

      if (fnError) throw new Error(fnError.message);
      if (fnData?.error) throw new Error(typeof fnData.error === "string" ? fnData.error : fnData.error.message);

      const result: AiPricingResult = {
        suggestions: fnData.suggestions || [],
        marketInsight: fnData.marketInsight || "",
        recommendedAction: fnData.recommendedAction || "",
        generatedAt: fnData.generatedAt || new Date().toISOString(),
      };

      setData(result);
      return result;
    } catch (e: any) {
      const msg = e?.message || "Failed to fetch AI pricing";
      setError(msg);
      if (msg.includes("Rate limit")) {
        toast.error("AI Pricing rate limited — try again in a moment");
      } else if (msg.includes("credits")) {
        toast.error("AI credits exhausted — contact admin");
      } else {
        toast.error("AI Pricing: " + msg);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [industry]);

  return { data, loading, error, fetchPricing, policyVersion };
}
