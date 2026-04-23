import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Sparkles } from "lucide-react";

interface EnterpriseContactDialogProps {
  trigger: ReactNode;
}

const SALES_EMAIL = "naumansherwani@hostflowai.live";

export default function EnterpriseContactDialog({ trigger }: EnterpriseContactDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40">
            <Building2 className="h-6 w-6 text-amber-400" />
          </div>
          <DialogTitle className="text-center text-xl">Talk to Enterprise Sales</DialogTitle>
          <DialogDescription className="text-center">
            Tailored pricing, dedicated onboarding and custom integrations for larger teams.
            Our team will get back to you within 1 business day.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="font-medium">What to expect</span>
          </div>
          <ul className="space-y-1 text-muted-foreground text-xs leading-relaxed pl-6 list-disc">
            <li>Custom plan & volume pricing in GBP (£)</li>
            <li>Dedicated onboarding specialist</li>
            <li>SSO, advanced security & SLA options</li>
            <li>Custom integrations and AI workflows</li>
          </ul>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            asChild
            className="w-full font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-95"
          >
            <a href={`mailto:${SALES_EMAIL}?subject=Enterprise%20inquiry%20-%20HostFlow%20AI`}>
              <Mail className="w-4 h-4 mr-2" />
              Email Enterprise Sales
            </a>
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            Or write to <span className="text-foreground">{SALES_EMAIL}</span>
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
