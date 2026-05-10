import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Brain, AlertTriangle, TrendingUp, Users, Loader2, Lock, Target, DollarSign, BarChart3, Zap, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { useCrmContacts, useCrmTickets, useCrmDeals } from "@/hooks/useCrm";
import { getCrmConfig } from "@/lib/crmConfig";
import type { IndustryType } from "@/lib/industryConfig";
import { supabase } from "@/integrations/supabase/client";
import { invokeShim } from "@/lib/replitApi";
import { toast } from "sonner";

interface Props { industry: IndustryType; isPremium: boolean; }

export default function CrmAiInsightsTab({ industry, isPremium }: Props) {
  const config = getCrmConfig(industry);
  const { contacts } = useCrmContacts();
  const { tickets } = useCrmTickets();
  const { deals } = useCrmDeals();
  const [loading, setLoading] = useState(false);
  const [churnData, setChurnData] = useState<{ predictions: { name: string; churn_risk: string; reason: string; recommended_action: string }[] } | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);

  if (!isPremium) {
    return (
      <Card><CardContent className="text-center py-16">
        <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Premium Feature</h3>
        <p className="text-muted-foreground mb-4">AI Insights require a Premium subscription.</p>
        <Button>Upgrade to Premium</Button>
      </CardContent></Card>
    );
  }

  const openTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress").length;
  const resolvedTickets = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;
  const highRiskContacts = contacts.filter(c => c.churn_risk === "high").length;
  const totalDealValue = deals.reduce((s, d) => s + (d.value || 0), 0);
  const wonDeals = deals.filter(d => d.stage === "Won");
  const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;
  const avgDealSize = deals.length > 0 ? Math.round(totalDealValue / deals.length) : 0;
  const avgScore = contacts.length > 0 ? Math.round(contacts.reduce((s, c) => s + (c.ai_score || 0), 0) / contacts.length) : 0;

  // Performance radar
  const radarData = [
    { metric: "Contacts", value: Math.min(100, contacts.length * 5), fullMark: 100 },
    { metric: "Win Rate", value: winRate, fullMark: 100 },
    { metric: "AI Score", value: avgScore, fullMark: 100 },
    { metric: "Resolution", value: tickets.length > 0 ? Math.round((resolvedTickets / tickets.length) * 100) : 100, fullMark: 100 },
    { metric: "Pipeline", value: Math.min(100, deals.filter(d => d.stage !== "Won" && d.stage !== "Lost").length * 10), fullMark: 100 },
    { metric: "Engagement", value: Math.min(100, contacts.filter(c => c.last_contacted_at).length / Math.max(1, contacts.length) * 100), fullMark: 100 },
  ];

  // Stage conversion
  const stages = ["Lead", "Qualified", "Proposal", "Negotiation", "Won"];
  const conversionData = stages.map((stage, i) => {
    const count = deals.filter(d => stages.indexOf(d.stage) >= i).length;
    return { stage, count, pct: deals.length > 0 ? Math.round((count / deals.length) * 100) : 0 };
  });

  const runChurnPrediction = async () => {
    if (contacts.length === 0) { toast.error("No contacts to analyze"); return; }
    setLoading(true);
    try {
      const { data, error } = await invokeShim("crm-ai-assistant", {
        body: {
          action: "predict_churn",
          data: {
            industry,
            contacts: contacts.slice(0, 20).map(c => ({
              name: c.name, total_bookings: c.total_bookings, total_revenue: c.total_revenue,
              last_contacted_at: c.last_contacted_at, lifecycle_stage: c.lifecycle_stage,
            })),
          },
        },
      });
      if (error) throw error;
      setChurnData(data);
      toast.success("Churn analysis complete!");
    } catch {
      toast.error("AI analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const runAiScoring = async () => {
    if (contacts.length === 0) { toast.error("No contacts to score"); return; }
    setScoreLoading(true);
    try {
      const { data, error } = await invokeShim("crm-ai-assistant", {
        body: {
          action: "score_contacts",
          data: {
            industry,
            contacts: contacts.slice(0, 30).map(c => ({
              id: c.id, name: c.name, total_bookings: c.total_bookings, total_revenue: c.total_revenue,
              last_contacted_at: c.last_contacted_at, lifecycle_stage: c.lifecycle_stage, email: c.email,
            })),
          },
        },
      });
      if (error) throw error;
      toast.success("AI scoring complete! Refresh to see updated scores.");
    } catch {
      toast.error("AI scoring failed");
    } finally {
      setScoreLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card><CardContent className="p-3 text-center">
          <Users className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-xl font-bold">{contacts.length}</p>
          <p className="text-[10px] text-muted-foreground">{config.contactLabelPlural}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <AlertTriangle className="h-4 w-4 mx-auto text-orange-500 mb-1" />
          <p className="text-xl font-bold">{openTickets}</p>
          <p className="text-[10px] text-muted-foreground">Open {config.ticketLabelPlural}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <TrendingUp className="h-4 w-4 mx-auto text-green-500 mb-1" />
          <p className="text-xl font-bold">{winRate}%</p>
          <p className="text-[10px] text-muted-foreground">Win Rate</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Brain className="h-4 w-4 mx-auto text-purple-500 mb-1" />
          <p className="text-xl font-bold">{highRiskContacts}</p>
          <p className="text-[10px] text-muted-foreground">Churn Risk</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <DollarSign className="h-4 w-4 mx-auto text-green-600 mb-1" />
          <p className="text-xl font-bold">${avgDealSize.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Avg Deal Size</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Sparkles className="h-4 w-4 mx-auto text-yellow-500 mb-1" />
          <p className="text-xl font-bold">{avgScore}</p>
          <p className="text-[10px] text-muted-foreground">Avg AI Score</p>
        </CardContent></Card>
      </div>

      {/* AI Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={runChurnPrediction} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Brain className="h-4 w-4 mr-1" />}
          Churn Prediction
        </Button>
        <Button onClick={runAiScoring} disabled={scoreLoading} variant="outline" size="sm">
          {scoreLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          AI Score Contacts
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Performance Radar */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" />CRM Performance</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-muted" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                <Radar dataKey="value" stroke="hsl(168, 70%, 38%)" fill="hsl(168, 70%, 38%)" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-blue-500" />Conversion Funnel</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={conversionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip formatter={(v: number) => [v, "Deals"]} />
                <Bar dataKey="count" fill="hsl(168, 70%, 38%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Churn Predictions */}
      {churnData?.predictions && churnData.predictions.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI Churn Predictions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {churnData.predictions.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.reason}</p>
                    <p className="text-xs text-primary mt-1 flex items-center gap-1"><Zap className="h-3 w-3" />{p.recommended_action}</p>
                  </div>
                  <Badge variant={p.churn_risk === "high" ? "destructive" : p.churn_risk === "medium" ? "secondary" : "outline"} className="shrink-0 ml-3">
                    {p.churn_risk} risk
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Resolution Stats</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Open</span><span className="font-medium">{openTickets}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Resolved</span><span className="font-medium">{resolvedTickets}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Resolution Rate</span><span className="font-medium">{tickets.length > 0 ? Math.round(resolvedTickets / tickets.length * 100) : 0}%</span></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Pipeline Health</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Pipeline</span><span className="font-medium">${totalDealValue.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Won Revenue</span><span className="font-medium text-green-600">${wonDeals.reduce((s, d) => s + (d.value || 0), 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Win Rate</span><span className="font-medium">{winRate}%</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
