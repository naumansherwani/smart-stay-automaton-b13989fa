import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LaunchDiscountBadge, LaunchPriceBlock } from "@/components/pricing/LaunchDiscountBadge";
import { LaunchAnnouncementBar, LaunchCornerBadge } from "@/components/pricing/LaunchCornerBadge";
import { useLaunchDiscount } from "@/hooks/useLaunchDiscount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Building2 } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useCurrency } from "@/hooks/useCurrency";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import EnterpriseContactDialog from "@/components/pricing/EnterpriseContactDialog";

const PLANS = [
  {
    name: "Basic",
    price: 25, // GBP base
    plan: "basic" as const,
    priceId: "basic_monthly",
    starter: true,
    features: [
      "Includes 1 industry (workspace)",
      "Up to 100 CRM contacts",
      "Up to 50 bookings/month",
      "AI Calendar — limited",
      "AI Pricing — limited",
      "Calendar sync",
      "Double-booking protection",
      "Email notifications",
      "Basic analytics",
    ],
  },
  {
    name: "Standard",
    price: 52, // GBP base
    plan: "standard" as const,
    priceId: "standard_monthly",
    popular: true,
    features: [
      "Includes 1 industry (workspace)",
      "Unlimited contacts (CRM)",
      "Unlimited bookings",
      "All Basic features included",
      "",
      "⭐ AI scheduling",
      "⭐ AI follow-ups (automation)",
      "⭐ Client/lead scoring",
      "⭐ AI Ticket Generator (Airlines, Railways, Events)",
      "",
      "Advanced analytics",
      "Competitor insights",
      "Gap-filling engine",
      "Full AI Calendar",
      "Full AI Pricing",
      "Double-booking guard",
      "Ticket email confirmation",
      "Priority support",
    ],
  },
  {
    name: "Premium",
    price: 108, // GBP base
    plan: "premium" as const,
    priceId: "premium_monthly",
    highlight: "🚀 Advanced AI CRM Hub",
    features: [
      "Includes 1 industry (workspace)",
      "Unlimited contacts (CRM)",
      "Unlimited bookings",
      "All Pro features included",
      "",
      "⭐ Advanced AI CRM (full suite)",
      "⭐ AI lead scoring & churn prediction",
      "⭐ AI automation & smart workflows",
      "⭐ AI Voice Assistant",
      "⭐ AI Ticket Generator + Email (Airlines, Railways, Events)",
      "⭐ Custom AI Training (all industries)",
      "",
      "Double-booking guard",
      "Smart tasks & AI planner",
      "Deal pipeline & revenue analytics",
      "Google Workspace integration",
      "AI demand forecasting (Hospitality, Airlines, Car Rental, Events, Railways)",
      "AI conflict resolution",
      "Revenue optimization",
      "Route optimization (Logistics, Airlines, Railways)",
      "Priority email support",
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { format, selectedCurrency } = useCurrency();
  const { priceFor } = useLaunchDiscount();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelect = async (_plan: typeof PLANS[number]) => {
    if (!user) {
      navigate("/signup");
      return;
    }
    if (!_plan.plan) return;
    setLoadingPlan(_plan.plan);
    try {
      const { data, error } = await supabase.functions.invoke("polar-create-checkout", {
        body: { plan: _plan.plan, returnUrl: window.location.origin },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("Checkout URL missing");
    } catch (e: any) {
      toast.error(e?.message || "Could not start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container pt-24 pb-16 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered scheduling for every industry. 1 industry per plan.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-sm text-muted-foreground">Currency</span>
            <CurrencySwitcher compact />
            <span className="text-xs text-muted-foreground">· Base GBP (£)</span>
          </div>
          <div className="pt-2">
            <LaunchAnnouncementBar />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {PLANS.map((p) => {
            const isCurrent = p.plan && subscription?.plan === p.plan && (subscription?.status === "active" || subscription?.status === "trialing");
            return (
              <Card key={p.name} className={`relative flex flex-col transition-all duration-300 ${p.starter ? "border-cyan-400/50 hover:ring-2 hover:ring-cyan-400/40 hover:shadow-[0_0_20px_hsl(186,80%,50%,0.3)]" : p.popular ? "border-primary/50 hover:ring-2 hover:ring-primary/40 hover:shadow-[0_0_20px_hsl(174,62%,50%,0.3)]" : p.highlight ? "border-yellow-500/50 hover:ring-2 hover:ring-yellow-500/40 hover:shadow-[0_0_25px_hsl(45,100%,50%,0.35)]" : ""}`}>
                {p.plan && <LaunchCornerBadge plan={p.plan} />}
                {p.starter && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white border-0 shadow-lg px-4 py-1">🚀 Great Start</Badge>
                )}
                {p.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white border-0 shadow-lg px-4 py-1">
                    <Crown className="w-3 h-3 mr-1" /> Most Popular
                  </Badge>
                )}
                {p.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                    {p.highlight}
                  </div>
                )}
                {isCurrent && (
                  <Badge className="absolute -top-3 right-4 bg-primary text-primary-foreground">Current Plan</Badge>
                )}
                <CardHeader className="text-center pb-2 pt-8">
                  <CardTitle className="text-xl">{p.name}</CardTitle>
                  <div className="mt-4">
                    {p.plan ? <LaunchPriceBlock plan={p.plan} format={format} /> : <span className="text-4xl font-bold text-foreground">{format(p.price)}</span>}
                    <span className="text-muted-foreground">/month</span>
                    {selectedCurrency.code !== "GBP" && (
                      <div className="text-[11px] text-muted-foreground mt-1">≈ £{p.price} GBP base</div>
                    )}
                    {p.plan && (
                      <div className="mt-3 flex justify-center"><LaunchDiscountBadge plan={p.plan} /></div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1 mb-6">
                    {p.features.map((f, i) =>
                      f === "" ? (
                        <li key={`sep-${i}`} className="border-t border-border/30 my-1" />
                      ) : (
                        <li key={f} className={`flex items-start gap-2 text-sm ${f.startsWith("⭐") ? "font-semibold text-primary" : ""}`}>
                          <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                          <span className="text-foreground">{f}</span>
                        </li>
                      )
                    )}
                  </ul>
                  <Button
                    className="w-full font-semibold bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)]"
                    disabled={!!isCurrent || loadingPlan === p.plan}
                    onClick={() => void handleSelect(p)}
                  >
                    {isCurrent ? "Current Plan" : loadingPlan === p.plan ? "Loading..." : priceFor(p.plan!).isDiscounted ? "Claim Launch Price" : "Get Started"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center mt-2.5">
                    Instant access · Cancel anytime · Secure Stripe checkout
                  </p>
                  {p.plan && (
                    <p className="text-[10px] text-pink-300/80 text-center mt-1 font-medium">
                      Offer valid until July 30 or first 100 users.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Enterprise card */}
          <Card className="relative flex flex-col border-amber-500/40 ring-1 ring-amber-500/20 hover:ring-2 hover:ring-amber-500/50 hover:shadow-[0_0_25px_hsl(38,92%,55%,0.3)] transition-all duration-300">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg px-4 py-1">
              <Building2 className="w-3 h-3 mr-1" /> Enterprise
            </Badge>
            <CardHeader className="text-center pb-2 pt-8">
              <CardTitle className="text-xl">Enterprise</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">For larger teams and custom deployments.</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-foreground">Custom</span>
                <div className="text-[11px] text-muted-foreground mt-1">Tailored pricing in GBP (£)</div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-3 flex-1 mb-6">
                {[
                  "Multi-user teams",
                  "Dedicated onboarding",
                  "Custom integrations",
                  "Priority support",
                  "Security controls",
                  "Tailored pricing",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <EnterpriseContactDialog
                trigger={
                  <Button className="w-full font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_20px_hsl(38,92%,55%,0.3)] hover:shadow-[0_0_30px_hsl(38,92%,55%,0.5)]">
                    <Building2 className="w-4 h-4 mr-2" /> Contact Sales
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
