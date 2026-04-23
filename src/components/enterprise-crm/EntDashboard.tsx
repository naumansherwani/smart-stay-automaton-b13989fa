import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Inbox, TrendingUp, Trophy, Target, PoundSterling, ListTodo } from "lucide-react";
import { useEntLeads, useEntDeals, useEntTasks, fmtGBP, DEAL_STAGES, STAGE_COLORS } from "@/hooks/useEnterpriseCrm";

export default function EntDashboard() {
  const { data: leads } = useEntLeads();
  const { data: deals } = useEntDeals();
  const { data: tasks } = useEntTasks();

  const newLeads = leads.filter((l) => l.status === "new").length;
  const openDeals = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const pipelineValue = openDeals.reduce((s, d) => s + Number(d.value_gbp || 0), 0);
  const weightedPipeline = openDeals.reduce((s, d) => s + (Number(d.value_gbp || 0) * d.probability) / 100, 0);
  const wonValue = deals.filter((d) => d.stage === "won").reduce((s, d) => s + Number(d.value_gbp || 0), 0);
  const openTasks = tasks.filter((t) => t.status === "open" || t.status === "in_progress").length;
  const dealsByStage = DEAL_STAGES.map((s) => ({ stage: s, count: deals.filter((d) => d.stage === s).length }));

  const stats = [
    { icon: Inbox, label: "New Leads", value: newLeads, color: "text-amber-400" },
    { icon: Building2, label: "Total Leads", value: leads.length, color: "text-primary" },
    { icon: Target, label: "Open Deals", value: openDeals.length, color: "text-blue-400" },
    { icon: PoundSterling, label: "Pipeline", value: fmtGBP(pipelineValue), color: "text-cyan-400" },
    { icon: TrendingUp, label: "Weighted", value: fmtGBP(weightedPipeline), color: "text-purple-400" },
    { icon: Trophy, label: "Won (GBP)", value: fmtGBP(wonValue), color: "text-emerald-400" },
    { icon: ListTodo, label: "Open Tasks", value: openTasks, color: "text-orange-400" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{s.label}</span>
              </div>
              <div className="text-lg font-bold tabular-nums">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Pipeline Distribution</h3>
            <Badge variant="outline" className="text-[10px]">All currency in GBP</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {dealsByStage.map((s) => (
              <div key={s.stage} className={`rounded-md border p-3 ${STAGE_COLORS[s.stage]}`}>
                <div className="text-[10px] uppercase opacity-80">{s.stage}</div>
                <div className="text-2xl font-bold tabular-nums">{s.count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}