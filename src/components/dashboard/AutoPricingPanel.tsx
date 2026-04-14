import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, Zap, DollarSign, BarChart3, Pencil, Check, X, Brain, Hand, RotateCcw, Info, RefreshCw, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { IndustryConfig } from "@/lib/industryConfig";
import { supportsAutoPricing } from "@/lib/industryFeatures";
import { calculateSmartPrice } from "@/lib/bookingStore";
import { useAiPricing, type AiPriceSuggestion } from "@/hooks/useAiPricing";
import type { IndustryType } from "@/lib/industryConfig";

interface AutoPricingPanelProps {
  config: IndustryConfig;
  industry: IndustryType;
}

interface Resource {
  id: string;
  name: string;
  base_price: number | null;
}

type PricingMode = "ai" | "manual";

export interface PriceOverrides {
  [dateKey: string]: number;
}

export interface PricingState {
  mode: PricingMode;
  overrides: PriceOverrides;
  basePrice: number;
  aiSupported: boolean;
}

// Export helper for calendar integration
export function getDayPrice(
  basePrice: number,
  date: Date,
  mode: PricingMode,
  overrides: PriceOverrides,
  aiSupported: boolean,
  aiSuggestions?: AiPriceSuggestion[]
): { price: number; isOverride: boolean; isAI: boolean; reasoning: string; confidence?: string } {
  const key = date.toISOString().split("T")[0];
  if (key in overrides) {
    return { price: overrides[key], isOverride: true, isAI: false, reasoning: "Manual override" };
  }
  if (mode === "ai" && aiSupported && aiSuggestions?.length) {
    const match = aiSuggestions.find(s => s.date === key);
    if (match) {
      return { price: match.suggestedPrice, isOverride: false, isAI: true, reasoning: match.reasoning, confidence: match.confidence };
    }
  }
  if (mode === "ai" && aiSupported) {
    const suggestion = calculateSmartPrice(basePrice, date);
    return { price: suggestion.suggestedPrice, isOverride: false, isAI: true, reasoning: suggestion.reasoning };
  }
  return { price: basePrice, isOverride: false, isAI: false, reasoning: "Base rate" };
}

