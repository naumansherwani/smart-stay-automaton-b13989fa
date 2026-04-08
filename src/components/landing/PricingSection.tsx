import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PLANS = [
  {
    name: "Basic", price: 15,
    features: ["3 resources", "Basic sync", "Double-booking prevention", "Email alerts", "1 industry", "Basic reports"],
  },
  {
    name: "Standard", price: 39, popular: true,
    features: ["15 resources", "Multi-platform sync", "AI smart pricing", "Gap-night filler", "Guest scoring", "Analytics dashboard", "Competitor radar", "3 industries", "Priority support"],
  },
  {
    name: "Premium", price: 99,
    features: ["Unlimited resources", "All 14 industries", "AI demand forecasting", "AI conflict resolution", "Revenue optimizer", "White-label", "API access", "Multi-team", "Dedicated manager", "Custom AI training"],
  },
];

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="container space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground">3-day free trial on all plans. No credit card required.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((p) => (
            <Card key={p.name} className={`relative flex flex-col ${p.popular ? "border-primary ring-2 ring-primary/20 scale-105" : ""}`}>
              {p.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">Most Popular</Badge>}
              <CardHeader className="text-center pb-2">
                <CardTitle>{p.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">${p.price}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2 flex-1 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-success shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className={p.popular ? "w-full bg-gradient-primary" : "w-full"} variant={p.popular ? "default" : "outline"} onClick={() => navigate("/signup")}>
                  Start Free Trial
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
