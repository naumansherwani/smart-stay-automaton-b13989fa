import { Sparkles, Crown, Flame } from "lucide-react";
import type { PlanKey } from "@/lib/pricingConfig";
import { useLaunchDiscount } from "@/hooks/useLaunchDiscount";

type Variant = "basic" | "pro" | "premium";

/**
 * Floating corner ribbon for pricing cards.
 * - Basic: top-right small cyan badge
 * - Pro: top-center premium glowing badge
 * - Premium: top-right gold badge
 * Auto-hides if discount is sold out / expired (the inline badge handles those states).
 */
export function LaunchCornerBadge({ plan }: { plan: PlanKey }) {
  const { priceFor } = useLaunchDiscount();
  const { isDiscounted, planStatus } = priceFor(plan);
  if (!isDiscounted || planStatus !== "active") return null;

  const variant = plan as Variant;

  if (variant === "pro") {
    // Top-center premium glowing — sits ABOVE the existing "Most Popular" badge slot
    // The PricingSection already places "Most Popular" at -top-3. We sit at -top-9.
    return (
      <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 z-20 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-500 blur-md opacity-70 animate-pulse" />
          <div className="relative inline-flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-1.5 rounded-full text-white bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-500 border border-white/20 shadow-[0_4px_20px_hsl(330,80%,60%,0.5)] whitespace-nowrap">
            <Flame className="w-3.5 h-3.5" />
            15% OFF • Most Popular Launch Deal
          </div>
        </div>
      </div>
    );
  }

  if (variant === "premium") {
    return (
      <div className="pointer-events-none absolute -top-3 -right-2 z-20 rotate-3 animate-fade-in">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg text-white bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 border border-yellow-300/40 shadow-[0_4px_18px_hsl(45,100%,55%,0.55)] whitespace-nowrap">
          <Crown className="w-3 h-3" />
          20% OFF • Best Value
          <span className="opacity-90 hidden sm:inline">• Limited 100</span>
        </div>
      </div>
    );
  }

  // basic
  return (
    <div className="pointer-events-none absolute -top-3 -right-2 z-20 rotate-3 animate-fade-in">
      <div className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg text-white bg-gradient-to-br from-cyan-400 to-sky-500 border border-cyan-300/40 shadow-[0_4px_18px_hsl(186,80%,50%,0.5)] whitespace-nowrap">
        <Sparkles className="w-3 h-3" />
        12% OFF • First 100
      </div>
    </div>
  );
}

/**
 * Slim announcement bar — shown ONCE under the pricing section heading.
 * Auto-hides when the campaign is fully expired across all plans.
 */
export function LaunchAnnouncementBar() {
  const { status } = useLaunchDiscount();
  if (!status) return null;
  const anyActive = (Object.values(status.plans) as Array<{ status: string }>).some(p => p.status === "active");
  if (!anyActive) return null;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="relative rounded-full overflow-hidden border border-pink-400/30 bg-gradient-to-r from-pink-500/10 via-fuchsia-500/10 to-orange-500/10 backdrop-blur-sm shadow-[0_0_24px_hsl(330,80%,60%,0.18)]">
        <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,hsl(330,80%,70%,0.18)_50%,transparent_70%)] bg-[length:200%_100%] animate-[shimmer_3.5s_linear_infinite] pointer-events-none" />
        <div className="relative flex items-center justify-center gap-2 px-4 py-2 text-center">
          <Flame className="w-4 h-4 text-pink-300 shrink-0" />
          <p className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-pink-200 via-fuchsia-200 to-orange-200 bg-clip-text text-transparent">
            🚀 Launch Offer: First 100 Users Only — Up to 20% Off for 12 Months
          </p>
        </div>
      </div>
    </div>
  );
}