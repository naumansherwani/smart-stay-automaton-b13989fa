import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, AlertTriangle, CreditCard, Globe, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TIERS = {
  basic: {
    price_id: "price_1TK6mV4yrCh8Ql75FqqZJ6M9",
    product_id: "prod_UIiCCNXhcZdhQU",
  },
  standard: {
    price_id: "price_1TK6ms4yrCh8Ql757Y9c5Rnk",
    product_id: "prod_UIiDaFEfKRWg02",
  },
  premium: {
    price_id: "price_1TK6oO4yrCh8Ql751jCdSVcs",
    product_id: "prod_UIiElL4g0051N0",
  },
};

const PLANS = [
  {
    name: "Basic",
    price: 25,
    plan: "basic" as const,
    starter: true,
    features: [
      "Up to 3 resources/properties",
      "Unlimited bookings",
      "Basic calendar sync",
      "Double-booking prevention",
      "Email alerts",
      "Basic reporting",
    ],
  },
  {
    name: "Pro",
    price: 55,
    plan: "standard" as const,
    popular: true,
    features: [
      "Up to 15 resources/properties",
      "Multi-platform sync",
      "AI smart pricing engine",
      "Gap-night filler",
      "Guest scoring system",
      "Advanced analytics",
      "Competitor radar",
      "AI automation tools",
      "Priority support",
    ],
  },
  {
    name: "Premium",
    price: 110,
    plan: "premium" as const,
    highlight: "🚀 Advanced AI CRM Hub",
    features: [
      "Unlimited resources",
      "⭐ Advanced AI CRM — Full Suite",
      "⭐ AI Lead Scoring & Churn Prediction",
      "⭐ Smart Tasks & Daily AI Planner",
      "⭐ Deal Pipeline & Revenue Analytics",
      "⭐ Google Workspace Sync",
      "⭐ AI Voice Assistant",
      "AI demand forecasting",
      "AI conflict auto-resolution",
      "Revenue optimization",
      "White-label branding",
      "Multi-team collaboration",
      "Dedicated account manager",
      "Custom AI training",
    ],
  },
];
const PAYONEER_EMAIL = "your-payoneer@email.com"; // Replace with actual Payoneer email

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showPayoneer, setShowPayoneer] = useState(false);
  const [selectedPlanForPayoneer, setSelectedPlanForPayoneer] = useState<typeof PLANS[0] | null>(null);

  const handleCardPayment = async (plan: "basic" | "standard" | "premium") => {
    if (!user) {
      navigate("/signup");
      return;
    }
    setLoadingPlan(plan);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: TIERS[plan].price_id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePayoneer = (plan: typeof PLANS[0]) => {
    if (!user) {
      navigate("/signup");
      return;
    }
    setSelectedPlanForPayoneer(plan);
    setShowPayoneer(true);
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><CreditCard className="w-4 h-4" /> Credit/Debit Card</span>
            <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> Payoneer (International)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((p) => {
            const isCurrent = p.plan && subscription?.plan === p.plan && subscription?.status === "active";
            return (
              <Card key={p.name} className={`relative flex flex-col transition-all duration-300 ${p.starter ? "border-cyan-400/50 hover:ring-2 hover:ring-cyan-400/40 hover:shadow-[0_0_20px_hsl(186,80%,50%,0.3)]" : p.popular ? "border-primary/50 hover:ring-2 hover:ring-primary/40 hover:shadow-[0_0_20px_hsl(174,62%,50%,0.3)]" : p.highlight ? "border-yellow-500/50 hover:ring-2 hover:ring-yellow-500/40 hover:shadow-[0_0_25px_hsl(45,100%,50%,0.35)]" : ""}`}>
                {p.starter && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white border-0 shadow-lg px-4 py-1">🚀 Great Start</Badge>
                )}
                {p.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">Most Popular</Badge>
                )}
                {p.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                    {p.highlight}
                  </div>
                )}
                {isCurrent && (
                  <Badge className="absolute -top-3 right-4 bg-success text-success-foreground">Current Plan</Badge>
                )}
                <CardHeader className="text-center pb-2 pt-8">
                  <CardTitle className="text-xl">{p.name}</CardTitle>
                  <div className="mt-4">
                    {p.price === 0 ? (
                      <span className="text-4xl font-bold text-foreground">Free</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-foreground">${p.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1 mb-6">
                    {p.features.map((f) => (
                       <li key={f} className={`flex items-start gap-2 text-sm ${f.startsWith("⭐") ? "font-semibold text-primary crm-feature-star" : ""}`}>
                         <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                         <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2">
                    <Button
                      className={`w-full ${p.popular || p.highlight ? "bg-gradient-primary" : ""}`}
                      variant={p.popular || p.highlight ? "default" : "outline"}
                      disabled={!!isCurrent || loadingPlan === p.plan}
                      onClick={() => handleCardPayment(p.plan)}
                    >
                      {loadingPlan === p.plan ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                      ) : isCurrent ? (
                        "Current Plan"
                      ) : (
                        <><CreditCard className="w-4 h-4 mr-2" /> Pay with Card</>
                      )}
                    </Button>
                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        className="w-full text-muted-foreground hover:text-foreground"
                        onClick={() => handlePayoneer(p)}
                      >
                        <Globe className="w-4 h-4 mr-2" /> Pay with Payoneer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      <Dialog open={showPayoneer} onOpenChange={setShowPayoneer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay with Payoneer</DialogTitle>
            <DialogDescription>
              For international payments via Payoneer, please follow these steps:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p className="font-medium text-foreground">Plan: {selectedPlanForPayoneer?.name}</p>
              <p className="font-medium text-foreground">Amount: ${selectedPlanForPayoneer?.price}/month</p>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Log in to your <strong>Payoneer</strong> account</li>
              <li>Send payment to: <strong className="text-foreground">{PAYONEER_EMAIL}</strong></li>
              <li>In the payment description, include your email: <strong className="text-foreground">{user?.email}</strong></li>
              <li>Send <strong className="text-foreground">${selectedPlanForPayoneer?.price} USD</strong></li>
              <li>After payment, your plan will be activated within 24 hours</li>
            </ol>
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                💡 After sending payment, email us at <strong>support@hostflowai.com</strong> with your Payoneer transaction ID for faster activation.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
