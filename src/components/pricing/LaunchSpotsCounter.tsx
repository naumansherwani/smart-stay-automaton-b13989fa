import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import type { PlanKey } from "@/lib/pricingConfig";
import { useLaunchDiscount } from "@/hooks/useLaunchDiscount";

/**
 * Per-plan visual cap for the public landing page.
 * Real backend cap is 100 (see launch_discount_redemptions),
 * but we surface a tighter visual cap per tier so scarcity
 * feels real and converts. When real redemptions reduce
 * `remaining`, the displayed value follows.
 */
const VISUAL_CAP: Record<PlanKey, number> = {
  basic: 100,
  pro: 50,
  premium: 25,
};

function clampToVisual(remaining: number, cap: number, backendCap = 100) {
  // Map backend remaining (0–100) onto our visual cap proportionally,
  // then clamp so we never show more spots than the visual cap.
  const proportional = Math.round((remaining / backendCap) * cap);
  return Math.max(0, Math.min(cap, proportional));
}

/** Clean, single-line scarcity counter for use inside a pricing card. */
export function LaunchSpotsCounter({ plan }: { plan: PlanKey }) {
  const { priceFor } = useLaunchDiscount();
  const { isDiscounted, remaining, planStatus } = priceFor(plan);

  // Smooth animated count so updates feel premium, not jumpy.
  const target = clampToVisual(remaining, VISUAL_CAP[plan]);
  const [display, setDisplay] = useState(target);
  useEffect(() => {
    if (display === target) return;
    const step = display > target ? -1 : 1;
    const id = setInterval(() => {
      setDisplay((d) => {
        if (d === target) { clearInterval(id); return d; }
        return d + step;
      });
    }, 40);
    return () => clearInterval(id);
  }, [target, display]);

  if (planStatus === "expired" || planStatus === "sold_out" || !isDiscounted) return null;

  const cap = VISUAL_CAP[plan];
  const pct = Math.max(4, Math.min(100, (display / cap) * 100));
  const tone =
    display <= 5 ? "from-rose-500 to-orange-500"
    : display <= 20 ? "from-amber-400 to-orange-500"
    : "from-emerald-400 to-cyan-400";

  return (
    <div className="mt-3 mx-auto w-full max-w-[220px] space-y-1.5">
      <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-foreground/85">
        <Flame className="w-3 h-3 text-orange-400" />
        Only <span className="text-orange-400 font-bold">{display}</span>
        <span className="text-muted-foreground font-normal">of {cap} launch spots left</span>
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${tone} transition-[width] duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}