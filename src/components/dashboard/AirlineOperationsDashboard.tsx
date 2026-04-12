import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage
} from "@/components/ui/breadcrumb";
import {
  Plane, Users, DollarSign, Clock, TrendingUp, AlertTriangle,
  Zap, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle,
  BarChart3, Smile, Meh, Frown, RefreshCw, Shield, Search, Wifi
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell, Legend
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import AirlineAIResolveDialog from "./AirlineAIResolveDialog";

// ─── Glassmorphism card wrapper ──────────────────────────────────────────────
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={`backdrop-blur-xl bg-card/70 border-border/50 shadow-lg shadow-black/[0.03] ${className}`}>
      {children}
    </Card>
  );
}

// ─── Circular Gauge (SVG) ────────────────────────────────────────────────────
function CircularGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" className="transform -rotate-90">
        <circle cx="50" cy="50" r={radius} stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
        <circle
          cx="50" cy="50" r={radius}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - strokeDash}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute mt-7 text-center">
        <p className="text-2xl font-bold text-foreground">{value}%</p>
      </div>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
    </div>
  );
}

// ─── Revenue forecast data ───────────────────────────────────────────────────
const forecastData = [
  { month: "Jan", actual: 2400000, predicted: 2350000, lower: 2100000, upper: 2600000 },
  { month: "Feb", actual: 2100000, predicted: 2200000, lower: 1950000, upper: 2450000 },
  { month: "Mar", actual: 2800000, predicted: 2700000, lower: 2400000, upper: 3000000 },
  { month: "Apr", actual: 3100000, predicted: 3000000, lower: 2700000, upper: 3300000 },
  { month: "May", actual: 3400000, predicted: 3350000, lower: 3000000, upper: 3700000 },
  { month: "Jun", actual: 3800000, predicted: 3750000, lower: 3400000, upper: 4100000 },
  { month: "Jul", actual: null, predicted: 4200000, lower: 3800000, upper: 4600000 },
  { month: "Aug", actual: null, predicted: 4500000, lower: 4000000, upper: 5000000 },
  { month: "Sep", actual: null, predicted: 3900000, lower: 3500000, upper: 4300000 },
];

const sentimentData = [
  { name: "Happy", value: 62, color: "hsl(152, 60%, 48%)" },
  { name: "Neutral", value: 25, color: "hsl(45, 90%, 55%)" },
  { name: "Angry", value: 13, color: "hsl(0, 75%, 55%)" },
];

const aiPricingRoutes = [
  { route: "JFK → LAX", current: 289, suggested: 342, change: "+18%", demand: "High", load: 94, confidence: 96 },
  { route: "JFK → ORD", current: 195, suggested: 178, change: "-9%", demand: "Low", load: 58, confidence: 88 },
  { route: "LAX → MIA", current: 310, suggested: 365, change: "+18%", demand: "Peak", load: 91, confidence: 94 },
];

const disruptedFlights = [
  { flight: "AA1042", route: "JFK → LAX", delay: "45 min", reason: "Thunderstorm at JFK", passengers: 169, connections: 12, severity: "high" },
  { flight: "DL221", route: "ATL → SFO", delay: "90 min", reason: "Mechanical inspection", passengers: 176, connections: 28, severity: "critical" },
  { flight: "UA589", route: "ORD → DEN", delay: "20 min", reason: "Crew rotation", passengers: 125, connections: 3, severity: "low" },
  { flight: "SW834", route: "DEN → SEA", delay: "60 min", reason: "ATC ground stop", passengers: 148, connections: 8, severity: "high" },
];

