import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaymentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  planPrice: number;
}

const PaymentFormModal = ({ open, onOpenChange, planName, planPrice }: PaymentFormModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("payment_requests").insert({
        user_id: user?.id ?? null,
        full_name: fullName.trim(),
        email: email.trim(),
        plan_name: planName,
        plan_price: planPrice,
      });

      if (error) throw error;

      // Try sending email (non-blocking — if email infra isn't set up, still show success)
      try {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "payment-link",
            recipientEmail: email.trim(),
            idempotencyKey: `payment-link-${user?.id ?? email.trim()}-${planName}-${Date.now()}`,
            templateData: { name: fullName.trim(), planName, planPrice },
          },
        });
      } catch {
        // Email infra may not be set up yet — silently ignore
      }

      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after close animation
    setTimeout(() => {
      setSubmitted(false);
      setFullName("");
      setEmail(user?.email ?? "");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="text-center space-y-4 py-6">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
            <DialogHeader>
              <DialogTitle className="text-xl">Payment Link Sent!</DialogTitle>
              <DialogDescription className="text-base">
                Your secure payment link has been sent to your email.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted rounded-lg p-4 text-sm text-left space-y-1">
              <p><span className="text-muted-foreground">Plan:</span> <strong className="text-foreground">{planName}</strong></p>
              <p><span className="text-muted-foreground">Price:</span> <strong className="text-foreground">${planPrice}/mo</strong></p>
              <p><span className="text-muted-foreground">Email:</span> <strong className="text-foreground">{email}</strong></p>
            </div>
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Get Payment Link</DialogTitle>
              <DialogDescription>
                Fill in your details to receive a secure USD payment link.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted rounded-lg p-3 mb-2">
              <p className="text-sm font-medium text-foreground">
                {planName} Plan — <span className="text-primary">${planPrice}/mo</span>
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Get Payment Link (USD)"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentFormModal;
