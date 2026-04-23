import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users } from "lucide-react";

interface Redemption {
  id: string;
  user_id: string;
  user_email: string | null;
  plan: string;
  discount_percent: number;
  original_price: number;
  discounted_price: number;
  redeemed_at: string;
  locked_until: string;
  polar_subscription_id: string | null;
}

const PLAN_LABEL: Record<string, string> = {
  basic: "Basic",
  pro: "Pro",
  premium: "Premium",
};

export default function OwnerLaunchDiscountTab({ showSecret }: { showSecret: boolean }) {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: list }, { data: stat }] = await Promise.all([
        supabase
          .from("launch_discount_redemptions")
          .select("*")
          .order("redeemed_at", { ascending: false }),
        supabase.rpc("get_launch_discount_status"),
      ]);
      setRedemptions((list as Redemption[]) || []);
      setStatus(stat);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["basic", "pro", "premium"] as const).map((plan) => {
          const p = status?.plans?.[plan];
          if (!p) return null;
          return (
            <Card key={plan} className="border-pink-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  {PLAN_LABEL[plan]} — {p.discount_percent}% off
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">{p.redeemed}</span>
                  <span className="text-sm text-muted-foreground">/ {status.cap_per_plan} claimed</span>
                </div>
                <Badge
                  className={
                    p.status === "active"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : p.status === "sold_out"
                      ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {p.status === "active" ? "Live" : p.status === "sold_out" ? "Sold out" : p.status === "expired" ? "Ended" : "Upcoming"}
                </Badge>
                <p className="text-[11px] text-muted-foreground">
                  {p.remaining} spots remaining
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" /> All Redemptions ({redemptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b text-xs">
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Plan</th>
                  <th className="pb-2 font-medium">Discount</th>
                  <th className="pb-2 font-medium">Original</th>
                  <th className="pb-2 font-medium">Locked Price</th>
                  <th className="pb-2 font-medium">Claimed</th>
                  <th className="pb-2 font-medium">Locked Until</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-2 text-foreground text-xs">
                      {showSecret ? (r.user_email || r.user_id.slice(0, 8)) : "•••"}
                    </td>
                    <td className="py-2">
                      <Badge variant="secondary" className="text-[10px]">{PLAN_LABEL[r.plan] || r.plan}</Badge>
                    </td>
                    <td className="py-2 text-pink-400 font-semibold">−{r.discount_percent}%</td>
                    <td className="py-2 text-muted-foreground line-through">£{Number(r.original_price).toFixed(2)}</td>
                    <td className="py-2 text-emerald-400 font-semibold">£{Number(r.discounted_price).toFixed(2)}</td>
                    <td className="py-2 text-muted-foreground text-xs">{new Date(r.redeemed_at).toLocaleDateString()}</td>
                    <td className="py-2 text-muted-foreground text-xs">{new Date(r.locked_until).toLocaleDateString()}</td>
                  </tr>
                ))}
                {redemptions.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No launch discount redemptions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}