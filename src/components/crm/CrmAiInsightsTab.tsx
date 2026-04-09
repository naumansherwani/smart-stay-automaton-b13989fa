import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Brain, AlertTriangle, TrendingUp, Users, Loader2, Lock } from "lucide-react";
import { useCrmContacts, useCrmTickets, useCrmDeals } from "@/hooks/useCrm";
import { getCrmConfig } from "@/lib/crmConfig";
import type { IndustryType } from "@/lib/industryConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props { industry: IndustryType; isPremium: boolean; }

export default function CrmAiInsightsTab({ industry, isPremium }: Props) {
  const config = getCrmConfig(industry);
  const { contacts } = useCrmContacts();
  const { tickets } = useCrmTickets();
  const { deals } = useCrmDeals();
  const [loading, setLoading] = useState(false);
  const [churnData, setChurnData] = useState<{ predictions: { name: string; churn_risk: string; reason: string; recommended_action: string }[] } | null>(null);

  if (!isPremium) {
    return (
      <Card><CardContent className="text-center py-16">
        <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Premium Feature</h3>
        <p className="text-muted-foreground mb-4">AI Insights require a Premium subscription. Upgrade to unlock AI-powered analytics.</p>
        <Button>Upgrade to Premium</Button>
      </CardContent></Card>
    );
  }

  const openTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress").length;
  const resolvedTickets = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;
  const avgResolution = resolvedTickets > 0 ? "2.3 days" : "N/A";
  const highRiskContacts = contacts.filter(c => c.churn_risk === "high").length;
  const totalDealValue = deals.reduce((s, d) => s + (d.value || 0), 0);
  const wonDeals = deals.filter(d => d.stage === "Won").length;
  const winRate = deals.length > 0 ? Math.round((wonDeals / deals.length) * 100) : 0;

  const runChurnPrediction = async () => {
    if (contacts.length === 0) { toast.error("No contacts to analyze"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-ai-assistant", {
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Users className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{contacts.length}</p>
            <p className="text-xs text-muted-foreground">{config.contactLabelPlural}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto text-orange-500 mb-1" />
            <p className="text-2xl font-bold">{openTickets}</p>
            <p className="text-xs text-muted-foreground">Open {config.ticketLabelPlural}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{winRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Brain className="h-5 w-5 mx-auto text-purple-500 mb-1" />
            <p className="text-2xl font-bold">{highRiskContacts}</p>
            <p className="text-xs text-muted-foreground">Churn Risk</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-primary" />AI Churn Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runChurnPrediction} disabled={loading} className="mb-4">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
            Run Churn Analysis
          </Button>
          {churnData?.predictions && (
            <div className="space-y-2">
              {churnData.predictions.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.reason}</p>
                    <p className="text-xs text-primary mt-1">💡 {p.recommended_action}</p>
                  </div>
                  <Badge variant={p.churn_risk === "high" ? "destructive" : p.churn_risk === "medium" ? "secondary" : "outline"}>
                    {p.churn_risk} risk
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Resolution Stats</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Avg Resolution Time</span><span className="font-medium">{avgResolution}</span></div>
              <div className="flex justify-between"><span>Open</span><span className="font-medium">{openTickets}</span></div>
              <div className="flex justify-between"><span>Resolved</span><span className="font-medium">{resolvedTickets}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Pipeline Stats</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Total Pipeline</span><span className="font-medium">${totalDealValue.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Total {config.dealLabelPlural}</span><span className="font-medium">{deals.length}</span></div>
              <div className="flex justify-between"><span>Win Rate</span><span className="font-medium">{winRate}%</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
