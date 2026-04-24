import { useEffect, useState } from "react";
import { Clock, AlertCircle } from "lucide-react";
import type { PlanKey } from "@/lib/pricingConfig";
import { LAUNCH_DISCOUNT } from "@/lib/pricingConfig";
import { useLaunchDiscount } from "@/hooks/useLaunchDiscount";

function useCountdown(target: string) {
  const [diff, setDiff] = useState(() => new Date(target).getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDiff(new Date(target).getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return { days, hours, mins };
}

/**
 * Shows discount badge / sold-out / expired state for a single plan.
 * Use INSIDE pricing card.
 */
export function LaunchDiscountBadge({ plan }: { plan: PlanKey }) {
  const { status, priceFor } = useLaunchDiscount();
  const cd = useCountdown(LAUNCH_DISCOUNT.campaignEnd);
  if (!status) return null;

  const { isDiscounted, remaining, planStatus } = priceFor(plan);
  const planInfo = status.plans[plan];

  if (planStatus === "expired") {
    return (
      <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
        <AlertCircle className="w-3 h-3" /> Launch offer ended
      </div>
    );
  }
  if (planStatus === "sold_out") {
    return (
      <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
        <AlertCircle className="w-3 h-3" /> Sold out — 100/100 claimed
      </div>
    );
  }
  if (!isDiscounted) return null;

  // Floating corner badge already shows the % off — here we only show
  // the live spots-remaining + countdown to avoid duplication.
  return (
    <div className="space-y-1 text-center">
      <div className="text-[10px] text-muted-foreground">
        Only <span className="font-semibold text-foreground">{remaining}</span> of {planInfo.discount_percent && 100} spots left · price locked 12 months
      </div>
      {cd && (
        <div className="inline-flex items-center gap-1 text-[10px] text-orange-300/90">
          <Clock className="w-3 h-3" /> Ends in {cd.days}d {cd.hours}h {cd.mins}m
        </div>
      )}
    </div>
  );
}

/** Compact strikethrough-style price block — drop into card header */
export function LaunchPriceBlock({ plan, format }: { plan: PlanKey; format: (n: number) => string }) {
  const { priceFor } = useLaunchDiscount();
  const { original, final, isDiscounted } = priceFor(plan);

  if (!isDiscounted) {
    return (
      <span className="text-4xl font-extrabold text-foreground">{format(original)}</span>
    );
  }
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="text-base text-muted-foreground line-through">{format(original)}</span>
      <span className="text-4xl font-extrabold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">{format(final)}</span>
    </span>
  );
}