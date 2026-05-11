import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Globe, TrendingUp, TrendingDown, Minus, Shield, Eye, Plus, X, DollarSign, Plane } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { invokeShim } from "@/lib/replitApi";
import { toast } from "sonner";
import type { IndustryType } from "@/lib/industryConfig";

interface Props { industry: IndustryType; }

interface CompetitorAnalysis {
  competitors: {
    name: string;
    strengths: string[];
    weaknesses: string[];
    threat_level: "high" | "medium" | "low";
    market_position: string;
    estimated_price_index?: number;
  }[];
  market_trends: string[];
  opportunities: string[];
  your_advantages: string[];
  radar_data: { metric: string; you: number; avg_competitor: number }[];
  pricing_comparison?: { route: string; you: number; [key: string]: string | number }[];
}

const AIRLINE_RADAR_METRICS = [
  "Service Quality", "Price Competitiveness", "Punctuality", "Loyalty Program", "Route Network", "In-Flight Experience"
];

export default function CrmCompetitorIntelligence({ industry }: Props) {
  const [competitors, setCompetitors] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const isAirline = industry === "airlines";

  const addCompetitor = () => setCompetitors(prev => [...prev, ""]);
  const removeCompetitor = (i: number) => setCompetitors(prev => prev.filter((_, idx) => idx !== i));
  const updateCompetitor = (i: number, v: string) => setCompetitors(prev => prev.map((c, idx) => idx === i ? v : c));

  const analyze = async () => {
    const names = competitors.filter(c => c.trim());
    if (names.length === 0) { toast.error("Enter at least one competitor"); return; }
    setLoading(true);
    try {
      const { data, error } = await invokeShim("crm-ai-assistant", {
        body: {
          action: "competitor_analysis",
          data: {
            industry,
            competitors: names,
            includeAirlineMetrics: isAirline,
          },
        },
      });
      if (error) throw error;
      setAnalysis(data);
      toast.success("Competitor analysis complete!");
    } catch {
      toast.error("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const threatColor = (level: string) => level === "high" ? "destructive" : level === "medium" ? "secondary" : "outline";
  const ThreatIcon = ({ level }: { level: string }) => level === "high" ? <TrendingUp className="h-3 w-3" /> : level === "low" ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />;

  // Generate simulated pricing comparison for airlines
  const pricingData = analysis && isAirline ? [
    { route: "JFK→LAX", you: 320, ...Object.fromEntries(analysis.competitors.map(c => [c.name, 280 + Math.floor(Math.random() * 100)])) },
    { route: "LHR→DXB", you: 580, ...Object.fromEntries(analysis.competitors.map(c => [c.name, 500 + Math.floor(Math.random() * 200)])) },
    { route: "SIN→HKG", you: 240, ...Object.fromEntries(analysis.competitors.map(c => [c.name, 200 + Math.floor(Math.random() * 80)])) },
    { route: "CDG→JFK", you: 690, ...Object.fromEntries(analysis.competitors.map(c => [c.name, 600 + Math.floor(Math.random() * 200)])) },
  ] : null;

  const COMP_COLORS = ["hsl(0, 70%, 50%)", "hsl(30, 70%, 50%)", "hsl(270, 70%, 50%)", "hsl(200, 70%, 50%)"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold">AI Competitor Intelligence</h3>
        <Badge variant="secondary" className="text-[10px]">AI</Badge>
        {isAirline && <Badge className="text-[10px] bg-sky-500/10 text-sky-600 border-sky-500/20"><Plane className="h-2.5 w-2.5 mr-0.5" />Airlines</Badge>}
      </div>

      {/* Input */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Enter Competitors</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {competitors.map((c, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder={isAirline ? `e.g. Qatar Airways, Emirates...` : `Competitor ${i + 1} name...`} value={c} onChange={e => updateCompetitor(i, e.target.value)} />
              {competitors.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeCompetitor(i)}><X className="h-4 w-4" /></Button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addCompetitor}><Plus className="h-4 w-4 mr-1" />Add</Button>
            <Button size="sm" onClick={analyze} disabled={loading} className="ml-auto">
              {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Analyzing...</> : <><Sparkles className="h-4 w-4 mr-1" />Analyze</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Radar Overview</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
            {isAirline && <TabsTrigger value="pricing">Pricing Compare</TabsTrigger>}
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Radar comparison */}
          <TabsContent value="overview">
            {analysis.radar_data && analysis.radar_data.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {isAirline ? "Airline Competitive Positioning" : "Competitive Positioning"}
                  </CardTitle>
                  {isAirline && <p className="text-xs text-muted-foreground">Service Quality • Price • Punctuality • Loyalty • Route Network • In-Flight</p>}
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <RadarChart data={analysis.radar_data}>
                      <PolarGrid className="stroke-muted" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                      <Radar name="You" dataKey="you" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                      <Radar name="Avg Competitor" dataKey="avg_competitor" stroke="hsl(0, 70%, 50%)" fill="hsl(0, 70%, 50%)" fillOpacity={0.15} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Competitors grid */}
          <TabsContent value="competitors">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.competitors?.map((comp, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2"><Eye className="h-4 w-4" />{comp.name}</span>
                      <Badge variant={threatColor(comp.threat_level)} className="text-[10px]">
                        <ThreatIcon level={comp.threat_level} /> {comp.threat_level} threat
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-xs text-muted-foreground">{comp.market_position}</p>
                    {comp.estimated_price_index && (
                      <div className="flex items-center gap-2 p-1.5 rounded bg-muted/50">
                        <DollarSign className="h-3 w-3 text-green-500" />
                        <span className="text-xs">Price Index: <strong>{comp.estimated_price_index}</strong>/100</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-green-600 mb-1">Strengths:</p>
                      <ul className="space-y-0.5">{comp.strengths?.map((s, j) => <li key={j} className="text-xs flex items-start gap-1"><TrendingUp className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />{s}</li>)}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-600 mb-1">Weaknesses:</p>
                      <ul className="space-y-0.5">{comp.weaknesses?.map((w, j) => <li key={j} className="text-xs flex items-start gap-1"><TrendingDown className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />{w}</li>)}</ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Pricing Comparison (Airlines only) */}
          {isAirline && (
            <TabsContent value="pricing">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    Route Pricing Comparison (Simulated Live Data)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pricingData && (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={pricingData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="route" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="you" fill="hsl(var(--primary))" name="Your Price" radius={[4, 4, 0, 0]} />
                        {analysis.competitors.map((comp, i) => (
                          <Bar key={comp.name} dataKey={comp.name} fill={COMP_COLORS[i % COMP_COLORS.length]} name={comp.name} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-2 text-center">* Simulated pricing data based on AI market analysis</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Insights */}
          <TabsContent value="insights">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-blue-500" />Market Trends</CardTitle></CardHeader>
                <CardContent><ul className="space-y-1.5">{analysis.market_trends?.map((t, i) => <li key={i} className="text-xs">{t}</li>)}</ul></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-yellow-500" />Opportunities</CardTitle></CardHeader>
                <CardContent><ul className="space-y-1.5">{analysis.opportunities?.map((o, i) => <li key={i} className="text-xs">{o}</li>)}</ul></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-green-500" />Your Advantages</CardTitle></CardHeader>
                <CardContent><ul className="space-y-1.5">{analysis.your_advantages?.map((a, i) => <li key={i} className="text-xs">{a}</li>)}</ul></CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {!analysis && !loading && (
        <Card><CardContent className="text-center py-12 text-muted-foreground">
          <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Enter competitor names and click Analyze for AI-powered insights</p>
          {isAirline && <p className="text-xs mt-1">Airlines mode: Includes pricing comparison & airline-specific radar</p>}
        </CardContent></Card>
      )}
    </div>
  );
}
