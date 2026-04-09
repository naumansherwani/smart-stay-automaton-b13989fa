import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, Zap, DollarSign, BarChart3, Pencil, Check, X, Brain, Hand } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { IndustryConfig } from "@/lib/industryConfig";
import { supportsAutoPricing } from "@/lib/industryFeatures";
import { calculateSmartPrice } from "@/lib/bookingStore";
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

const AutoPricingPanel = ({ config, industry }: AutoPricingPanelProps) => {
  const { user } = useAuth();
  const aiSupported = supportsAutoPricing(industry);
  const [mode, setMode] = useState<PricingMode>(aiSupported ? "ai" : "manual");
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

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

  const nextDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const priceSuggestions = nextDays.map(date => {
    const key = date.toISOString().split("T")[0];
    const suggestion = calculateSmartPrice(basePrice, date);
    const hasOverride = key in overrides;
    const finalPrice = hasOverride
      ? overrides[key]
      : mode === "ai"
      ? suggestion.suggestedPrice
      : basePrice;
    const diff = finalPrice - basePrice;
    const pct = basePrice > 0 ? Math.round((diff / basePrice) * 100) : 0;
    return { date, key, suggestion, finalPrice, diff, pct, hasOverride };
  });

  const totalRevenue = priceSuggestions.reduce((sum, p) => sum + p.finalPrice, 0);
  const baseRevenue = basePrice * 14;
  const revenueGain = totalRevenue - baseRevenue;
  const avgChange = Math.round(priceSuggestions.reduce((s, p) => s + p.pct, 0) / priceSuggestions.length);

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

  const clearOverride = (key: string) => {
    setOverrides(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

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
              <h2 className="text-lg font-bold text-foreground">Pricing Manager</h2>
              <p className="text-sm text-muted-foreground">
                Set prices for your {config.resourceLabelPlural.toLowerCase()}
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
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-muted-foreground cursor-not-allowed opacity-50">
                <Brain className="w-3.5 h-3.5" /> AI (N/A for {config.label})
              </div>
            )}
          </div>
        </div>
        {!aiSupported && (
          <p className="text-xs text-muted-foreground mt-3 bg-muted/50 rounded-lg px-3 py-2">
            AI dynamic pricing is designed for demand-driven industries (Hospitality, Car Rental, Events). 
            You can still set manual prices per day for your {config.resourceLabelPlural.toLowerCase()}.
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            {Object.keys(overrides).length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setOverrides({})}>
                Clear all overrides
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Add a {config.resourceLabel.toLowerCase()} with a base price to see pricing.
            </p>
          ) : (
            <div className="space-y-2">
              {priceSuggestions.map(({ date, key, suggestion, finalPrice, diff, pct, hasOverride }) => (
                <div
                  key={key}
                  className={`flex items-center justify-between py-2.5 px-4 rounded-lg transition-colors ${
                    hasOverride
                      ? "bg-warning/10 border border-warning/20"
                      : "bg-secondary/50 hover:bg-secondary"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {hasOverride
                        ? "Manual override"
                        : mode === "ai"
                        ? suggestion.reasoning
                        : "Base rate"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {mode === "ai" && !hasOverride && (
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
                        <span className="text-sm font-bold text-foreground">${finalPrice}</span>
                        {diff !== 0 && (
                          <span className={`flex items-center text-xs font-medium ${
                            diff > 0 ? "text-success" : "text-destructive"
                          }`}>
                            {diff > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                            {pct > 0 ? "+" : ""}{pct}%
                          </span>
                        )}
                        {diff === 0 && !hasOverride && (
                          <span className="flex items-center text-xs text-muted-foreground">
                            <Minus className="w-3 h-3 mr-0.5" />0%
                          </span>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-60 hover:opacity-100"
                          onClick={() => startEdit(key, finalPrice)}
                          title="Override price"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        {hasOverride && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 opacity-60 hover:opacity-100"
                            onClick={() => clearOverride(key)}
                            title="Remove override"
                          >
                            <X className="w-3 h-3" />
                          </Button>
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
            <CardTitle className="text-sm">How AI Pricing Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex gap-2 items-start">
                <div className="w-2 h-2 rounded-full bg-success mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Demand-Based</p>
                  <p className="text-xs text-muted-foreground">Prices increase when booking volume is high</p>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Time-Based</p>
                  <p className="text-xs text-muted-foreground">Weekend premiums, weekday discounts</p>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <div className="w-2 h-2 rounded-full bg-warning mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Seasonality</p>
                  <p className="text-xs text-muted-foreground">Peak, high, shoulder & low season rates</p>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Availability</p>
                  <p className="text-xs text-muted-foreground">Lowers prices to fill empty slots</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              💡 You can override any AI suggestion by clicking the pencil icon next to any price.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutoPricingPanel;
