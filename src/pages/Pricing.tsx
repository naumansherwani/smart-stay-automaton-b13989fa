import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const PLANS = [
  {
    name: "Basic",
    price: 25,
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
    name: "Pro",
    price: 55,
    plan: "pro" as const,
    priceId: "pro_monthly",
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
    price: 110,
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
      "Dedicated account manager",
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();

  const handleSelect = async (plan: typeof PLANS[number]) => {
    if (!user) {
      navigate("/signup");
      return;
    }

    // If user already has a paid subscription, update it (upgrade/downgrade)
    if (subscription?.paddle_subscription_id && subscription?.plan !== plan.plan) {
      try {
        const { data, error } = await (await import("@/integrations/supabase/client")).supabase.functions.invoke("update-subscription", {
          body: {
            newPriceId: plan.priceId,
            environment: subscription.environment || "sandbox",
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const { toast } = await import("sonner");
        toast.success(`Switching to ${plan.name} plan...`);
        return;
      } catch (err: any) {
        const { toast } = await import("sonner");
        toast.error(err?.message || "Failed to update subscription");
        return;
      }
    }

    openCheckout({
      priceId: plan.priceId,
      customerEmail: user.email || undefined,
      customData: { userId: user.id },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PaymentTestModeBanner />

      <main className="container pt-24 pb-16 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered scheduling for every industry. 1 industry per plan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((p) => {
            const isCurrent = p.plan && subscription?.plan === p.plan && (subscription?.status === "active" || subscription?.status === "trialing");
            return (
              <Card key={p.name} className={`relative flex flex-col transition-all duration-300 ${p.starter ? "border-cyan-400/50 hover:ring-2 hover:ring-cyan-400/40 hover:shadow-[0_0_20px_hsl(186,80%,50%,0.3)]" : p.popular ? "border-primary/50 hover:ring-2 hover:ring-primary/40 hover:shadow-[0_0_20px_hsl(174,62%,50%,0.3)]" : p.highlight ? "border-yellow-500/50 hover:ring-2 hover:ring-yellow-500/40 hover:shadow-[0_0_25px_hsl(45,100%,50%,0.35)]" : ""}`}>
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
                    <span className="text-4xl font-bold text-foreground">${p.price}</span>
                    <span className="text-muted-foreground">/month</span>
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
                    disabled={!!isCurrent || checkoutLoading}
                    onClick={() => void handleSelect(p)}
                  >
                    {isCurrent ? "Current Plan" : checkoutLoading ? "Loading..." : user && subscription?.paddle_subscription_id ? "Switch Plan" : user ? "Subscribe Now" : "Start Free Trial"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
