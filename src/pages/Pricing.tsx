import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Building2, Loader2, Clock, Flame } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
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
  features: string[];
};

const PLAN_META: Record<PaymentsPlanKey, PlanMeta> = {
  basic: {
    plan: "basic",
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
  pro: {
    plan: "pro",
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
  premium: {
    plan: "premium",
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
};

const CURRENCY_SYMBOL: Record<string, string> = { gbp: "£", usd: "$", eur: "€" };

function formatMoney(pence: number, currency: string) {
  const symbol = CURRENCY_SYMBOL[currency.toLowerCase()] ?? currency.toUpperCase() + " ";
  return `${symbol}${(pence / 100).toFixed(2)}`;
}

function useCountdown(target: string | null) {
  const [diff, setDiff] = useState(() => (target ? new Date(target).getTime() - Date.now() : 0));
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setDiff(new Date(target).getTime() - Date.now()), 60_000);
    return () => clearInterval(id);
  }, [target]);
  if (!target || diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return { days, hours, mins };
}

function CountdownLine({ endsAt }: { endsAt: string | null }) {
  const cd = useCountdown(endsAt);
  if (!cd) return null;
  return (
    <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <Clock className="w-3 h-3" /> Ends in {cd.days}d {cd.hours}h {cd.mins}m
    </div>
  );
}

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [products, setProducts] = useState<PaymentProduct[] | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPaymentProducts()
      .then((d) => { if (!cancelled) setProducts(d.products); })
      .catch((e) => {
        if (!cancelled) setProductsError("Pricing temporarily unavailable. Please refresh.");
        handleApiError(e, { silent: true });
      });
    return () => { cancelled = true; };
  }, []);

  // Refresh plan when returning from successful checkout.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("payment") === "success") {
      toast.success("Payment successful — your plan is now active");
    } else if (sp.get("payment") === "cancelled") {
      toast.info("Checkout cancelled. You can try again anytime.");
    }
  }, []);

  const handleSelect = async (product: PaymentProduct) => {
    if (!user) {
      navigate("/signup");
      return;
    }
    setLoadingPlan(product.plan);
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

  const productByPlan = useMemo(() => {
    const m: Partial<Record<PaymentsPlanKey, PaymentProduct>> = {};
    products?.forEach((p) => { m[p.plan] = p; });
    return m;
  }, [products]);

  const PLAN_ORDER: PaymentsPlanKey[] = ["basic", "pro", "premium"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container pt-24 pb-16 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered scheduling for every industry. 1 industry per plan.
          </p>
          {productsError && (
            <p className="text-sm text-rose-400">{productsError}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {PLAN_ORDER.map((planKey) => {
            const meta = PLAN_META[planKey];
            const product = productByPlan[planKey];
            const isCurrent = subscription?.plan === planKey && (subscription?.status === "active" || subscription?.status === "trialing");
            const launchActive = !!product?.launch_active && product.active_price < product.regular_price;
            return (
              <Card key={planKey} className={`relative flex flex-col transition-all duration-300 ${meta.starter ? "border-cyan-400/50 hover:ring-2 hover:ring-cyan-400/40 hover:shadow-[0_0_20px_hsl(186,80%,50%,0.3)]" : meta.popular ? "border-primary/50 hover:ring-2 hover:ring-primary/40 hover:shadow-[0_0_20px_hsl(174,62%,50%,0.3)]" : meta.highlight ? "border-yellow-500/50 hover:ring-2 hover:ring-yellow-500/40 hover:shadow-[0_0_25px_hsl(45,100%,50%,0.35)]" : ""}`}>
                {meta.starter && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white border-0 shadow-lg px-4 py-1">🚀 Great Start</Badge>
                )}
                {meta.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white border-0 shadow-lg px-4 py-1">
                    <Crown className="w-3 h-3 mr-1" /> Most Popular
                  </Badge>
                )}
                {meta.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                    {meta.highlight}
                  </div>
                )}
                {isCurrent && (
                  <Badge className="absolute -top-3 right-4 bg-primary text-primary-foreground">Current Plan</Badge>
                )}
                <CardHeader className="text-center pb-2 pt-8">
                  <CardTitle className="text-xl">{product?.name ?? meta.plan.charAt(0).toUpperCase() + meta.plan.slice(1)}</CardTitle>
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
                    <span className="text-muted-foreground">/month</span>
                    {launchActive && (
                      <div className="mt-3 flex flex-col items-center gap-1">
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30">
                          <Flame className="w-3 h-3" /> Launch Offer
                        </div>
                        <CountdownLine endsAt={product?.launch_ends_at ?? null} />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1 mb-6">
                    {meta.features.map((f, i) =>
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
                    disabled={!!isCurrent || !product || loadingPlan === planKey}
                    onClick={() => product && void handleSelect(product)}
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
