import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Zap, TrendingUp, Shield, Clock, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Props {
  variant?: "inline" | "card" | "minimal";
  message?: string;
  feature?: string;
}

const NUDGE_MESSAGES = [
  { icon: TrendingUp, text: "Automation saves time and increases revenue" },
  { icon: Shield, text: "Don't lose potential clients — upgrade today" },
  { icon: Clock, text: "Save 10+ hours/week with AI-powered workflows" },
  { icon: Sparkles, text: "Pro users close 3x more deals with AI insights" },
];

export default function UpgradeNudge({ variant = "inline", message, feature }: Props) {
  const navigate = useNavigate();
  const nudge = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];
  const NudgeIcon = nudge.icon;
  const displayMessage = message || nudge.text;

  if (variant === "minimal") {
    return (
      <button
        onClick={() => navigate("/pricing")}
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors group"
      >
        <Zap className="h-3 w-3 group-hover:animate-bounce" />
        {displayMessage}
      </button>
    );
  }

  if (variant === "card") {
    return (
      <div className="rounded-xl border border-primary/15 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <NudgeIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {feature ? `Unlock ${feature}` : "Upgrade to Pro"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{displayMessage}</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => navigate("/pricing")}
          className="shrink-0 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
        >
          <Zap className="h-3.5 w-3.5 mr-1" />
          Upgrade
        </Button>
      </div>
    );
  }

  // inline
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg border border-primary/10">
      <NudgeIcon className="h-4 w-4 text-primary shrink-0" />
      <span className="text-xs text-primary/80 font-medium flex-1">{displayMessage}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => navigate("/pricing")}
        className="text-xs text-primary hover:text-primary h-7 px-2"
      >
        <Zap className="h-3 w-3 mr-1" />
        Upgrade
      </Button>
    </div>
  );
}
