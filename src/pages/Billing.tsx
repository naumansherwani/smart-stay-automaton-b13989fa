import { useEffect, useState } from "react";
import { replitCall } from "@/lib/replitApi";
import { CreditCard, Loader2 } from "lucide-react";

export default function Billing() {
  const [me, setMe] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      replitCall("/payments/me", undefined, { method: "GET" }),
      replitCall<{ products: any[] }>("/payments/products", undefined, { method: "GET" }),
    ]).then(([m, p]) => {
      setMe(m.data);
      setProducts(p.data?.products ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="container max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-primary" /> Billing
        </h1>
        <p className="text-muted-foreground mt-1.5">Subscription, plans & usage limits.</p>
      </div>

      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm mb-6">
        Payment processing is being reconnected. Plan changes are paused — your current plan stays active.
      </div>

      {loading && <Loader2 className="w-4 h-4 animate-spin" />}

      {me && (
        <div className="p-5 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Current plan</p>
          <p className="text-2xl font-bold mt-1 capitalize">{me.plan ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">Status: {me.status ?? "active"}</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p: any) => (
          <div key={p.plan} className="p-5 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50">
            <p className="text-xs uppercase tracking-wider text-primary font-bold">{p.plan}</p>
            <p className="text-2xl font-bold mt-1">£{p.launch_price ?? p.price_gbp}</p>
            <p className="text-xs text-muted-foreground">/month</p>
          </div>
        ))}
      </div>
    </div>
  );
}