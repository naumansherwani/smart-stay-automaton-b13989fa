import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEntDeals, useEntLeads, fmtGBP, DEAL_STAGES, STAGE_COLORS } from "@/hooks/useEnterpriseCrm";

export default function EntAnalytics() {
  const { data: deals } = useEntDeals();
  const { data: leads } = useEntLeads();

  const won = deals.filter((d) => d.stage === "won");
  const lost = deals.filter((d) => d.stage === "lost");
  const closed = won.length + lost.length;
  const winRate = closed ? Math.round((won.length / closed) * 100) : 0;
  const avgWon = won.length ? won.reduce((s, d) => s + Number(d.value_gbp || 0), 0) / won.length : 0;
  const avgCycle = won.filter((d) => d.expected_close_date).length;

  const leadsByCountry = leads.reduce<Record<string, number>>((acc, l) => {
    const k = l.country || "Unknown"; acc[k] = (acc[k] || 0) + 1; return acc;
  }, {});
  const leadsByIndustry = leads.reduce<Record<string, number>>((acc, l) => {
    const k = l.industry || "Unknown"; acc[k] = (acc[k] || 0) + 1; return acc;
  }, {});
  const stageFunnel = DEAL_STAGES.map((s) => ({ stage: s, count: deals.filter((d) => d.stage === s).length }));
  const maxCount = Math.max(1, ...stageFunnel.map((s) => s.count));

  const topRow = (entries: Record<string, number>) =>
    Object.entries(entries).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Win Rate</div><div className="text-2xl font-bold tabular-nums">{winRate}%</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Avg Deal Size</div><div className="text-2xl font-bold tabular-nums">{fmtGBP(avgWon)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Won Deals</div><div className="text-2xl font-bold tabular-nums">{won.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Closed (Won/Lost)</div><div className="text-2xl font-bold tabular-nums">{closed}</div><div className="text-[10px] text-muted-foreground">{avgCycle} with close dates</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-3">Funnel by Stage</h3>
          <div className="space-y-2">
            {stageFunnel.map((s) => (
              <div key={s.stage} className="flex items-center gap-3">
                <div className="w-24 text-xs capitalize text-muted-foreground">{s.stage}</div>
                <div className="flex-1 bg-muted/30 rounded h-6 overflow-hidden">
                  <div className={`h-full rounded ${STAGE_COLORS[s.stage]}`} style={{ width: `${(s.count / maxCount) * 100}%` }} />
                </div>
                <div className="w-10 text-right text-xs tabular-nums font-semibold">{s.count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3">Top Countries</h3>
            <div className="space-y-1.5">
              {topRow(leadsByCountry).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span>{k}</span><Badge variant="outline" className="text-[10px]">{v}</Badge>
                </div>
              ))}
              {Object.keys(leadsByCountry).length === 0 && <p className="text-xs text-muted-foreground">No data yet.</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3">Top Industries</h3>
            <div className="space-y-1.5">
              {topRow(leadsByIndustry).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span>{k}</span><Badge variant="outline" className="text-[10px]">{v}</Badge>
                </div>
              ))}
              {Object.keys(leadsByIndustry).length === 0 && <p className="text-xs text-muted-foreground">No data yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}