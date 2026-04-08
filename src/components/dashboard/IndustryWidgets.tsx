import { 
  Shield, Zap, Brain, Users, Activity,
  AlertTriangle, BarChart3, 
  Target, Gauge
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { IndustryConfig } from "@/lib/industryConfig";

interface IndustryWidgetsProps {
  config: IndustryConfig;
}

function UtilizationWidget({ config }: { config: IndustryConfig }) {
  const slots = Array.from({ length: 8 }, (_, i) => ({
    name: `${config.resourceLabel} ${i + 1}`,
    utilization: Math.floor(Math.random() * 40 + 55),
    status: Math.random() > 0.3 ? "active" : "available",
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          {config.resourceLabel} Utilization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {slots.slice(0, 5).map(s => (
          <div key={s.name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">{s.name}</span>
              <span className="text-muted-foreground">{s.utilization}%</span>
            </div>
            <Progress value={s.utilization} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AIInsightsWidget({ config }: { config: IndustryConfig }) {
  const insights = [
    { type: "optimization", text: `AI detected 3 underutilized ${config.resourceLabelPlural.toLowerCase()} — suggest promotional pricing`, priority: "high" },
    { type: "prediction", text: `Demand spike predicted for next week (+25%) — consider dynamic pricing`, priority: "medium" },
    { type: "conflict", text: `Potential scheduling conflict detected for ${config.resourceLabel} 2 on Friday`, priority: "high" },
    { type: "pattern", text: `${config.clientLabel} no-show pattern: Mondays 3PM have 22% higher no-show rate`, priority: "low" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
              insight.priority === "high" ? "bg-destructive" : 
              insight.priority === "medium" ? "bg-warning" : "bg-success"
            }`} />
            <p className="text-sm text-foreground">{insight.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LiveActivityWidget({ config }: { config: IndustryConfig }) {
  const activities = [
    { time: "2 min ago", action: `New ${config.bookingLabel.toLowerCase()} confirmed`, detail: `${config.clientLabel} #1847`, type: "success" },
    { time: "8 min ago", action: `${config.bookingLabel} rescheduled`, detail: `${config.resourceLabel} 3 → ${config.resourceLabel} 5`, type: "warning" },
    { time: "15 min ago", action: `${config.clientLabel} checked in`, detail: `${config.resourceLabel} 1`, type: "info" },
    { time: "22 min ago", action: "Smart pricing updated", detail: "+8% for peak hours", type: "info" },
    { time: "30 min ago", action: `Conflict resolved by AI`, detail: `Auto-reassigned ${config.resourceLabel} 2`, type: "success" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Live Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((a, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                a.type === "success" ? "bg-success" : a.type === "warning" ? "bg-warning" : "bg-primary"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{a.action}</p>
                <p className="text-xs text-muted-foreground">{a.detail} · {a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ConflictResolverWidget({ config }: { config: IndustryConfig }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          AI Conflict Resolution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-8 h-8 text-success" />
          </div>
          <p className="text-lg font-bold text-foreground">All Clear</p>
          <p className="text-sm text-muted-foreground">No conflicts detected</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="bg-secondary/50 rounded-lg p-2">
              <p className="text-lg font-bold text-foreground">12</p>
              <p className="text-xs text-muted-foreground">Resolved (7d)</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-2">
              <p className="text-lg font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-2">
              <p className="text-lg font-bold text-success">100%</p>
              <p className="text-xs text-muted-foreground">Auto-fixed</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DemandForecastWidget({ config }: { config: IndustryConfig }) {
  const forecast = [
    { day: "Mon", demand: 65, price: "$120" },
    { day: "Tue", demand: 45, price: "$95" },
    { day: "Wed", demand: 55, price: "$110" },
    { day: "Thu", demand: 70, price: "$130" },
    { day: "Fri", demand: 90, price: "$175" },
    { day: "Sat", demand: 95, price: "$190" },
    { day: "Sun", demand: 80, price: "$155" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Demand Forecast (AI)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {forecast.map(f => (
            <div key={f.day} className="flex items-center gap-3">
              <span className="w-8 text-xs text-muted-foreground font-medium">{f.day}</span>
              <div className="flex-1">
                <div className="h-4 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-primary transition-all"
                    style={{ width: `${f.demand}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground w-16 text-right">{f.demand}%</span>
              <Badge variant="outline" className="text-xs">{f.price}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AutoSchedulerWidget({ config }: { config: IndustryConfig }) {
  const suggestions = [
    { text: `Move ${config.bookingLabel} #42 to ${config.resourceLabel} 3 (better fit)`, savings: "$45", confidence: 92 },
    { text: `Add buffer time between ${config.bookingLabelPlural.toLowerCase()} 15-16`, savings: "Risk ↓", confidence: 87 },
    { text: `Consolidate ${config.resourceLabelPlural.toLowerCase()} 4-5 for maintenance window`, savings: "$120", confidence: 78 },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Smart Auto-Scheduler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((s, i) => (
          <div key={i} className="p-3 rounded-lg border border-border bg-secondary/30 space-y-2">
            <p className="text-sm text-foreground">{s.text}</p>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">Saves {s.savings}</Badge>
              <span className="text-xs text-muted-foreground">{s.confidence}% confidence</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SecurityWidget() {
  const checks = [
    { label: "RLS Policies", status: "active", icon: Shield },
    { label: "Rate Limiting", status: "active", icon: Gauge },
    { label: "Input Validation", status: "active", icon: AlertTriangle },
    { label: "Session Security", status: "active", icon: Users },
    { label: "Audit Logging", status: "active", icon: BarChart3 },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="w-4 h-4 text-success" />
          Security Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {checks.map(c => (
          <div key={c.label} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <c.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm text-foreground">{c.label}</span>
            </div>
            <Badge variant="secondary" className="text-xs bg-success/10 text-success border-success/20">Active</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const IndustryWidgets = ({ config }: IndustryWidgetsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <AIInsightsWidget config={config} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DemandForecastWidget config={config} />
          <AutoSchedulerWidget config={config} />
        </div>
        <UtilizationWidget config={config} />
      </div>
      <div className="space-y-6">
        <ConflictResolverWidget config={config} />
        <LiveActivityWidget config={config} />
        <SecurityWidget />
      </div>
    </div>
  );
};

export default IndustryWidgets;
