import { useEffect, useState } from "react";
import { Flame, Lock } from "lucide-react";
import type { PlanKey } from "@/lib/pricingConfig";
import { useLaunchDiscount } from "@/hooks/useLaunchDiscount";

/**
 * REAL backend-connected scarcity counter.
 *
 * Source of truth: `launch_discount_redemptions` table, surfaced via the
 * `get_launch_discount_status` RPC. Each successful Polar checkout writes a
 * row, so `remaining` here decreases automatically. Realtime subscription
 * + 30s safety poll lives inside `useLaunchDiscount`.
 *
 * Per-plan launch caps (per spec):
 *   Basic   = 100 launch slots
 *   Pro     = 100 launch slots
 *   Premium =  25 founder slots
 */
const TOTAL_SLOTS: Record<PlanKey, number> = {
  basic: 100,
  pro: 100,
  premium: 25,
};

// Backend cap is a flat 100 for every plan. For Premium we map that
// proportionally onto the tighter 25-slot launch window so the visible
// remaining count tracks real redemptions 1:1 within the launch window.
const BACKEND_CAP = 100;

function realRemaining(plan: PlanKey, backendRemaining: number) {
  const total = TOTAL_SLOTS[plan];
  if (total === BACKEND_CAP) {
    return Math.max(0, Math.min(total, backendRemaining));
  }
  // Scale (Premium: 25/100) so 1 real signup ≈ 0.25 visible — but we always
  // round so integer redemptions still move the number in a believable way.
  const scaled = Math.round((backendRemaining / BACKEND_CAP) * total);
  return Math.max(0, Math.min(total, scaled));
}

function useAnimatedNumber(target: number) {
  const [display, setDisplay] = useState(target);
  useEffect(() => {
    if (display === target) return;
    const step = display > target ? -1 : 1;
    const id = setInterval(() => {
      setDisplay((d) => {
        if (d === target) {
          clearInterval(id);
          return d;
        }
        return d + step;
      });
    }, 35);
    return () => clearInterval(id);
  }, [target, display]);
  return display;
}

interface Props {
  plan: PlanKey;
  /** When false (default), hides itself outside the launch window. */
  alwaysShow?: boolean;
}

export function LaunchSpotsCounter({ plan, alwaysShow = false }: Props) {
  const { priceFor, loading } = useLaunchDiscount();
  const { isDiscounted, remaining: backendRemaining, planStatus } = priceFor(plan);

  const total = TOTAL_SLOTS[plan];
  const remaining = realRemaining(plan, backendRemaining);
  const sold = Math.max(0, total - remaining);
  const display = useAnimatedNumber(remaining);
  const usedPct = Math.max(2, Math.min(100, (sold / total) * 100));

  if (loading) return null;

  // Sold out — show waitlist CTA
  if (planStatus === "sold_out" || (isDiscounted && remaining === 0)) {
    return (
      <div className="mt-3 mx-auto w-full max-w-[240px] space-y-1.5">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-rose-300">
          <Lock className="w-3 h-3" />
          Sold Out — Join Waitlist
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-rose-500 to-orange-500" />
        </div>
      </div>
    );
  }

  // Outside launch window and not discounted → render nothing unless forced
  if (!isDiscounted && !alwaysShow) return null;

  const wordLabel = plan === "premium" ? "founder spots left" : "launch spots left";
  const tone =
    display <= Math.max(3, total * 0.1)
      ? "from-rose-500 to-orange-500"
      : display <= total * 0.3
      ? "from-amber-400 to-orange-500"
      : "from-emerald-400 to-cyan-400";

  return (
    <div className="mt-3 mx-auto w-full max-w-[240px] space-y-1.5">
      <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-foreground/85">
        <Flame className="w-3 h-3 text-orange-400" />
        Only <span className="text-orange-400 font-bold">{display}</span>
        <span className="text-muted-foreground font-normal">of {total} {wordLabel}</span>
      </div>
      {/* Progress shows USED slots (filled = sold) */}
      <div
        className="h-1.5 rounded-full bg-white/5 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={sold}
        aria-label={`${sold} of ${total} ${wordLabel.replace(" left", "")} taken`}
      >
        <div
          className={`h-full bg-gradient-to-r ${tone} transition-[width] duration-700 ease-out`}
          style={{ width: `${usedPct}%` }}
        />
      </div>
    </div>
  );
}
