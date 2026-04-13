import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

const PLANS = [
  {
    name: "Basic",
    price: 25,
    plan: "basic" as const,
    starter: true,
    desc: "Best for individuals getting started",
    features: [
      "Includes 1 industry (workspace)",
      "Up to 100 CRM contacts",
      "Up to 50 bookings/month",
      "AI Calendar — limited",
      "Calendar sync",
      "Double-booking protection",
      "Email notifications",
      "Basic analytics",
    ],
    upgradeNote: "Upgrade to Pro to automate your business and close more clients.",
    style: "border-cyan-400/50 ring-1 ring-cyan-400/20 hover:ring-2 hover:ring-cyan-400/40 hover:shadow-[0_0_30px_hsl(186,80%,50%,0.25)] hover:border-cyan-400/70",
  },
  {
    name: "Pro",
    price: 55,
    plan: "standard" as const,
    popular: true,
    desc: "Best for growing businesses",
    features: [
      "Includes 1 industry (workspace)",
      "Unlimited contacts (CRM)",
      "Unlimited bookings",
      "All Basic features included",
      "",
      "⭐ AI scheduling",
      "⭐ AI follow-ups (automation)",
      "⭐ Client/lead scoring",
      "",
      "Advanced analytics",
      "Full AI Calendar",
      "AI Pricing (Hospitality, Airlines, Car Rental, Events, Railways)",
      "Competitor insights (Hospitality)",
      "Gap-filling engine (Hospitality)",
      "Double-booking guard",
      "Priority support",
    ],
    upgradeNote: "Automatically capture, follow up, and convert leads into paying customers with AI.",
    style: "border-primary/50 ring-2 ring-primary/30 shadow-[0_0_30px_hsl(174,62%,50%,0.2)] hover:shadow-[0_0_40px_hsl(174,62%,50%,0.35)] scale-[1.03]",
  },
  {
    name: "Premium",
    price: 110,
    plan: "premium" as const,
    desc: "For scaling businesses and advanced operations",
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
    style: "border-yellow-500/50 hover:ring-2 hover:ring-yellow-500/40 hover:shadow-[0_0_25px_hsl(45,100%,50%,0.35)]",
  },
];

const PricingSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription } = useSubscription();

  const handleClick = (plan: typeof PLANS[number]) => {
    if (!user) {
      navigate("/signup");
      return;
    }
    navigate("/pricing");
  };

  return (
    <section id="pricing" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(174,62%,50%,0.03),transparent_60%)]" />
      
      <div className="container relative z-10 space-y-14">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
            <Sparkles className="w-4 h-4" /> Simple Pricing
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground">
            One Price. <span className="text-gradient-primary">Unlimited Power.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Choose your plan. Every plan includes a 7-day free trial — no credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((p) => {
            const isCurrent = subscription?.plan === p.plan && (subscription?.status === "active" || subscription?.status === "trialing");
            return (
              <Card key={p.name} className={`relative flex flex-col bg-card/50 backdrop-blur-sm ${p.style} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
                {p.starter && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white border-0 shadow-lg px-4 py-1">
                    🚀 Great Start
                  </Badge>
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
                  <CardTitle className="text-lg font-bold">{p.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-extrabold text-foreground">${p.price}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-4">
                  <ul className="space-y-2.5 flex-1 mb-4">
                    {p.features.map((f, i) =>
                      f === "" ? (
                        <li key={`sep-${i}`} className="border-t border-border/30 my-1" />
                      ) : (
                        <li key={f} className={`flex items-start gap-2 text-sm ${f.startsWith("⭐") ? "font-semibold text-primary" : ""}`}>
                          <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                          <span className="text-foreground/80">{f}</span>
                        </li>
                      )
                    )}
                  </ul>
                  {p.upgradeNote && (
                    <p className="text-xs text-primary/80 italic mb-4 text-center">{p.upgradeNote}</p>
                  )}
                  <Button
                    className="w-full font-semibold bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)]"
                    variant="default"
                    disabled={!!isCurrent}
                    onClick={() => handleClick(p)}
                  >
                    {isCurrent ? "Current Plan" : user ? "Choose Plan" : "Start Free Trial"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center mt-2.5">
                    7-day free trial included — no credit card required
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