// ─── Main Dashboard Component ────────────────────────────────────────────────
export default function AirlineOperationsDashboard() {
  const { user } = useAuth();
  const [flights, setFlights] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingFlights, setResolvingFlights] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [fRes, bRes] = await Promise.all([
        supabase.from("resources").select("*").eq("user_id", user.id).eq("industry", "airlines"),
        supabase.from("bookings").select("*").eq("user_id", user.id),
      ]);
      if (fRes.data) setFlights(fRes.data);
      if (bRes.data) setBookings(bRes.data);
      setLastSynced(new Date());
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const activeBookings = bookings.filter(b => b.status !== "cancelled");
  const totalPassengers = activeBookings.reduce((s, b) => s + ((b.metadata as any)?.seats || 1), 0);
  const totalRevenue = activeBookings.reduce((s, b) => s + (b.total_price || 0), 0);
  const avgLoad = flights.length > 0
    ? Math.round(flights.reduce((s, f) => {
        const booked = activeBookings.filter(b => b.resource_id === f.id).reduce((ss, b) => ss + ((b.metadata as any)?.seats || 1), 0);
        return s + (booked / (f.max_capacity || 180)) * 100;
      }, 0) / flights.length)
    : 82; // fallback demo value

  const revenueAtRisk = disruptedFlights.reduce((s, f) => s + f.passengers * 45, 0); // avg compensation per pax
  const otpRate = 87; // On-time performance

  const handleAIResolve = async (flightCode: string) => {
    setResolvingFlights(prev => new Set(prev).add(flightCode));
    // Simulate AI resolution
    await new Promise(r => setTimeout(r, 2000));
    setResolvingFlights(prev => { const n = new Set(prev); n.delete(flightCode); return n; });
    toast.success(`✈️ AI resolved disruption for ${flightCode}: Passengers rebooked, compensation queued.`);
  };

  const handleApplyPrice = (route: string, price: number) => {
    toast.success(`💰 AI pricing applied: ${route} → $${price}`);
  };

  const formatCurrency = (v: number) => {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
    return `$${v}`;
  };

  return (
    <div className="space-y-6">
      {/* ═══ BREADCRUMBS + SEARCH + LIVE INDICATOR ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="text-xs">Workspaces</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="text-xs">Airlines</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xs">Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search flight, passenger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-card/70 border-border/50"
            />
          </div>

          {/* Real-time Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-success/10 border border-success/20 shrink-0">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <Wifi className="w-3 h-3 text-success" />
            <span className="text-[10px] font-medium text-success">Live</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Live Load Factor */}
        <GlassCard>
          <CardContent className="pt-5 pb-4 flex flex-col items-center relative">
            <div className="absolute top-3 right-3">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            </div>
            <CircularGauge value={avgLoad || 82} label="Live Load Factor" color="hsl(168, 70%, 38%)" />
          </CardContent>
        </GlassCard>

        {/* Revenue at Risk */}
        <GlassCard>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-4.5 h-4.5 text-destructive" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">Revenue at Risk</p>
            </div>
            <p className="text-2xl font-bold text-destructive">${revenueAtRisk.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3 text-destructive" />
              <span className="text-xs text-destructive font-medium">+12% vs yesterday</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{disruptedFlights.length} disruptions active</p>
          </CardContent>
        </GlassCard>

        {/* On-Time Performance */}
        <GlassCard>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-4.5 h-4.5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">On-Time Performance</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{otpRate}%</p>
            <Progress value={otpRate} className="h-1.5 mt-2" />
            <div className="flex items-center gap-1 mt-1.5">
              <ArrowUpRight className="w-3 h-3 text-success" />
              <span className="text-xs text-success font-medium">+3% vs last week</span>
            </div>
          </CardContent>
        </GlassCard>

        {/* Active Passengers */}
        <GlassCard>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-4.5 h-4.5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">Active Passengers</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalPassengers > 0 ? totalPassengers.toLocaleString() : "4,892"}</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3 text-success" />
              <span className="text-xs text-success font-medium">+8% vs yesterday</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{flights.filter(f => f.is_active).length || 24} active flights</p>
          </CardContent>
        </GlassCard>
      </div>

      {/* ═══ MIDDLE ROW: Revenue Forecast + AI Pricing Hub ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Predictive Revenue Forecast - 3 cols */}
        <GlassCard className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Predictive Revenue Forecast
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                <Zap className="w-3 h-3 mr-1" /> AI-Powered
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Actual vs AI-predicted revenue with confidence bands</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(220, 80%, 55%)" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(220, 80%, 55%)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(168, 70%, 38%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(168, 70%, 38%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={formatCurrency} />
                  <RechartsTooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  />
                  {/* Confidence band */}
                  <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confBand)" />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="transparent" />
                  {/* Predicted line */}
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="hsl(220, 80%, 55%)"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={{ r: 3, fill: "hsl(220, 80%, 55%)" }}
                    name="AI Predicted"
                  />
                  {/* Actual line */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(168, 70%, 38%)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "hsl(168, 70%, 38%)", strokeWidth: 2, stroke: "white" }}
                    name="Actual Revenue"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-6 mt-2 px-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-[hsl(168,70%,38%)] rounded" />
                <span className="text-[11px] text-muted-foreground">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-[hsl(220,80%,55%)] rounded border-dashed" style={{ borderBottom: "2px dashed hsl(220,80%,55%)" }} />
                <span className="text-[11px] text-muted-foreground">AI Predicted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-[hsl(220,80%,55%)]/10 rounded" />
                <span className="text-[11px] text-muted-foreground">Confidence Band</span>
              </div>
            </div>
          </CardContent>
        </GlassCard>

        {/* AI Pricing Hub - 2 cols */}
        <GlassCard className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-success" />
                AI Pricing Hub
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] bg-success/5 text-success border-success/20">
                Live
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Top routes with AI-suggested price adjustments</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {aiPricingRoutes.map((r) => {
              const isIncrease = r.suggested > r.current;
              return (
                <div key={r.route} className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-2.5 hover:border-primary/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.route}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] h-5">{r.demand} Demand</Badge>
                        <span className="text-[10px] text-muted-foreground">Load: {r.load}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground line-through">${r.current}</span>
                        <span className="text-lg font-bold text-foreground">${r.suggested}</span>
                      </div>
                      <span className={`text-xs font-semibold ${isIncrease ? "text-success" : "text-destructive"}`}>
                        {r.change}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-primary" />
                      <span className="text-[10px] text-muted-foreground">{r.confidence}% confidence</span>
                    </div>
                    <Button
                      size="sm"
                      className="h-7 text-xs px-3 gap-1"
                      onClick={() => handleApplyPrice(r.route, r.suggested)}
                    >
                      <Zap className="w-3 h-3" /> Apply
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </GlassCard>
      </div>

      {/* ═══ BOTTOM ROW: Sentiment + Disruption Monitor ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Passenger Sentiment Meter */}
        <GlassCard>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Smile className="w-4 h-4 text-success" />
              Passenger Sentiment Meter
            </CardTitle>
            <p className="text-xs text-muted-foreground">Real-time mood tracking across all flights</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-[180px] h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {sentimentData.map((s) => {
                  const Icon = s.name === "Happy" ? Smile : s.name === "Neutral" ? Meh : Frown;
                  return (
                    <div key={s.name} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                        <Icon className="w-4 h-4" style={{ color: s.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{s.name}</span>
                          <span className="text-sm font-bold text-foreground">{s.value}%</span>
                        </div>
                        <Progress value={s.value} className="h-1.5 mt-1" />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-border mt-2">
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-success">↑ 5%</span> improvement in Happy sentiment vs last week
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </GlassCard>

        {/* Flight Disruption Monitor */}
        <GlassCard>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Flight Disruption Monitor
              </CardTitle>
              <Badge variant="destructive" className="text-[10px]">
                {disruptedFlights.length} Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="col-span-2">Flight</span>
                <span className="col-span-3">Route</span>
                <span className="col-span-2">Delay</span>
                <span className="col-span-2">PAX</span>
                <span className="col-span-3 text-right">Action</span>
              </div>
              {disruptedFlights.map((f) => {
                const isResolving = resolvingFlights.has(f.flight);
                const severityColor = f.severity === "critical"
                  ? "border-destructive/30 bg-destructive/5"
                  : f.severity === "high"
                  ? "border-warning/30 bg-warning/5"
                  : "border-border bg-muted/20";

                return (
                  <div key={f.flight} className={`grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg border ${severityColor} transition-colors`}>
                    <div className="col-span-2">
                      <p className="text-sm font-bold text-foreground">{f.flight}</p>
                      <Badge
                        variant="outline"
                        className={`text-[9px] mt-0.5 ${
                          f.severity === "critical" ? "text-destructive border-destructive/30" :
                          f.severity === "high" ? "text-warning border-warning/30" :
                          "text-muted-foreground"
                        }`}
                      >
                        {f.severity}
                      </Badge>
                    </div>
                    <div className="col-span-3">
                      <p className="text-xs text-foreground font-medium">{f.route}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{f.reason}</p>
                    </div>
                    <div className="col-span-2">
                      <Badge variant="destructive" className="text-[10px]">+{f.delay}</Badge>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-foreground">{f.passengers} pax</p>
                      <p className="text-[10px] text-muted-foreground">{f.connections} connections</p>
                    </div>
                    <div className="col-span-3 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-primary/30 hover:bg-primary/5 text-primary"
                        onClick={() => handleAIResolve(f.flight)}
                        disabled={isResolving}
                      >
                        {isResolving ? (
                          <><RefreshCw className="w-3 h-3 animate-spin" /> Resolving...</>
                        ) : (
                          <><Zap className="w-3 h-3" /> AI Resolve</>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}
