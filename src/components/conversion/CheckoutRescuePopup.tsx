import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Tag, Clock } from "lucide-react";
import { logCheckoutEvent } from "@/lib/checkoutTracking";
import { useAuth } from "@/hooks/useAuth";

const DISMISS_KEY = "hf_rescue_dismissed";

interface Props {
  /** Triggered when user clicks "Use this discount" */
  onAccept: (discountCode: string) => void;
  /** Plan being viewed (for tracking) */
  plan?: string;
}

/**
 * Smart Checkout Rescue: shows an exit-intent popup with a 20% discount
 * when the user moves their mouse out of the viewport (likely about to leave).
 * Only fires once per session.
 */
export function CheckoutRescuePopup({ onAccept, plan }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const handler = (e: MouseEvent) => {
      // Mouse leaves the top of the viewport
      if (e.clientY <= 0 && !sessionStorage.getItem(DISMISS_KEY)) {
        sessionStorage.setItem(DISMISS_KEY, "1");
        setOpen(true);
        logCheckoutEvent("rescue_shown", { plan, userId: user?.id || null });
      }
    };

    // Delay attaching by 8s — don't bother brand-new visitors
    const t = setTimeout(() => document.addEventListener("mouseleave", handler), 8000);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mouseleave", handler);
    };
  }, [plan, user]);

  const handleAccept = () => {
    logCheckoutEvent("rescued", { plan, discountCode: "STAY20", userId: user?.id || null });
    setOpen(false);
    onAccept("STAY20");
  };

  const handleDismiss = (next: boolean) => {
    if (!next && open) {
      logCheckoutEvent("rescue_dismissed", { plan, userId: user?.id || null });
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-md border-primary/30">
        <DialogHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-2">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-xl">Wait — 20% off your first month</DialogTitle>
          <DialogDescription className="text-center">
            Use code <span className="font-mono font-bold text-primary">STAY20</span> at checkout.
            Limited to your current session.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-3">
          <div className="rounded-lg bg-muted/40 border border-border/50 p-3 text-center">
            <Tag className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Discount</p>
            <p className="font-bold text-sm">20% OFF</p>
          </div>
          <div className="rounded-lg bg-muted/40 border border-border/50 p-3 text-center">
            <Clock className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Expires</p>
            <p className="font-bold text-sm">This session</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleAccept} size="lg" className="w-full">
            Use this discount →
          </Button>
          <Button onClick={() => handleDismiss(false)} variant="ghost" size="sm">
            No thanks, I'll pay full price
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
