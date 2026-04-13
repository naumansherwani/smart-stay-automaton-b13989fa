import { ReactNode } from "react";
import { useTrialLimits, type FeatureKey } from "@/hooks/useTrialLimits";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  /** What to show when locked. Defaults to a built-in lock overlay. */
  fallback?: ReactNode;
  /** If true, renders nothing when locked instead of a fallback */
  hideWhenLocked?: boolean;
}

/**
 * Wraps a feature component and shows a lock/upgrade prompt if the user's plan
 * doesn't include access to that feature.
 */
export default function FeatureGate({ feature, children, fallback, hideWhenLocked }: FeatureGateProps) {
  const { canAccess, requiredPlan } = useTrialLimits();
  const navigate = useNavigate();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  if (hideWhenLocked) return null;

  if (fallback) return <>{fallback}</>;

  const planName = requiredPlan(feature);

  return (
    <div className="relative rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[120px]">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {planName} Plan Feature
        </p>
        <p className="text-xs text-muted-foreground">
          Upgrade to {planName} to unlock this feature
        </p>
      </div>
      <Button
        size="sm"
        onClick={() => navigate("/pricing")}
        className="bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white"
      >
        View Plans
      </Button>
    </div>
  );
}
