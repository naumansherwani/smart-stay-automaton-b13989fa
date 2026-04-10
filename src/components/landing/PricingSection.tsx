import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown, Flame, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PLANS = [
  {
    name: "Free Trial",
    price: 0,
    trial: true,
    desc: "Experience the full platform free",
    features: ["7 days full access", "150 CRM contacts", "Unlimited bookings", "AI Calendar full access", "AI Pricing (20 uses)", "AI follow-ups (10 uses)", "All industry dashboards", "No credit card required"],
    cta: "Start 7-Day Free Trial",
    style: "border-[hsl(38,92%,55%)]/50 hover:ring-2 hover:ring-[hsl(38,92%,55%)]/40 hover:shadow-[0_0_20px_hsl(38,92%,55%,0.3)]",
  },
  {
    name: "Basic",
    price: 25,
    starter: true,
    desc: "Best for individuals getting started",
    features: [
      "Up to 2 industries",
      "Up to 100 CRM contacts",
      "Up to 50 bookings/month",
      "AI Calendar (limited)",
      "AI Pricing (limited)",
      "Calendar sync",
      "Double-booking protection",
      "Email notifications",
      "Basic analytics",
    ],
    upgradeNote: "Upgrade to Pro to automate your business and close more clients.",
    cta: "Get Started",
    style: "border-cyan-400/50 hover:ring-2 hover:ring-cyan-400/40 hover:shadow-[0_0_20px_hsl(186,80%,50%,0.3)]",
  },
  {
    name: "Pro",
    price: 55,
    popular: true,
    desc: "Best for growing businesses",
    features: ["All Basic features +", "15 resources", "100 bookings", "Unlimited AI Calendar", "Unlimited AI Pricing", "AI scheduling", "Guest/client scoring", "Advanced analytics", "Competitor radar", "Gap-filler engine", "Priority support"],
    cta: "Get Started",
    style: "border-primary/50 hover:ring-2 hover:ring-primary/40 hover:shadow-[0_0_20px_hsl(174,62%,50%,0.3)]",
  },
  {
    name: "Premium",
    price: 110,
    desc: "For enterprises & power users",
    highlight: "🚀 Advanced AI CRM Hub",
    features: ["All Pro features +", "Unlimited resources", "Unlimited bookings", "⭐ Advanced AI CRM — Full Suite", "⭐ AI Lead Scoring & Churn Prediction", "⭐ Smart Tasks & Daily AI Planner", "⭐ Deal Pipeline & Revenue Analytics", "⭐ Google Workspace Sync", "⭐ AI Voice Assistant", "AI demand forecasting", "White-label branding", "Multi-team management", "Dedicated account manager"],
    cta: "Get Started",
    style: "border-yellow-500/50 hover:ring-2 hover:ring-yellow-500/40 hover:shadow-[0_0_25px_hsl(45,100%,50%,0.35)]",
  },
];

const PricingSection = () => {
  const navigate = useNavigate();

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
            7-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {PLANS.map((p) => (
            <Card key={p.name} className={`relative flex flex-col bg-card/50 backdrop-blur-sm ${p.style} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
              {p.trial && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[hsl(38,92%,55%)] to-[hsl(25,95%,55%)] text-white border-0 shadow-lg px-4 py-1 whitespace-nowrap">
                  <Flame className="w-3 h-3 mr-1" /> 7 Days Free
                </Badge>
              )}
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
              <CardHeader className="text-center pb-2 pt-8">
                <CardTitle className="text-lg font-bold">{p.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
                <div className="mt-4">
                  {p.price === 0 ? (
                    <span className="text-4xl font-extrabold text-foreground">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-extrabold text-foreground">${p.price}</span>
                      <span className="text-muted-foreground">/mo</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-4">
                <ul className="space-y-2.5 flex-1 mb-4">
                  {p.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${f.startsWith("⭐") ? "font-semibold text-primary crm-feature-star" : ""}`}>
                      <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>
                {p.limitations && (
                  <ul className="space-y-2 mb-4">
                    {p.limitations.map((l: string) => (
                      <li key={l} className="flex items-start gap-2 text-sm">
                        <X className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/60" />
                        <span className="text-muted-foreground/60">{l}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {p.upgradeNote && (
                  <p className="text-xs text-primary/80 italic mb-4 text-center">{p.upgradeNote}</p>
                )}
                <Button
                  className={`w-full font-semibold ${
                    p.trial
                      ? "bg-gradient-to-r from-[hsl(38,92%,55%)] to-[hsl(25,95%,55%)] text-white shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]"
                      : p.popular || p.highlight
                        ? "bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)]"
                        : ""
                  }`}
                  variant={p.trial || p.popular || p.highlight ? "default" : "outline"}
                  onClick={() => navigate("/signup")}
                >
                  {p.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
