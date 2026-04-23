import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useSubscription } from "@/hooks/useSubscription";

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const checkoutId = params.get("checkout_id");
  const { refresh } = useSubscription();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // Webhook may take a few seconds — poll subscription status
    const id = setInterval(() => {
      refresh();
      setSeconds(s => s + 1);
    }, 2000);
    const stop = setTimeout(() => clearInterval(id), 30_000);
    return () => { clearInterval(id); clearTimeout(stop); };
  }, [refresh]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-28 pb-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border border-emerald-400/40">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Welcome aboard! 🎉
          </h1>
          <p className="text-lg text-muted-foreground">
            Your payment was successful. Your HostFlow AI plan is being activated now.
          </p>

          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 text-left space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="w-4 h-4 text-primary" /> What's next?
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 pl-6 list-disc">
              <li>Your subscription will appear in your dashboard within seconds.</li>
              <li>If you claimed the launch discount, your discounted price is locked in for 12 months.</li>
              <li>A receipt is being emailed to you by Polar (our billing partner).</li>
              <li>You can manage or cancel anytime from <Link to="/settings" className="text-primary hover:underline">Settings</Link>.</li>
            </ul>
          </div>

          {seconds < 10 && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Activating your plan…
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Button asChild className="bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/onboarding">Start Onboarding</Link>
            </Button>
          </div>

          {checkoutId && (
            <p className="text-[11px] text-muted-foreground/60 pt-4">
              Checkout ref: {checkoutId}
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}