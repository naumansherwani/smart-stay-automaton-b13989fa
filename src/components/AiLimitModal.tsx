import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

/**
 * Listens for `hf:ai-limit` (dispatched by src/lib/api.ts on 429 AI_LIMIT_REACHED)
 * and shows an upgrade modal. Mounted once globally in App.tsx.
 */
export default function AiLimitModal() {
  const [open, setOpen] = useState(false);
  const [upgradeTo, setUpgradeTo] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      setUpgradeTo(detail.upgrade_to ?? null);
      setMessage(detail.message ?? null);
      setOpen(true);
    };
    window.addEventListener("hf:ai-limit", handler);
    return () => window.removeEventListener("hf:ai-limit", handler);
  }, []);

  const planLabel = upgradeTo ? upgradeTo.charAt(0).toUpperCase() + upgradeTo.slice(1) : "a higher plan";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            You've hit your AI limit
          </DialogTitle>
          <DialogDescription>
            {message || `You've used your AI message allowance. Upgrade to ${planLabel} to keep going without interruption.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Not now</Button>
          <Button onClick={() => { setOpen(false); navigate("/pricing"); }}>
            Upgrade to {planLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}