import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeShim } from "@/lib/replitApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  TrendingDown, TrendingUp, DollarSign, Users, AlertTriangle, PauseCircle,
  ArrowDown, RefreshCw, Sparkles, Globe2, Briefcase, Calendar, Loader2, Send, Brain
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

const REASON_LABELS: Record<string, string> = {
  expensive: "Too Expensive",
  low_usage: "Low Usage",
  missing_features: "Missing Features",
  technical: "Technical Issues",
  competitor: "Competitor",
  temporary_break: "Temporary Break",
  other: "Other",
};

const REASON_COLORS = ["hsl(var(--primary))", "hsl(217 91% 60%)", "hsl(280 70% 60%)", "hsl(0 70% 60%)", "hsl(30 90% 55%)", "hsl(190 70% 50%)", "hsl(0 0% 60%)"];

export default function OwnerRetentionTab() {
  const [loading, setLoading] = useState(true);
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [pauses, setPauses] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [scoring, setScoring] = useState(false);

  // Campaign builder
  const [newCampaign, setNewCampaign] = useState({ name: "", campaign_type: "discount", discount_percent: 20, target_audience: "all_canceled", message: "" });

  const load = async () => {
    setLoading(true);
    const [c, p, r, w, s, pr] = await Promise.all([
      supabase.from("cancellation_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("subscription_pauses").select("*").order("created_at", { ascending: false }),
      supabase.from("churn_risk_scores").select("*").order("risk_score", { ascending: false }),
      supabase.from("win_back_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("exit_surveys").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, display_name, company_name, industry"),
    ]);
    setCancellations(c.data || []);
    setPauses(p.data || []);
    setRisks(r.data || []);
    setCampaigns(w.data || []);
    setSurveys(s.data || []);
    setProfiles(pr.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const profileMap = useMemo(() => {
    const m: Record<string, any> = {};
    profiles.forEach(p => { m[p.user_id] = p; });
    return m;
  }, [profiles]);

  // ===== Metrics =====
  const metrics = useMemo(() => {
    const total = cancellations.length;
    const canceled = cancellations.filter(c => c.final_action === "canceled").length;
    const stayed = cancellations.filter(c => c.final_action === "stayed").length;
    const paused = cancellations.filter(c => c.final_action === "paused").length;
    const downgraded = cancellations.filter(c => c.final_action === "downgraded").length;
    const churnRate = total > 0 ? Math.round((canceled / Math.max(total, profiles.length)) * 100) : 0;
    const lostMrr = canceled * 49; // assumed avg
    const savedMrr = (stayed + paused) * 49;
    const atRisk = risks.filter(r => r.risk_score >= 60).length;
    return { total, canceled, stayed, paused, downgraded, churnRate, lostMrr, savedMrr, atRisk };
  }, [cancellations, risks, profiles]);

  // Reason chart data
  const reasonData = useMemo(() => {
    const counts: Record<string, number> = {};
    cancellations.forEach(c => { counts[c.reason] = (counts[c.reason] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: REASON_LABELS[k] || k, value: v }));
  }, [cancellations]);

  // Cohort by month signed up vs canceled
  const cohortData = useMemo(() => {
    const months: Record<string, { month: string; canceled: number; stayed: number }> = {};
    cancellations.forEach(c => {
      const m = new Date(c.created_at).toISOString().slice(0, 7);
      if (!months[m]) months[m] = { month: m, canceled: 0, stayed: 0 };
      if (c.final_action === "canceled") months[m].canceled++;
      else months[m].stayed++;
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
  }, [cancellations]);

  // Heatmap (day of week)
  const heatmapData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = new Array(7).fill(0);
    cancellations.filter(c => c.final_action === "canceled").forEach(c => {
      counts[new Date(c.created_at).getDay()]++;
    });
    return days.map((d, i) => ({ day: d, cancels: counts[i] }));
  }, [cancellations]);

  // Country
  const countryData = useMemo(() => {
    const counts: Record<string, number> = {};
    cancellations.forEach(c => { const k = c.country || "Unknown"; counts[k] = (counts[k] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: k, value: v })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [cancellations]);

  // Industry
  const industryData = useMemo(() => {
    const counts: Record<string, number> = {};
    cancellations.forEach(c => { const k = c.industry || "unknown"; counts[k] = (counts[k] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: k, value: v }));
  }, [cancellations]);

  // Plan churn
  const planData = useMemo(() => {
    const counts: Record<string, { plan: string; canceled: number; total: number }> = {};
    cancellations.forEach(c => {
      const p = c.plan || "unknown";
      if (!counts[p]) counts[p] = { plan: p, canceled: 0, total: 0 };
      counts[p].total++;
      if (c.final_action === "canceled") counts[p].canceled++;
    });
    return Object.values(counts);
  }, [cancellations]);

  const runScoring = async () => {
    setScoring(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await invokeShim("churn-risk-score", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      toast.success(`Scored ${data.scored} users`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally { setScoring(false); }
  };

  const runAiSummary = async () => {
    setAiLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("exit-survey-summary", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      setAiSummary(data);
    } catch (e: any) { toast.error(e?.message || "Failed"); }
    finally { setAiLoading(false); }
  };

  const createCampaign = async () => {
    if (!newCampaign.name) { toast.error("Name required"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("win_back_campaigns").insert({ ...newCampaign, created_by: user.id, status: "active" });
    if (error) { toast.error(error.message); return; }
    toast.success("Campaign created");
    setNewCampaign({ name: "", campaign_type: "discount", discount_percent: 20, target_audience: "all_canceled", message: "" });
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={TrendingDown} color="text-rose-500" label="Monthly Churn" value={`${metrics.churnRate}%`} />
        <MetricCard icon={DollarSign} color="text-rose-500" label="Lost MRR" value={`$${metrics.lostMrr.toLocaleString()}`} />
        <MetricCard icon={TrendingUp} color="text-emerald-500" label="Saved MRR" value={`$${metrics.savedMrr.toLocaleString()}`} />
        <MetricCard icon={AlertTriangle} color="text-amber-500" label="At-Risk Users" value={metrics.atRisk} />
        <MetricCard icon={Users} color="text-primary" label="Active Users" value={profiles.length} />
        <MetricCard icon={PauseCircle} color="text-cyan-500" label="Paused" value={pauses.filter(p => p.status === "active").length} />
        <MetricCard icon={ArrowDown} color="text-amber-500" label="Downgrades" value={metrics.downgraded} />
        <MetricCard icon={RefreshCw} color="text-purple-500" label="Net Retention" value={`${Math.max(0, 100 - metrics.churnRate)}%`} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview" className="text-xs">Analytics</TabsTrigger>
          <TabsTrigger value="atrisk" className="text-xs">At-Risk</TabsTrigger>
          <TabsTrigger value="recovery" className="text-xs">Revenue Recovery</TabsTrigger>
          <TabsTrigger value="campaigns" className="text-xs">Campaigns</TabsTrigger>
          <TabsTrigger value="ai" className="text-xs">AI Insights</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Cancellation Reasons</CardTitle></CardHeader>
              <CardContent>
                {reasonData.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={reasonData} dataKey="value" nameKey="name" outerRadius={80} label>
                        {reasonData.map((_, i) => <Cell key={i} fill={REASON_COLORS[i % REASON_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Cohort Retention (by signup month)</CardTitle></CardHeader>
              <CardContent>
                {cohortData.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={cohortData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="stayed" stroke="hsl(160 60% 45%)" />
                      <Line type="monotone" dataKey="canceled" stroke="hsl(0 70% 60%)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Cancellation Heatmap (day of week)</CardTitle></CardHeader>
              <CardContent>
                {heatmapData.every(d => d.cancels === 0) ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={heatmapData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="cancels" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Globe2 className="w-4 h-4" /> Churn by Country</CardTitle></CardHeader>
              <CardContent>
                {countryData.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={countryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(217 91% 60%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Briefcase className="w-4 h-4" /> Churn by Industry</CardTitle></CardHeader>
              <CardContent>
                {industryData.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={industryData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(280 70% 60%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" /> Churn Leaderboard by Plan</CardTitle></CardHeader>
              <CardContent>
                {planData.length === 0 ? <Empty /> : (
                  <div className="space-y-3">
                    {planData.map(p => {
                      const rate = p.total > 0 ? Math.round((p.canceled / p.total) * 100) : 0;
                      return (
                        <div key={p.plan} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize font-medium">{p.plan}</span>
                            <span className="text-muted-foreground">{p.canceled}/{p.total} · {rate}%</span>
                          </div>
                          <Progress value={rate} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AT-RISK USERS */}
        <TabsContent value="atrisk">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Brain className="w-4 h-4 text-purple-500" /> AI Churn Prediction</CardTitle>
              <Button size="sm" onClick={runScoring} disabled={scoring}>
                {scoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                Re-score all users
              </Button>
            </CardHeader>
            <CardContent>
              {risks.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No risk scores yet. Click "Re-score all users" to run the AI churn engine.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {risks.slice(0, 50).map(r => {
                    const profile = profileMap[r.user_id];
                    const color = r.risk_score >= 70 ? "text-rose-500" : r.risk_score >= 40 ? "text-amber-500" : "text-emerald-500";
                    return (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{profile?.display_name || profile?.company_name || "User"}</p>
                          <p className="text-xs text-muted-foreground">{r.suggested_action}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${color}`}>{r.risk_score}</p>
                          <p className="text-[10px] text-muted-foreground">{r.cancel_probability}% prob</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* REVENUE RECOVERY */}
        <TabsContent value="recovery">
          <Card>
            <CardHeader><CardTitle className="text-sm">Recently Canceled Users</CardTitle></CardHeader>
            <CardContent>
              {cancellations.filter(c => c.final_action === "canceled").length === 0 ? <Empty /> : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {cancellations.filter(c => c.final_action === "canceled").slice(0, 30).map(c => {
                    const p = profileMap[c.user_id];
                    const reactProb = Math.max(10, 80 - (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={c.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{p?.display_name || "User"} <Badge variant="outline" className="ml-2 text-[10px]">{REASON_LABELS[c.reason]}</Badge></p>
                            <p className="text-xs text-muted-foreground mt-0.5">{new Date(c.created_at).toLocaleDateString()} · {c.plan} plan</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-500">{Math.round(reactProb)}%</p>
                            <p className="text-[10px] text-muted-foreground">reactivation</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CAMPAIGNS */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Send className="w-4 h-4 text-primary" /> New Win-Back Campaign</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Campaign name (e.g. Spring Comeback Offer)" value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Discount %" value={newCampaign.discount_percent} onChange={e => setNewCampaign({ ...newCampaign, discount_percent: Number(e.target.value) })} />
                <select className="px-3 py-2 rounded-md border bg-background text-sm" value={newCampaign.target_audience} onChange={e => setNewCampaign({ ...newCampaign, target_audience: e.target.value })}>
                  <option value="all_canceled">All canceled users</option>
                  <option value="high_value">High-value users</option>
                  <option value="specific_reason">Specific reason</option>
                </select>
              </div>
              <Textarea placeholder="Message to send..." value={newCampaign.message} onChange={e => setNewCampaign({ ...newCampaign, message: e.target.value })} rows={3} />
              <Button onClick={createCampaign}><Send className="w-3.5 h-3.5 mr-1" /> Create Campaign</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Active Campaigns</CardTitle></CardHeader>
            <CardContent>
              {campaigns.length === 0 ? <Empty /> : (
                <div className="space-y-2">
                  {campaigns.map(c => (
                    <div key={c.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.target_audience} · {c.discount_percent}% off</p>
                        </div>
                        <Badge>{c.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI INSIGHTS */}
        <TabsContent value="ai">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-500" /> AI Exit Survey Summary</CardTitle>
              <Button size="sm" onClick={runAiSummary} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5 mr-1" />}
                Generate AI Summary
              </Button>
            </CardHeader>
            <CardContent>
              {!aiSummary ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Click "Generate AI Summary" to analyze {surveys.length + cancellations.length} feedback entries.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground mb-1">Summary</p>
                    <p className="text-sm">{aiSummary.summary}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground mb-1">Top reasons</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(aiSummary.top_reasons || []).map((r: string, i: number) => <Badge key={i} variant="outline">{r}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground mb-1">Product recommendations</p>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      {(aiSummary.product_recommendations || []).map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                  <Badge className="bg-primary/15 text-primary border-primary/30">Sentiment: {aiSummary.sentiment}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ icon: Icon, color, label, value }: { icon: any; color: string; label: string; value: any }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1"><Icon className={`w-3.5 h-3.5 ${color}`} /><span className="text-[10px] uppercase font-semibold text-muted-foreground">{label}</span></div>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Empty() {
  return <div className="text-center py-8 text-sm text-muted-foreground">No data yet</div>;
}