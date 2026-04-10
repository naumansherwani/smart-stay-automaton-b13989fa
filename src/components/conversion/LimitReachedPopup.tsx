import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Zap, TrendingUp, Shield } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  feature: string;
  currentCount?: number;
  limit?: number;
}

const EMOTIONAL_TIPS = [
  { icon: TrendingUp, text: "Automation saves time and increases revenue" },
  { icon: Shield, text: "Don't lose potential clients — upgrade to keep growing" },
  { icon: Zap, text: "Pro users convert 3x more leads into paying customers" },
];

export default function LimitReachedPopup({ open, onClose, feature, currentCount, limit }: Props) {
  const navigate = useNavigate();
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setTipIdx(i => (i + 1) % EMOTIONAL_TIPS.length), 4000);
    return () => clearInterval(interval);
  }, [open]);

  const tip = EMOTIONAL_TIPS[tipIdx];
  const TipIcon = tip.icon;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-card via-card to-primary/5 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-5 py-4">
          {/* Animated warning icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl animate-pulse" />
            <div className="relative h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">
              You've reached your limit
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
              {currentCount !== undefined && limit !== undefined
                ? `You've used ${currentCount} of ${limit} ${feature}. Upgrade to Pro for unlimited access.`
                : `You've reached your ${feature} limit — upgrade to Pro to continue growing.`
              }
            </p>
          </div>

          {/* Rotating emotional tip */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 rounded-lg border border-primary/10 transition-all duration-500">
            <TipIcon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs text-primary font-medium">{tip.text}</span>
          </div>

          <div className="flex flex-col w-full gap-2 pt-2">
            <Button
              onClick={() => { onClose(); navigate("/pricing"); }}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 font-semibold"
            >
              <Zap className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground text-xs">
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
