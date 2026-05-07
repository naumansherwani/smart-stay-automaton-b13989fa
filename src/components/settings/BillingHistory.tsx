import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2 } from "lucide-react";
import { fetchPaymentHistory, type PaymentHistoryItem, ApiError } from "@/lib/api";

function formatAmount(pence: number, currency = "gbp") {
  const symbol =
    currency.toLowerCase() === "usd" ? "$" :
    currency.toLowerCase() === "eur" ? "€" : "£";
  return `${symbol}${(pence / 100).toFixed(2)}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "paid")
    return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">Paid</Badge>;
  if (s === "pending")
    return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30">Pending</Badge>;
  if (s === "failed")
    return <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/30">Failed</Badge>;
  return <Badge variant="secondary" className="capitalize">{status}</Badge>;
}

export default function BillingHistory() {
  const [items, setItems] = useState<PaymentHistoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchPaymentHistory();
        if (!mounted) return;
        const sorted = [...(res.payments ?? [])].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setItems(sorted);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof ApiError ? e.message : "Could not load billing history.");
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Billing History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground py-4">{error}</p>
        ) : !items || items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No payment history yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border/50">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Plan</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p, i) => (
                  <tr key={p.id ?? i} className="border-b border-border/30 last:border-0">
                    <td className="py-2.5 pr-4 whitespace-nowrap">{formatDate(p.date)}</td>
                    <td className="py-2.5 pr-4 capitalize">{p.plan}</td>
                    <td className="py-2.5 pr-4 font-medium">{formatAmount(p.amount, p.currency)}</td>
                    <td className="py-2.5"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}