import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { PartyPopper, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  type: "booking" | "contact" | "lead";
  itemName?: string;
}

const MESSAGES = {
  booking: {
    title: "Your first booking is live! 🎉",
    subtitle: "Now enable AI automation to convert leads into customers.",
    cta: "Enable AI (Pro)",
    benefits: ["Auto-confirm bookings", "Smart pricing optimization", "AI follow-up sequences"],
  },
  contact: {
    title: "First contact added! 🎉",
    subtitle: "AI can score and nurture your contacts automatically.",
    cta: "Unlock AI CRM",
    benefits: ["AI lead scoring", "Automated follow-ups", "Churn prediction"],
  },
  lead: {
    title: "Your first lead captured! 🎉",
    subtitle: "Don't lose potential clients — let AI handle the follow-up.",
    cta: "Enable AI Follow-ups",
    benefits: ["Auto email sequences", "Smart reminders", "Revenue forecasting"],
  },
};

export default function FirstSuccessMessage({ open, onClose, type, itemName }: Props) {
  const navigate = useNavigate();
  const msg = MESSAGES[type];
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-card via-card to-success/5 shadow-2xl overflow-hidden">
        {/* Confetti animation overlay */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 50}%`,
                  backgroundColor: ["hsl(var(--primary))", "hsl(var(--success))", "#fbbf24", "#f472b6", "#818cf8"][i % 5],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 2}s`,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col items-center text-center space-y-5 py-4 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-success/20 rounded-full blur-xl animate-pulse" />
            <div className="relative h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
              <PartyPopper className="h-8 w-8 text-success" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">{msg.title}</h3>
            {itemName && (
              <p className="text-sm font-medium text-primary">"{itemName}"</p>
            )}
            <p className="text-muted-foreground text-sm">{msg.subtitle}</p>
          </div>

          {/* Benefits list */}
          <div className="w-full space-y-2 text-left px-4">
            {msg.benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <span className="text-muted-foreground">{b}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col w-full gap-2 pt-2">
            <Button
              onClick={() => { onClose(); navigate("/pricing"); }}
              className="w-full bg-gradient-to-r from-success to-primary hover:from-success/90 hover:to-primary/90 shadow-lg font-semibold"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {msg.cta}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground text-xs">
              Continue with free trial
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
