import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PLANS = [
  {
    name: "Basic",
    price: 15,
    plan: "basic" as const,
    features: [
      "Up to 3 resources/properties",
      "Basic calendar sync",
      "Double-booking prevention",
      "Email alerts",
      "1 industry template",
      "Basic reporting",
    ],
  },
  {
    name: "Standard",
    price: 39,
    plan: "standard" as const,
    popular: true,
    features: [
      "Up to 15 resources/properties",
      "Multi-platform sync",
      "AI smart pricing engine",
      "Gap-night filler",
      "Guest scoring system",
      "Advanced analytics dashboard",
      "Competitor radar",
      "3 industry templates",
      "Priority support",
    ],
  },
  {
    name: "Premium",
    price: 99,
    plan: "premium" as const,
    features: [
      "Unlimited resources/properties",
      "All 14 industry templates",
      "AI demand forecasting",
      "AI conflict auto-resolution",
      "Revenue optimization engine",
      "White-label branding",
      "API access & integrations",
      "Turnover profit analysis",
      "Multi-team collaboration",
      "Dedicated account manager",
      "Custom AI training",
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, isExpired, trialDaysLeft, isTrialing } = useSubscription();
  const { toast } = useToast();

  const handleSelect = async (plan: "basic" | "standard" | "premium") => {
    if (!user) {
      navigate("/signup");
      return;
    }
    // For now, directly activate plan (Stripe integration will be added later)
    const { error } = await supabase
      .from("subscriptions")
      .update({ plan, status: "active", current_period_start: new Date().toISOString(), current_period_end: new Date(Date.now() + 30 * 86400000).toISOString() })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plan activated!", description: `You're now on the ${plan} plan.` });
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">CalendarAI</span>
          </div>
          {user && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          )}
        </div>
      </header>

      <main className="container py-16 space-y-12">
        {isExpired && (
          <div className="max-w-2xl mx-auto bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <p className="text-sm text-foreground">Your trial has expired. Choose a plan to continue using CalendarAI.</p>
          </div>
        )}
        {isTrialing && trialDaysLeft > 0 && (
          <div className="max-w-2xl mx-auto bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
            <p className="text-sm text-foreground">You have <strong>{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}</strong> left in your free trial.</p>
          </div>
        )}

        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered scheduling for every industry. Start with a 3-day free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((p) => (
            <Card key={p.name} className={`relative flex flex-col ${p.popular ? "border-primary ring-2 ring-primary/20" : ""}`}>
              {p.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">Most Popular</Badge>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{p.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">${p.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={p.popular ? "w-full bg-gradient-primary" : "w-full"}
                  variant={p.popular ? "default" : "outline"}
                  onClick={() => handleSelect(p.plan)}
                >
                  {subscription?.plan === p.plan && subscription?.status === "active" ? "Current Plan" : "Get Started"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
