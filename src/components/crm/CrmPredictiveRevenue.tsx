import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Loader2, Sparkles, ArrowUp, ArrowDown, Target, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from "recharts";
import { useCrmDeals } from "@/hooks/useCrm";
import { supabase } from "@/integrations/supabase/client";
import { invokeShim } from "@/lib/replitApi";
import { toast } from "sonner";
import type { IndustryType } from "@/lib/industryConfig";

interface Props { industry: IndustryType; }

export default function CrmPredictiveRevenue({ industry }: Props) {
  const { deals } = useCrmDeals();
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<{
    monthly_forecast: { month: string; predicted: number; confidence_low: number; confidence_high: number }[];
    quarterly_total: number;
    growth_rate: number;
    key_factors: string[];
    recommendations: string[];
  } | null>(null);

  // Historical revenue by month
  const historicalData = useMemo(() => {
    const months: Record<string, number> = {};
    deals.forEach(d => {
      if (d.won_at && d.value) {
        const key = new Date(d.won_at).toLocaleDateString("en", { year: "numeric", month: "short" });
        months[key] = (months[key] || 0) + d.value;
      }
    });
    return Object.entries(months).map(([month, revenue]) => ({ month, revenue })).slice(-12);
  }, [deals]);

  const totalRevenue = deals.filter(d => d.stage === "Won").reduce((s, d) => s + (d.value || 0), 0);
  const avgDeal = deals.length > 0 ? Math.round(totalRevenue / Math.max(1, deals.filter(d => d.stage === "Won").length)) : 0;
  const pipelineValue = deals.filter(d => d.stage !== "Won" && d.stage !== "Lost").reduce((s, d) => s + (d.value || 0), 0);

  const runForecast = async () => {
    setLoading(true);
    try {
      const { data, error } = await invokeShim("crm-ai-assistant", {
        body: {
          action: "revenue_forecast",
          data: {
            industry,
            deals: deals.slice(0, 50).map(d => ({
              title: d.title, value: d.value, stage: d.stage, probability: d.probability,
              created_at: d.created_at, won_at: d.won_at, expected_close_date: d.expected_close_date,
            })),
            historical: historicalData,
          },
        },
      });
      if (error) throw error;
      setForecast(data);
      toast.success("Revenue forecast generated!");
    } catch {
      toast.error("Forecast generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold">Predictive Revenue Forecasting</h3>
          <Badge variant="secondary" className="text-[10px]">AI</Badge>
        </div>
        <Button onClick={runForecast} disabled={loading} size="sm">
          {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Analyzing...</> : <><Sparkles className="h-4 w-4 mr-1" />Generate Forecast</>}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <DollarSign className="h-4 w-4 mx-auto text-green-500 mb-1" />
          <p className="text-lg font-bold">${totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Total Won Revenue</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Target className="h-4 w-4 mx-auto text-blue-500 mb-1" />
          <p className="text-lg font-bold">${pipelineValue.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Pipeline Value</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <DollarSign className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-lg font-bold">${avgDeal.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Avg Deal Size</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          {forecast ? (
            <>
              {forecast.growth_rate >= 0 ? <ArrowUp className="h-4 w-4 mx-auto text-green-500 mb-1" /> : <ArrowDown className="h-4 w-4 mx-auto text-red-500 mb-1" />}
              <p className={`text-lg font-bold ${forecast.growth_rate >= 0 ? "text-green-600" : "text-red-600"}`}>{forecast.growth_rate >= 0 ? "+" : ""}{forecast.growth_rate}%</p>
              <p className="text-[10px] text-muted-foreground">Growth Rate</p>
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg font-bold">—</p>
              <p className="text-[10px] text-muted-foreground">Growth Rate</p>
            </>
          )}
        </CardContent></Card>
      </div>

      {/* Historical Revenue Chart */}
      {historicalData.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Historical Revenue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(168, 70%, 38%)" fill="hsl(168, 70%, 38%)" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* AI Forecast */}
      {forecast && (
        <>
          {forecast.monthly_forecast && forecast.monthly_forecast.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI Revenue Forecast (Next Quarter: ${forecast.quarterly_total?.toLocaleString()})</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={forecast.monthly_forecast}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                    <Legend />
                    <Area type="monotone" dataKey="confidence_high" stroke="none" fill="hsl(168, 70%, 38%)" fillOpacity={0.1} name="Upper Bound" />
                    <Area type="monotone" dataKey="predicted" stroke="hsl(168, 70%, 38%)" fill="hsl(168, 70%, 38%)" fillOpacity={0.3} name="Predicted" strokeWidth={2} />
                    <Area type="monotone" dataKey="confidence_low" stroke="none" fill="transparent" name="Lower Bound" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forecast.key_factors && forecast.key_factors.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Key Revenue Factors</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {forecast.key_factors.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <TrendingUp className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {forecast.recommendations && forecast.recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">AI Recommendations</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {forecast.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Sparkles className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {!forecast && !loading && (
        <Card><CardContent className="text-center py-12 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Click "Generate Forecast" to get AI-powered revenue predictions</p>
          <p className="text-xs mt-1">Based on your deal history, pipeline & industry trends</p>
        </CardContent></Card>
      )}
    </div>
  );
}
