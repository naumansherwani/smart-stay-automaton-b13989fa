import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OwnerSubscriptionsTabProps {
  subscriptions: any[];
  showSecret: boolean;
}

const OwnerSubscriptionsTab = ({ subscriptions, showSecret }: OwnerSubscriptionsTabProps) => {
  const active = subscriptions.filter((s: any) => s.status === "active" || s.is_lifetime);
  const trialing = subscriptions.filter((s: any) => s.status === "trialing");
  const expired = subscriptions.filter((s: any) => s.status !== "active" && s.status !== "trialing" && !s.is_lifetime);

  const planCounts: Record<string, number> = {};
  subscriptions.forEach((s: any) => {
    planCounts[s.plan] = (planCounts[s.plan] || 0) + 1;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[hsl(160,60%,45%)]/5 border border-[hsl(160,60%,45%)]/20 text-center">
          <p className="text-2xl font-bold text-[hsl(160,60%,45%)]">{active.length}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
        <div className="p-3 rounded-xl bg-[hsl(217,91%,60%)]/5 border border-[hsl(217,91%,60%)]/20 text-center">
          <p className="text-2xl font-bold text-[hsl(217,91%,60%)]">{trialing.length}</p>
          <p className="text-xs text-muted-foreground">Trialing</p>
        </div>
        <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-center">
          <p className="text-2xl font-bold text-yellow-400">{expired.length}</p>
          <p className="text-xs text-muted-foreground">Expired</p>
        </div>
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
          <p className="text-2xl font-bold text-primary">{subscriptions.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Plan Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(planCounts).map(([plan, count]) => (
              <Badge key={plan} variant="outline" className="text-xs px-3 py-1.5">
                {plan.charAt(0).toUpperCase() + plan.slice(1)}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">All Subscriptions</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="pb-2 font-medium">User ID</th>
                  <th className="pb-2 font-medium">Plan</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Lifetime</th>
                  <th className="pb-2 font-medium">Trial Ends</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s: any) => (
                  <tr key={s.id} className="border-b border-border/50">
                    <td className="py-2 text-foreground text-xs font-mono">
                      {showSecret ? s.user_id?.slice(0, 8) + "..." : "•••"}
                    </td>
                    <td className="py-2">
                      <Badge variant="outline" className="text-xs capitalize">{s.plan}</Badge>
                    </td>
                    <td className="py-2">
                      <Badge
                        className={`text-xs ${
                          s.status === "active" || s.is_lifetime
                            ? "bg-[hsl(160,60%,45%)]/20 text-[hsl(160,60%,45%)]"
                            : s.status === "trialing"
                            ? "bg-[hsl(217,91%,60%)]/20 text-[hsl(217,91%,60%)]"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {s.is_lifetime ? "Lifetime" : s.status}
                      </Badge>
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">
                      {s.is_lifetime ? "✅" : "—"}
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">
                      {s.trial_ends_at ? new Date(s.trial_ends_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
                {subscriptions.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No subscriptions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerSubscriptionsTab;
