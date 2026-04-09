import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, Zap, DollarSign, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { IndustryConfig } from "@/lib/industryConfig";
import { calculateSmartPrice, getSeason, isWeekend } from "@/lib/bookingStore";

interface AutoPricingPanelProps {
  config: IndustryConfig;
}

interface Resource {
  id: string;
  name: string;
  base_price: number | null;
}

const AutoPricingPanel = ({ config }: AutoPricingPanelProps) => {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);

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
    const suggestion = calculateSmartPrice(basePrice, date);
    const diff = suggestion.suggestedPrice - suggestion.basePrice;
    const pct = Math.round((diff / suggestion.basePrice) * 100);
    return { date, suggestion, diff, pct };
  });

  const avgIncrease = Math.round(
    priceSuggestions.reduce((sum, p) => sum + p.pct, 0) / priceSuggestions.length
  );

  const potentialRevenue = priceSuggestions.reduce((sum, p) => sum + (enabled ? p.suggestion.suggestedPrice : basePrice), 0);
  const baseRevenue = basePrice * 14;
  const revenueGain = potentialRevenue - baseRevenue;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-transparent rounded-xl p-5 border border-primary/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">AI Auto Pricing</h2>
              <p className="text-sm text-muted-foreground">
                Dynamic pricing for your {config.resourceLabelPlural.toLowerCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {enabled ? "Active" : "Disabled"}
            </span>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
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
                  {avgIncrease > 0 ? "+" : ""}{avgIncrease}%
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
                <p className="text-xs text-muted-foreground">14-Day Revenue (AI)</p>
                <p className="text-xl font-bold text-foreground">${potentialRevenue}</p>
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
                <p className="text-xs text-muted-foreground">Extra Revenue</p>
                <p className={`text-xl font-bold ${revenueGain > 0 ? "text-success" : "text-foreground"}`}>
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
              onClick={() => setSelectedResource(r.id)}
            >
              {r.name}
            </Button>
          ))}
        </div>
      )}

      {/* Price Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            AI Price Suggestions — Next 14 Days
            {resource && (
              <Badge variant="outline" className="ml-2">{resource.name} · Base: ${basePrice}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Add a {config.resourceLabel.toLowerCase()} with a base price to see pricing suggestions.
            </p>
          ) : (
            <div className="space-y-2">
              {priceSuggestions.map(({ date, suggestion, diff, pct }) => (
                <div
                  key={date.toISOString()}
                  className={`flex items-center justify-between py-2.5 px-4 rounded-lg transition-colors ${
                    enabled
                      ? "bg-secondary/50 hover:bg-secondary"
                      : "bg-muted/30 opacity-60"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span className="text-xs text-muted-foreground">{suggestion.reasoning}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground line-through">${suggestion.basePrice}</span>
                    <span className="text-sm font-bold text-foreground">
                      ${enabled ? suggestion.suggestedPrice : suggestion.basePrice}
                    </span>
                    {enabled && (
                      <span className={`flex items-center text-xs font-medium ${
                        diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-muted-foreground"
                      }`}>
                        {diff > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> :
                         diff < 0 ? <TrendingDown className="w-3 h-3 mr-0.5" /> :
                         <Minus className="w-3 h-3 mr-0.5" />}
                        {pct > 0 ? "+" : ""}{pct}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Logic Explanation */}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoPricingPanel;
