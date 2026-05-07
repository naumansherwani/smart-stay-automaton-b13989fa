import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

/**
 * Global listener for surface/industry guard events dispatched by src/lib/api.ts:
 *   hf:crm-premium-only → upgrade modal
 *   hf:surface-mismatch → toast + redirect to /dashboard
 *   hf:industry-mismatch → toast only
 * Mounted once in App.tsx.
 */
export default function SurfaceGuard() {
  const navigate = useNavigate();
  const [crmOpen, setCrmOpen] = useState(false);
  const [crmMessage, setCrmMessage] = useState<string | null>(null);

  useEffect(() => {
    const onCrmPremium = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      setCrmMessage(detail.message ?? null);
      setCrmOpen(true);
    };
    const onSurfaceMismatch = () => {
      toast.error("Access denied — wrong surface.");
      navigate("/dashboard");
    };
    const onIndustryMismatch = () => {
      toast.error("This feature is not available for your industry.");
    };
    window.addEventListener("hf:crm-premium-only", onCrmPremium);
    window.addEventListener("hf:surface-mismatch", onSurfaceMismatch);
    window.addEventListener("hf:industry-mismatch", onIndustryMismatch);
    return () => {
      window.removeEventListener("hf:crm-premium-only", onCrmPremium);
      window.removeEventListener("hf:surface-mismatch", onSurfaceMismatch);
      window.removeEventListener("hf:industry-mismatch", onIndustryMismatch);
    };
  }, [navigate]);

  return (
    <Dialog open={crmOpen} onOpenChange={setCrmOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Premium feature
          </DialogTitle>
          <DialogDescription>
            {crmMessage || "AI CRM requires Premium plan. Upgrade to unlock."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setCrmOpen(false)}>Not now</Button>
          <Button onClick={() => { setCrmOpen(false); navigate("/pricing"); }}>
            Upgrade to Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}