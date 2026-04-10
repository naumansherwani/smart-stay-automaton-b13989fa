import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Flame, Clock, AlertTriangle, XCircle, Zap } from "lucide-react";

function getTrialMessage(daysLeft: number) {
  if (daysLeft >= 6)
    return { text: `Your free trial ends in ${daysLeft} days. Start setting up your AI workflows.`, icon: Flame, urgency: "low" };
  if (daysLeft >= 4)
    return { text: `Your trial ends in ${daysLeft} days — unlock full automation before it expires.`, icon: Clock, urgency: "medium" };
  if (daysLeft >= 2)
    return { text: `Only ${daysLeft} days left — don't lose your leads and automations.`, icon: AlertTriangle, urgency: "high" };
  if (daysLeft >= 1)
    return { text: "Your trial ends today — upgrade now to keep everything running.", icon: XCircle, urgency: "critical" };
  return { text: "Your trial has ended — upgrade to restore access to your data and automations.", icon: XCircle, urgency: "expired" };
}

const urgencyStyles: Record<string, string> = {
  low: "bg-gradient-to-r from-blue-600/90 to-cyan-600/90 text-white",
  medium: "bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white",
  high: "bg-gradient-to-r from-orange-600/90 to-red-500/90 text-white",
  critical: "bg-gradient-to-r from-red-600 to-rose-600 text-white animate-pulse",
  expired: "bg-gradient-to-r from-gray-700 to-gray-900 text-white",
};

export default function TrialBanner() {
  const { isTrialing, isExpired, trialDaysLeft } = useSubscription();
  const navigate = useNavigate();

  if (!isTrialing && !isExpired) return null;

  const daysLeft = isExpired ? 0 : trialDaysLeft;
  const { text, icon: Icon, urgency } = getTrialMessage(daysLeft);
  const progress = ((7 - daysLeft) / 7) * 100;

  return (
    <div className={`sticky top-0 z-50 ${urgencyStyles[urgency]}`}>
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <Icon className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium truncate">{text}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {daysLeft > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <Progress value={progress} className="w-24 h-2 bg-white/20" />
                <span className="text-xs font-mono opacity-80">{daysLeft}d</span>
              </div>
            )}
            <Button
              size="sm"
              onClick={() => navigate("/pricing")}
              className="bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-lg text-xs px-4"
            >
              <Zap className="h-3.5 w-3.5 mr-1" />
              Upgrade Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