const AutoPricingPanel = ({ config, industry }: AutoPricingPanelProps) => {
  const { user } = useAuth();
  const aiSupported = supportsAutoPricing(industry);
  const [mode, setMode] = useState<PricingMode>(aiSupported ? "ai" : "manual");
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<PriceOverrides>({});
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: aiData, loading: aiLoading, fetchPricing } = useAiPricing({ industry });

  useEffect(() => {
    if (!aiSupported) setMode("manual");
  }, [aiSupported]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("resources")
        .select("id, name, base_price")
        .eq("user_id", user.id);
      if (data && data.length > 0) {
        setResources(data);
        setSelectedResource(data[0].id);
      }
    };
    fetch();
  }, [user]);

  const resource = resources.find(r => r.id === selectedResource);
  const basePrice = resource?.base_price || 100;

  // Fetch AI pricing when resource or mode changes
  const handleFetchAiPricing = () => {
    if (!aiSupported || mode !== "ai" || !resource) return;
    fetchPricing(
      [{ name: resource.name, basePrice }],
      { days: 14 }
    );
  };

  useEffect(() => {
    if (mode === "ai" && aiSupported && resource) {
      handleFetchAiPricing();
    }
  }, [mode, selectedResource]);

  const aiSuggestions = aiData?.suggestions?.filter(s => s.resourceName === resource?.name) || [];

  const nextDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const priceSuggestions = nextDays.map(date => {
    const dayPrice = getDayPrice(basePrice, date, mode, overrides, aiSupported, aiSuggestions);
    const key = date.toISOString().split("T")[0];
    const diff = dayPrice.price - basePrice;
    const pct = basePrice > 0 ? Math.round((diff / basePrice) * 100) : 0;
    return { date, key, ...dayPrice, diff, pct };
  });

  const totalRevenue = priceSuggestions.reduce((sum, p) => sum + p.price, 0);
  const baseRevenue = basePrice * 14;
  const revenueGain = totalRevenue - baseRevenue;
  const avgChange = Math.round(priceSuggestions.reduce((s, p) => s + p.pct, 0) / priceSuggestions.length);
  const overrideCount = Object.keys(overrides).length;

  const startEdit = (key: string, currentPrice: number) => {
    setEditingDate(key);
    setEditValue(String(currentPrice));
  };

  const confirmEdit = (key: string) => {
    const val = parseInt(editValue);
    if (!isNaN(val) && val > 0) {
      setOverrides(prev => ({ ...prev, [key]: val }));
    }
    setEditingDate(null);
  };

  const resetOverride = (key: string) => {
    setOverrides(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resetAllOverrides = () => setOverrides({});

  return (
    <div className="space-y-6">
      {/* Header with mode selector */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-transparent rounded-xl p-5 border border-primary/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">AI Pricing Manager</h2>
              <p className="text-sm text-muted-foreground">
                AI-powered dynamic pricing for your {config.resourceLabelPlural.toLowerCase()}
              </p>
            </div>
          </div>
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setMode("manual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === "manual"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Hand className="w-3.5 h-3.5" /> Manual
            </button>
            {aiSupported ? (
              <button
                onClick={() => setMode("ai")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === "ai"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Brain className="w-3.5 h-3.5" /> AI Pricing
              </button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-muted-foreground cursor-not-allowed opacity-40">
                    <Brain className="w-3.5 h-3.5" /> AI Pricing
                    <Info className="w-3 h-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px]">
                  <p className="text-xs">AI pricing is not available for this industry.</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        {mode === "ai" && aiSupported && (
          <div className="flex items-center justify-between mt-3 bg-success/5 rounded-lg px-3 py-2 border border-success/10">
            <p className="text-xs text-muted-foreground">
              🤖 AI is analyzing demand, seasonality & competitor data. Manual overrides always take priority.
            </p>
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={handleFetchAiPricing} disabled={aiLoading}>
              <RefreshCw className={`w-3 h-3 ${aiLoading ? "animate-spin" : ""}`} />
              {aiLoading ? "Analyzing..." : "Refresh AI"}
            </Button>
          </div>
        )}
      </div>

      {/* AI Market Insight */}
      {mode === "ai" && aiData?.marketInsight && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">AI Market Insight</p>
                <p className="text-xs text-muted-foreground">{aiData.marketInsight}</p>
                {aiData.recommendedAction && (
                  <p className="text-xs text-primary mt-2 font-medium">💡 {aiData.recommendedAction}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Price Change</p>
                <p className="text-xl font-bold text-foreground">
                  {avgChange > 0 ? "+" : ""}{avgChange}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">14-Day Revenue</p>
                <p className="text-xl font-bold text-foreground">${totalRevenue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">vs Base Price</p>
                <p className={`text-xl font-bold ${revenueGain > 0 ? "text-success" : revenueGain < 0 ? "text-destructive" : "text-foreground"}`}>
                  {revenueGain > 0 ? "+" : ""}${revenueGain}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Manual Overrides</p>
                <p className="text-xl font-bold text-foreground">{overrideCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Selector */}
      {resources.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {resources.map(r => (
            <Button
              key={r.id}
              variant={selectedResource === r.id ? "default" : "outline"}
              size="sm"
              onClick={() => { setSelectedResource(r.id); setOverrides({}); }}
            >
              {r.name}
            </Button>
          ))}
        </div>
      )}

      {/* Price Grid */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              {mode === "ai" ? <Zap className="w-4 h-4 text-primary" /> : <Pencil className="w-4 h-4 text-primary" />}
              {mode === "ai" ? "AI Price Suggestions" : "Manual Pricing"} — Next 14 Days
              {resource && (
                <Badge variant="outline" className="ml-2">{resource.name} · Base: ${basePrice}</Badge>
              )}
            </CardTitle>
            {overrideCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={resetAllOverrides}>
                <RotateCcw className="w-3 h-3" /> Reset all ({overrideCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {aiLoading && mode === "ai" ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">AI is analyzing market data and generating pricing...</p>
            </div>
          ) : resources.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Add a {config.resourceLabel.toLowerCase()} with a base price to see pricing.
            </p>
          ) : (
            <div className="space-y-2">
              {priceSuggestions.map(({ date, key, price, isOverride, isAI, reasoning, diff, pct, confidence }) => (
                <div
                  key={key}
                  className={`flex items-center justify-between py-2.5 px-4 rounded-lg transition-colors ${
                    isOverride
                      ? "bg-warning/10 border border-warning/30 ring-1 ring-warning/10"
                      : isAI
                      ? "bg-primary/5 border border-primary/10"
                      : "bg-secondary/50 hover:bg-secondary"
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      {isOverride && (
                        <Badge variant="outline" className="text-[9px] h-4 border-warning/40 text-warning bg-warning/5">
                          OVERRIDE
                        </Badge>
                      )}
                      {isAI && !isOverride && (
                        <Badge variant="outline" className="text-[9px] h-4 border-primary/40 text-primary bg-primary/5">
                          AI {confidence ? `· ${confidence}` : ""}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{reasoning}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(isAI || isOverride) && (
                      <span className="text-xs text-muted-foreground line-through">${basePrice}</span>
                    )}

                    {editingDate === key ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">$</span>
                        <Input
                          className="w-20 h-7 text-sm"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") confirmEdit(key); if (e.key === "Escape") setEditingDate(null); }}
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => confirmEdit(key)}>
                          <Check className="w-3.5 h-3.5 text-success" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingDate(null)}>
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className={`text-sm font-bold ${isOverride ? "text-warning" : "text-foreground"}`}>${price}</span>
                        {diff !== 0 && (
                          <span className={`flex items-center text-xs font-medium ${
                            diff > 0 ? "text-success" : "text-destructive"
                          }`}>
                            {diff > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                            {pct > 0 ? "+" : ""}{pct}%
                          </span>
                        )}
                        {diff === 0 && !isOverride && (
                          <span className="flex items-center text-xs text-muted-foreground">
                            <Minus className="w-3 h-3 mr-0.5" />0%
                          </span>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 opacity-60 hover:opacity-100"
                              onClick={() => startEdit(key, price)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p className="text-xs">Override price for this day</p></TooltipContent>
                        </Tooltip>
                        {isOverride && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 opacity-60 hover:opacity-100"
                                onClick={() => resetOverride(key)}
                              >
                                <RotateCcw className="w-3 h-3 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Reset to {mode === "ai" ? "AI suggested" : "base"} price</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Logic Explanation - only for AI mode */}
      {mode === "ai" && aiSupported && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              How AI Pricing Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex gap-2 items-start">
                <div className="w-2 h-2 rounded-full bg-success mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Season & Demand</p>
                  <p className="text-xs text-muted-foreground">AI analyzes seasonal trends and booking velocity to adjust prices</p>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Competitor Analysis</p>
                  <p className="text-xs text-muted-foreground">Factors in competitor pricing to keep you competitive</p>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <div className="w-2 h-2 rounded-full bg-warning mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Day & Time Patterns</p>
                  <p className="text-xs text-muted-foreground">Weekend premiums, weekday discounts, holiday surges</p>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Occupancy Optimization</p>
                  <p className="text-xs text-muted-foreground">Lowers prices to fill empty slots, raises for high-demand</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              💡 Manual overrides always take priority. AI will never overwrite your manual prices.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutoPricingPanel;
