import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Bell, Check, X, Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";

const PriceAlertsPanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["price-alerts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("price_alerts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("price_alerts")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["price-alerts"] }),
  });

  const applyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("price_alerts")
        .update({ is_applied: true, is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
      toast.success("Price suggestion applied!");
    },
  });

  const dismissAll = async () => {
    if (!user || alerts.length === 0) return;
    const ids = alerts.map((a: any) => a.id);
    await supabase
      .from("price_alerts")
      .update({ is_read: true })
      .in("id", ids);
    queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
    toast.success("All alerts dismissed");
  };

  if (isLoading || alerts.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            AI Price Alerts
            <Badge variant="default" className="text-[10px] h-5">{alerts.length}</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={dismissAll}>
            Dismiss All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert: any) => {
          const isIncrease = alert.change_percent > 0;
          return (
            <div
              key={alert.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                isIncrease
                  ? "bg-success/5 border-success/20"
                  : "bg-destructive/5 border-destructive/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isIncrease ? "bg-success/10" : "bg-destructive/10"
                }`}>
                  {isIncrease
                    ? <TrendingUp className="w-4 h-4 text-success" />
                    : <TrendingDown className="w-4 h-4 text-destructive" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{alert.resource_name}</span>
                    <Badge variant="outline" className={`text-[9px] h-4 ${
                      isIncrease ? "border-success/40 text-success" : "border-destructive/40 text-destructive"
                    }`}>
                      {isIncrease ? "+" : ""}{alert.change_percent}%
                    </Badge>
                    <Badge variant="outline" className="text-[9px] h-4">
                      {alert.confidence}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ${alert.current_price} → <span className="font-bold">${alert.suggested_price}</span>
                    {" · "}{alert.reasoning}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(alert.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-success hover:bg-success/10"
                  onClick={() => applyMutation.mutate(alert.id)}
                  title="Apply suggestion"
                >
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:bg-secondary"
                  onClick={() => markReadMutation.mutate(alert.id)}
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default PriceAlertsPanel;
