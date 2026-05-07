import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown, ShieldCheck, Globe2, Building2, Star, Mic, Zap, Users, Languages, Briefcase, Loader2, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import EnterpriseContactDialog from "@/components/pricing/EnterpriseContactDialog";
import {
  fetchPaymentProducts,
  createPaymentsCheckout,
  type PaymentProduct,
  type PaymentsPlanKey,
} from "@/lib/api";
import { handleApiError } from "@/lib/handleApiError";

type PlanMeta = {
  plan: PaymentsPlanKey;
  starter?: boolean;
  popular?: boolean;
  highlight?: string;
  desc: string;
  features: string[];
  upgradeNote?: string;
  style: string;
};

const PLAN_META: Record<PaymentsPlanKey, PlanMeta> = {
  basic: {
    plan: "basic",
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
  pro: {
    plan: "pro",
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
      "⭐ AI Ticket Generator (Airlines, Railways, Events)",
      "",
      "Advanced analytics",
      "Full AI Calendar",
      "AI Pricing (Hospitality, Airlines, Car Rental, Events, Railways)",
      "Competitor insights (Hospitality)",
      "Gap-filling engine (Hospitality)",
      "Double-booking guard",
      "Ticket email confirmation",
      "Priority support",
    ],
    upgradeNote: "Automatically capture, follow up, and convert leads into paying customers with AI.",
    style: "border-primary/50 ring-2 ring-primary/30 shadow-[0_0_30px_hsl(174,62%,50%,0.2)] hover:shadow-[0_0_40px_hsl(174,62%,50%,0.35)] scale-[1.03]",
  },
  premium: {
    plan: "premium",
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
    style: "border-yellow-500/50 hover:ring-2 hover:ring-yellow-500/40 hover:shadow-[0_0_25px_hsl(45,100%,50%,0.35)]",
  },
};

const CURRENCY_SYMBOL: Record<string, string> = { gbp: "£", usd: "$", eur: "€" };
const formatMoney = (pence: number, currency: string) => {
  const symbol = CURRENCY_SYMBOL[currency.toLowerCase()] ?? currency.toUpperCase() + " ";
  return `${symbol}${(pence / 100).toFixed(2)}`;
};

const PLAN_ORDER: PaymentsPlanKey[] = ["basic", "pro", "premium"];

const PricingSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [products, setProducts] = useState<PaymentProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPaymentProducts()
      .then((d) => { if (!cancelled) setProducts(d.products); })
      .catch((e) => { handleApiError(e, { silent: true }); });
    return () => { cancelled = true; };
  }, []);

  const productByPlan = useMemo(() => {
    const m: Partial<Record<PaymentsPlanKey, PaymentProduct>> = {};
    products?.forEach((p) => { m[p.plan] = p; });
    return m;
  }, [products]);

  const handleClick = async (product: PaymentProduct | undefined, plan: PaymentsPlanKey) => {
    if (!user) {
      navigate("/signup");
      return;
    }
    if (!product) return;
    setLoadingPlan(plan);
    try {
      const data = await createPaymentsCheckout({
        product_id: product.checkout_product_id,
        success_url: `${window.location.origin}/dashboard?payment=success`,
        cancel_url: `${window.location.origin}/pricing?payment=cancelled`,
      });
      window.location.href = data.checkout_url;
    } catch (e) {
      handleApiError(e);
    } finally {
      setLoadingPlan(null);
    }
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

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-400/30 backdrop-blur-sm shadow-[0_0_20px_hsl(160,84%,45%,0.15)]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                Secure global checkout
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-400/30 backdrop-blur-sm shadow-[0_0_20px_hsl(217,91%,60%,0.15)]">
              <Globe2 className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-300 to-violet-300 bg-clip-text text-transparent">
                🌍 Trusted global payments · 256-bit SSL
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {PLAN_ORDER.map((planKey) => {
            const p = PLAN_META[planKey];
            const product = productByPlan[planKey];
            const isCurrent = subscription?.plan === planKey && (subscription?.status === "active" || subscription?.status === "trialing");
            const launchActive = !!product?.launch_active && product.active_price < product.regular_price;
            return (
              <Card key={planKey} className={`relative flex flex-col bg-card/50 backdrop-blur-sm ${p.style} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
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
                  <CardTitle className="text-lg font-bold">{product?.name ?? planKey.charAt(0).toUpperCase() + planKey.slice(1)}</CardTitle>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                  <div className="mt-4">
                    {!product ? (
                      <div className="h-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                    ) : (
                      <span className="inline-flex items-baseline gap-2">
                        {launchActive && (
                          <span className="text-base text-muted-foreground line-through">{formatMoney(product.regular_price, product.currency)}</span>
                        )}
                        <span className="text-4xl font-extrabold text-foreground">{formatMoney(product.active_price, product.currency)}</span>
                      </span>
                    )}
                    <span className="text-muted-foreground">/mo</span>
                    {launchActive && (
                      <div className="mt-3 flex justify-center">
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30">
                          <Flame className="w-3 h-3" /> Launch Offer
                        </div>
                      </div>
                    )}
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
                    disabled={!!isCurrent || !product || loadingPlan === planKey}
                    onClick={() => void handleClick(product, planKey)}
                  >
                    {isCurrent
                      ? "Current Plan"
                      : loadingPlan === planKey
                      ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</span>
                      : launchActive ? "Claim Launch Price" : "Subscribe"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center mt-2.5">
                    Instant access · Cancel anytime · Secure checkout
                  </p>
                </CardContent>
              </Card>
            );
          })}

          {/* Enterprise card */}
          <Card className="relative flex flex-col bg-gradient-to-b from-card/70 to-card/40 backdrop-blur-sm border-amber-500/50 ring-2 ring-amber-500/30 shadow-[0_0_40px_hsl(38,92%,55%,0.2)] hover:ring-amber-500/60 hover:shadow-[0_0_50px_hsl(38,92%,55%,0.4)] hover:border-amber-500/70 transition-all duration-300 hover:-translate-y-1">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white border-0 shadow-[0_0_20px_hsl(38,92%,55%,0.6)] px-4 py-1">
              <Star className="w-3 h-3 mr-1 fill-white" /> Enterprise · Global
            </Badge>
            <CardHeader className="text-center pb-2 pt-8">
              <CardTitle className="text-lg font-bold">Enterprise</CardTitle>
              <p className="text-xs text-muted-foreground">Built for multinational teams &amp; growing global brands.</p>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-foreground">Custom</span>
                <div className="text-[11px] text-muted-foreground mt-1">Tailored pricing · GBP (£) default · USD/EUR/AED on request</div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pt-4">
              <ul className="space-y-2.5 flex-1 mb-4">
                {[
                  "Multi-region, multi-user teams",
                  "Dedicated success manager",
                  "Custom AI workflows & integrations",
                  "SSO, SAML & enterprise-grade security",
                  "99.9% uptime SLA · priority support",
                  "Invoice, contract & PO-based billing",
                  "GDPR & data residency options",
                  "Async onboarding — no calls required",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-400/90 italic mb-4 text-center">
                Trusted by serious teams. We handle everything online.
              </p>
              <EnterpriseContactDialog
                trigger={
                  <Button
                    variant="default"
                    className="w-full font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_20px_hsl(38,92%,55%,0.4)] hover:shadow-[0_0_30px_hsl(38,92%,55%,0.6)]"
                  >
                    <Building2 className="w-4 h-4 mr-2" /> Get Custom Proposal
                  </Button>
                }
              />
              <p className="text-[11px] text-muted-foreground text-center mt-2.5">
                Contact: <a href="mailto:connectai@hostflowai.net" className="text-amber-400 hover:underline">connectai@hostflowai.net</a> · Reply within 1 business day
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Trust micro-badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto pt-2">
          {[
            { icon: Languages, label: "15 Languages" },
            { icon: Mic, label: "Voice AI Ready" },
            { icon: Briefcase, label: "8 Industries" },
            { icon: Zap, label: "Fast Onboarding" },
            { icon: Users, label: "Global Teams" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-semibold text-foreground/80 backdrop-blur-sm hover:bg-white/[0.07] transition-colors"
            >
              <Check className="w-3 h-3 text-primary" />
              <Icon className="w-3.5 h-3.5 text-primary/80" />
              {label}
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white font-semibold px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(45,212,191,0.3)] hover:shadow-[0_0_45px_rgba(45,212,191,0.5)]"
              onClick={() => navigate(user ? "/dashboard" : "/signup")}
            >
              Start Free Trial — In Your Language
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">No credit card required · 7-day free trial · Cancel anytime</p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
