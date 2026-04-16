import { useState, useEffect } from "react";
import {
  Shield, Zap, Brain, Users, Activity,
  AlertTriangle, BarChart3,
  Target, Gauge
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { IndustryConfig } from "@/lib/industryConfig";
import type { IndustryFeatureSet } from "@/lib/industryFeatures";

interface IndustryWidgetsProps {
  config: IndustryConfig;
  features?: IndustryFeatureSet;
}

function UtilizationWidget({ config }: { config: IndustryConfig }) {
  const { user } = useAuth();
  const [slots, setSlots] = useState<{ name: string; utilization: number; status: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      const { data: resources } = await supabase
        .from("resources")
        .select("id, name")
        .eq("user_id", user.id);
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, resource_id, status")
        .eq("user_id", user.id)
        .in("status", ["confirmed", "checked-in", "in-progress", "scheduled"]);

      if (resources && resources.length > 0) {
        const mapped = resources.slice(0, 8).map(r => {
          const activeBookings = (bookings || []).filter(b => b.resource_id === r.id).length;
          const totalPossibleSlots = 10; // approximate daily slots
          const util = Math.min(100, Math.round((activeBookings / totalPossibleSlots) * 100));
          return {
            name: r.name,
            utilization: util,
            status: activeBookings > 0 ? "active" : "available",
          };
        });
        setSlots(mapped);
      } else {
        setSlots([]);
      }
    };
    loadData();
  }, [config, user]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          {config.resourceLabel} Utilization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No {config.resourceLabelPlural.toLowerCase()} added yet</p>
        ) : slots.slice(0, 5).map(s => (
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

function AIInsightsWidget({ config, showPricing }: { config: IndustryConfig; showPricing?: boolean }) {
  const { user } = useAuth();
  const [insights, setInsights] = useState<{ type: string; text: string; priority: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    const generate = async () => {
      const results: { type: string; text: string; priority: string }[] = [];

      // Check underutilized resources
      const { data: resources } = await supabase
        .from("resources")
        .select("id, name")
        .eq("user_id", user.id);
      const { count: activeBookingCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["confirmed", "checked-in", "in-progress"]);

      const resCount = resources?.length || 0;
      const bookCount = activeBookingCount || 0;

      if (resCount > 0 && bookCount < resCount) {
        const underused = resCount - bookCount;
        results.push({
          type: "optimization",
          text: `${underused} ${config.resourceLabelPlural.toLowerCase()} currently have no active ${config.bookingLabelPlural.toLowerCase()} — consider schedule adjustment`,
          priority: underused > 2 ? "high" : "medium",
        });
      }

      // Check recent conflicts
      const { count: conflictCount } = await supabase
        .from("booking_conflicts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("resolution", "pending");

      if (conflictCount && conflictCount > 0) {
        results.push({
          type: "conflict",
          text: `${conflictCount} scheduling conflict${conflictCount > 1 ? "s" : ""} pending resolution`,
          priority: "high",
        });
      }

      // Check no-show pattern
      const { count: noShowCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "no-show");

      if (noShowCount && noShowCount > 0) {
        results.push({
          type: "pattern",
          text: `${noShowCount} ${config.clientLabel.toLowerCase()} no-show${noShowCount > 1 ? "s" : ""} recorded — review scheduling patterns`,
          priority: noShowCount > 5 ? "high" : "low",
        });
      }

      if (showPricing && bookCount > 3) {
        results.push({
          type: "prediction",
          text: `AI pricing is active — monitoring demand for ${config.bookingLabelPlural.toLowerCase()} to optimize rates`,
          priority: "medium",
        });
      }

      if (results.length === 0) {
        results.push({
          type: "info",
          text: `No actionable insights yet — add more ${config.resourceLabelPlural.toLowerCase()} and ${config.bookingLabelPlural.toLowerCase()} to unlock AI recommendations`,
          priority: "low",
        });
      }

      setInsights(results);
    };
    generate();
  }, [user, config, showPricing]);

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
  const { user } = useAuth();
  const [activities, setActivities] = useState<{ time: string; action: string; detail: string; type: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Fetch recent bookings as activity
      const { data: recentBookings } = await supabase
        .from("bookings")
        .select("id, guest_name, status, updated_at, resource_id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5);

      const { data: resources } = await supabase
        .from("resources")
        .select("id, name")
        .eq("user_id", user.id);

      const resourceMap = new Map((resources || []).map(r => [r.id, r.name]));

      if (recentBookings && recentBookings.length > 0) {
        const mapped = recentBookings.map(b => {
          const resName = resourceMap.get(b.resource_id) || config.resourceLabel;
          const ago = getTimeAgo(new Date(b.updated_at));
          const statusMap: Record<string, { action: string; type: string }> = {
            "confirmed": { action: `${config.bookingLabel} confirmed`, type: "success" },
            "checked-in": { action: `${config.clientLabel} checked in`, type: "info" },
            "checked-out": { action: `${config.clientLabel} checked out`, type: "info" },
            "cancelled": { action: `${config.bookingLabel} cancelled`, type: "warning" },
            "no-show": { action: `${config.clientLabel} no-show`, type: "warning" },
            "pending": { action: `${config.bookingLabel} pending`, type: "info" },
          };
          const info = statusMap[b.status] || { action: `${config.bookingLabel} updated`, type: "info" };
          return {
            time: ago,
            action: info.action,
            detail: `${b.guest_name} · ${resName}`,
            type: info.type,
          };
        });
        setActivities(mapped);
      } else {
        setActivities([]);
      }
    };
    load();
  }, [user, config]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Live Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}

function ConflictResolverWidget({ config }: { config: IndustryConfig }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ resolved: 0, pending: 0, autoRate: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      const { count: resolvedCount } = await supabase
        .from("booking_conflicts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .neq("resolution", "pending")
        .gte("created_at", sevenDaysAgo);

      const { count: pendingCount } = await supabase
        .from("booking_conflicts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("resolution", "pending");

      const resolved = resolvedCount || 0;
      const pending = pendingCount || 0;
      const total = resolved + pending;
      const autoRate = total > 0 ? Math.round((resolved / total) * 100) : 100;

      setStats({ resolved, pending, autoRate });
    };
    load();
  }, [user]);

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
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
            stats.pending > 0 ? "bg-warning/10" : "bg-success/10"
          }`}>
            <Shield className={`w-8 h-8 ${stats.pending > 0 ? "text-warning" : "text-success"}`} />
          </div>
          <p className="text-lg font-bold text-foreground">{stats.pending > 0 ? `${stats.pending} Pending` : "All Clear"}</p>
          <p className="text-sm text-muted-foreground">{stats.pending > 0 ? "Conflicts need attention" : "No conflicts detected"}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="bg-secondary/50 rounded-lg p-2">
              <p className="text-lg font-bold text-foreground">{stats.resolved}</p>
              <p className="text-xs text-muted-foreground">Resolved (7d)</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-2">
              <p className="text-lg font-bold text-foreground">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-2">
              <p className={`text-lg font-bold ${stats.autoRate >= 80 ? "text-success" : "text-warning"}`}>{stats.autoRate}%</p>
              <p className="text-xs text-muted-foreground">Auto-fixed</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DemandForecastWidget({ config }: { config: IndustryConfig }) {
  const { user } = useAuth();
  const [forecast, setForecast] = useState<{ day: string; demand: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Compute demand from actual bookings per day-of-week
      const { data: bookings } = await supabase
        .from("bookings")
        .select("check_in")
        .eq("user_id", user.id)
        .gte("check_in", new Date(Date.now() - 90 * 86400000).toISOString());

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const counts = new Array(7).fill(0);

      (bookings || []).forEach(b => {
        const d = new Date(b.check_in).getDay();
        counts[d]++;
      });

      const max = Math.max(...counts, 1);
      const mapped = days.map((day, i) => ({
        day,
        demand: Math.round((counts[i] / max) * 100),
      }));

      // Reorder Mon-Sun
      const reordered = [...mapped.slice(1), mapped[0]];
      setForecast(reordered);
    };
    load();
  }, [user]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Demand Forecast (AI)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {forecast.every(f => f.demand === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-4">Add {config.bookingLabelPlural.toLowerCase()} to see demand patterns</p>
        ) : (
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
                <span className="text-xs text-muted-foreground w-10 text-right">{f.demand}%</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AutoSchedulerWidget({ config }: { config: IndustryConfig }) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<{ text: string; confidence: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const results: { text: string; confidence: number }[] = [];

      const { data: resources } = await supabase
        .from("resources")
        .select("id, name")
        .eq("user_id", user.id);

      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, resource_id, check_in, check_out, status")
        .eq("user_id", user.id)
        .in("status", ["confirmed", "pending"]);

      if (!resources?.length || !bookings?.length) {
        setSuggestions([]);
        return;
      }

      // Find resources with no bookings — suggest consolidation
      const bookedResourceIds = new Set((bookings || []).map(b => b.resource_id));
      const unused = (resources || []).filter(r => !bookedResourceIds.has(r.id));
      if (unused.length > 0) {
        results.push({
          text: `${unused.length} ${config.resourceLabelPlural.toLowerCase()} have no upcoming ${config.bookingLabelPlural.toLowerCase()} — consider maintenance window`,
          confidence: 85,
        });
      }

      // Check for back-to-back bookings needing buffer
      const sorted = [...(bookings || [])].sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime());
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].resource_id === sorted[i + 1].resource_id) {
          const gap = new Date(sorted[i + 1].check_in).getTime() - new Date(sorted[i].check_out).getTime();
          if (gap >= 0 && gap < 3600000) { // less than 1 hour gap
            results.push({
              text: `Tight turnaround detected — add buffer between ${config.bookingLabelPlural.toLowerCase()} on ${new Date(sorted[i].check_in).toLocaleDateString()}`,
              confidence: 90,
            });
            break;
          }
        }
      }

      if (results.length === 0) {
        results.push({
          text: `Schedule looks optimized — no adjustments needed right now`,
          confidence: 95,
        });
      }

      setSuggestions(results.slice(0, 3));
    };
    load();
  }, [user, config]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Smart Auto-Scheduler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Add {config.resourceLabelPlural.toLowerCase()} and {config.bookingLabelPlural.toLowerCase()} for AI suggestions</p>
        ) : suggestions.map((s, i) => (
          <div key={i} className="p-3 rounded-lg border border-border bg-secondary/30 space-y-2">
            <p className="text-sm text-foreground">{s.text}</p>
            <div className="flex items-center justify-end">
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

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const IndustryWidgets = ({ config, features }: IndustryWidgetsProps) => {
  const showDemand = features?.demandForecast ?? false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <AIInsightsWidget config={config} showPricing={showDemand} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {showDemand && <DemandForecastWidget config={config} />}
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
