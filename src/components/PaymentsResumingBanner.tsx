import { useState } from "react";
import { Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  variant?: "banner" | "inline";
  plan?: string;
}

export function PaymentsResumingBanner({ variant = "banner", plan }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("payment_waitlist").insert({
      email: email.trim().toLowerCase(),
      plan: plan ?? null,
      source: variant === "banner" ? "site_banner" : "pricing_card",
    });
    setLoading(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error("Could not join waitlist. Please try again.");
      return;
    }
    toast.success("You're on the list! We'll email you the moment payments resume.");
    setEmail("");
    setOpen(false);
  };

  const trigger =
    variant === "banner" ? (
      <Button size="sm" variant="secondary" className="ml-auto shrink-0">
        Join waitlist
      </Button>
    ) : (
      <Button className="w-full" variant="outline">
        Notify me when live
      </Button>
    );

  return (
    <>
      {variant === "banner" && (
        <div className="w-full bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-primary/20">
          <div className="container mx-auto px-4 py-2.5 flex items-center gap-3 text-sm">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <p className="text-foreground/90">
              <span className="font-semibold">Payments resume in 24–48 hours.</span>{" "}
              <span className="text-muted-foreground hidden sm:inline">
                We're upgrading our billing partner — join the waitlist for a launch discount.
              </span>
            </p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>{trigger}</DialogTrigger>
              <WaitlistContent
                email={email}
                setEmail={setEmail}
                onJoin={handleJoin}
                loading={loading}
              />
            </Dialog>
          </div>
        </div>
      )}
      {variant === "inline" && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>{trigger}</DialogTrigger>
          <WaitlistContent
            email={email}
            setEmail={setEmail}
            onJoin={handleJoin}
            loading={loading}
          />
        </Dialog>
      )}
    </>
  );
}

function WaitlistContent({
  email,
  setEmail,
  onJoin,
  loading,
}: {
  email: string;
  setEmail: (v: string) => void;
  onJoin: () => void;
  loading: boolean;
}) {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <DialogTitle className="text-center">Be the first to know</DialogTitle>
        <DialogDescription className="text-center">
          We're switching billing providers for a smoother experience. Drop your
          email and we'll notify you the moment checkout is live — plus you'll
          get an exclusive launch discount.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 py-2">
        <Label htmlFor="waitlist-email">Email address</Label>
        <Input
          id="waitlist-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onJoin()}
        />
      </div>
      <DialogFooter>
        <Button onClick={onJoin} disabled={loading} className="w-full">
          {loading ? "Joining…" : "Join waitlist"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}