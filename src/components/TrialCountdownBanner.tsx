import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Zap, Clock, AlertTriangle, XCircle, Flame } from "lucide-react";

function getTrialMessage(daysLeft: number) {
  if (daysLeft >= 6)
    return { text: `Your free trial ends in ${daysLeft} days. Start setting up your AI workflows.`, icon: Zap, urgency: "low" as const };
  if (daysLeft >= 4)
    return { text: `Your trial ends in ${daysLeft} days — unlock full automation before it expires.`, icon: Clock, urgency: "medium" as const };
  if (daysLeft >= 2)
    return { text: `Only ${daysLeft} days left — don't lose your leads and automations.`, icon: AlertTriangle, urgency: "high" as const };
  if (daysLeft >= 1)
    return { text: "Your trial ends today — upgrade now to keep everything running.", icon: Flame, urgency: "critical" as const };
  return { text: "Your trial has ended — upgrade to restore access to your data and automations.", icon: XCircle, urgency: "expired" as const };
}

const urgencyStyles = {
  low: "from-primary/10 via-primary/5 to-transparent border-primary/20",
  medium: "from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20",
  high: "from-orange-500/15 via-orange-500/5 to-transparent border-orange-500/25",
  critical: "from-red-500/15 via-red-500/5 to-transparent border-red-500/25",
  expired: "from-red-500/20 via-red-500/10 to-transparent border-red-500/30",
};

const iconStyles = {
  low: "text-primary",
  medium: "text-amber-400",
  high: "text-orange-400",
  critical: "text-red-400 animate-pulse",
  expired: "text-red-500",
};

const timerStyles = {
  low: "bg-primary/10 text-primary border-primary/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  expired: "bg-red-500/15 text-red-400 border-red-500/25",
};

export default function TrialCountdownBanner() {
  const navigate = useNavigate();
  const { isTrialing, isExpired, trialDaysLeft, subscription } = useSubscription();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!subscription?.trial_ends_at) return;

    const update = () => {
      const diff = Math.max(0, new Date(subscription.trial_ends_at).getTime() - Date.now());
      const totalSeconds = Math.floor(diff / 1000);
      setTimeLeft({
        hours: Math.floor(totalSeconds / 3600) % 24,
        minutes: Math.floor(totalSeconds / 60) % 60,
        seconds: totalSeconds % 60,
      });
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [subscription?.trial_ends_at]);

  if (!isTrialing && !isExpired) return null;

  const { text, icon: Icon, urgency } = getTrialMessage(trialDaysLeft);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-r ${urgencyStyles[urgency]} backdrop-blur-sm`}>
      {/* Subtle animated glow for critical/expired */}
      {(urgency === "critical" || urgency === "expired") && (
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5 animate-pulse" />
      )}

      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Message */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`shrink-0 p-2 rounded-lg bg-background/50 ${iconStyles[urgency]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium text-foreground truncate sm:whitespace-normal">{text}</p>
        </div>

        {/* Timer + CTA */}
        <div className="flex items-center gap-3 shrink-0">
          {trialDaysLeft > 0 && (
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${timerStyles[urgency]}`}>
              <span>{trialDaysLeft}d</span>
              <span className="opacity-50">:</span>
              <span>{pad(timeLeft.hours)}h</span>
              <span className="opacity-50">:</span>
              <span>{pad(timeLeft.minutes)}m</span>
              <span className="opacity-50">:</span>
              <span>{pad(timeLeft.seconds)}s</span>
            </div>
          )}
          <Button
            size="sm"
            className="bg-gradient-to-r from-primary to-[hsl(217,91%,60%)] text-white font-bold shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] hover:scale-105 transition-all"
            onClick={() => navigate("/pricing")}
          >
            <Zap className="w-3.5 h-3.5 mr-1" />
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );
}
