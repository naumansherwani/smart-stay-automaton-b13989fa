import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Perfect for getting started with 1 property",
    features: ["1 Property", "Basic Calendar Sync", "Double Booking Prevention", "Email Alerts", "Community Support"],
    cta: "Get Started Free",
    featured: false,
  },
  {
    name: "Professional",
    price: "$29",
    period: "/month",
    description: "For hosts managing multiple properties",
    features: ["Up to 10 Properties", "Multi-Platform Sync", "AI Smart Pricing", "Priority Alerts", "Revenue Analytics", "Priority Support"],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "$79",
    period: "/month",
    description: "For property managers and agencies",
    features: ["Unlimited Properties", "API Integrations", "Custom Pricing Rules", "Team Access", "Dedicated Support", "White-label Options"],
    cta: "Contact Sales",
    featured: false,
  },
];

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 bg-secondary/30">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground">Start free, upgrade when you're ready. No hidden fees.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative p-8 rounded-2xl border transition-all duration-300 ${plan.featured ? "bg-card shadow-elevated border-primary scale-105" : "bg-card shadow-card border-border/50 hover:shadow-elevated"}`}>
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${plan.featured ? "bg-gradient-primary hover:opacity-90" : ""}`}
                variant={plan.featured ? "default" : "outline"}
                onClick={() => navigate("/dashboard")}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
