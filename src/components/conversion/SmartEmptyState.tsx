import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus, Sparkles, Zap, TrendingUp, Users, CalendarPlus, BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  showUpgradeCta?: boolean;
  emotionalMessage?: string;
}

const EMOTIONAL_DEFAULTS = [
  "Don't lose potential clients — start building your pipeline today",
  "Every lead you miss is revenue left on the table",
  "Automation saves time and increases revenue",
];

export default function SmartEmptyState({
  icon: Icon = Plus,
  title,
  description = "No data yet — start by adding your first item",
  actionLabel = "Get Started",
  onAction,
  showUpgradeCta = false,
  emotionalMessage,
}: Props) {
  const navigate = useNavigate();
  const emotional = emotionalMessage || EMOTIONAL_DEFAULTS[Math.floor(Math.random() * EMOTIONAL_DEFAULTS.length)];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-6">
      {/* Animated icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center">
          <Icon className="h-10 w-10 text-primary/60" />
        </div>
      </div>

      <div className="space-y-2 max-w-sm">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {/* Emotional nudge */}
      <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-lg border border-primary/10 max-w-sm">
        <TrendingUp className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs text-primary/80 font-medium">{emotional}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {onAction && (
          <Button onClick={onAction} className="shadow-md">
            <Plus className="h-4 w-4 mr-1.5" />
            {actionLabel}
          </Button>
        )}
        {showUpgradeCta && (
          <Button
            variant="outline"
            onClick={() => navigate("/pricing")}
            className="border-primary/20 text-primary hover:bg-primary/5"
          >
            <Zap className="h-4 w-4 mr-1.5" />
            Unlock with Pro
          </Button>
        )}
      </div>
    </div>
  );
}
