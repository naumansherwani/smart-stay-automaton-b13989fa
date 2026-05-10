import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Brain, Sparkles, Calendar, Zap, Clock, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { replitCall } from "@/lib/replitApi";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { IndustryConfig } from "@/lib/industryConfig";

interface AIAutoScheduleProps {
  config: IndustryConfig;
}

interface ScheduleSuggestion {
  date: string;
  time_start: string;
  time_end: string;
  resource: string;
  client_type: string;
  predicted_demand: "high" | "medium" | "low";
  suggested_price: number;
  reason: string;
}

const AIAutoSchedule = ({ config }: AIAutoScheduleProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([]);
  const [period, setPeriod] = useState<"1month" | "3months" | "6months" | "1year">("3months");
  const [optimizeFor, setOptimizeFor] = useState<"revenue" | "utilization" | "balance">("balance");

  const generateSchedule = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch user's resources and settings
      const { data: resources } = await supabase
        .from("resources")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const { data: existingBookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .neq("status", "cancelled");

      const { data: scheduleSettings } = await supabase
        .from("schedule_settings")
        .select("*")
        .eq("user_id", user.id);

      // Call Replit Brain
      const { data, error } = await replitCall<{ suggestions: ScheduleSuggestion[] }>(
        "/calendar/suggest",
        {
          resources: resources || [],
          existing_bookings: existingBookings || [],
          schedule_settings: scheduleSettings || [],
          industry: config.id,
          industry_label: config.label,
          resource_label: config.resourceLabel,
          client_label: config.clientLabel,
          period,
          optimize_for: optimizeFor,
        },
      );

      if (error) throw new Error(error.message);

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        toast.success(`AI generated ${data.suggestions.length} schedule suggestions!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate AI schedule. Please try again.");
    }
    setLoading(false);
  };

  const applyAll = async () => {
    if (!user || suggestions.length === 0) return;
    toast.success(`${suggestions.length} slots applied to your calendar!`);
    setSuggestions([]);
  };

  const demandColors = {
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    low: "bg-success/10 text-success border-success/20",
  };

  return (
    <div className="space-y-6">
      {/* AI Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            AI Auto-Schedule
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Sparkles className="w-3 h-3 mr-1" /> Powered by AI
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            AI analyzes your {config.resourceLabelPlural.toLowerCase()}, existing {config.bookingLabelPlural.toLowerCase()}, 
            and demand patterns to generate an optimized schedule for up to 1 year.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Schedule Period</Label>
              <Select value={period} onValueChange={v => setPeriod(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">1 Month</SelectItem>
                  <SelectItem value="3months">3 Months</SelectItem>
                  <SelectItem value="6months">6 Months</SelectItem>
                  <SelectItem value="1year">1 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Optimize For</Label>
              <Select value={optimizeFor} onValueChange={v => setOptimizeFor(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">💰 Maximum Revenue</SelectItem>
                  <SelectItem value="utilization">📊 Maximum Utilization</SelectItem>
                  <SelectItem value="balance">⚖️ Balanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={generateSchedule}
                disabled={loading}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Schedule
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-card rounded-lg p-3 border border-border text-center">
              <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{suggestions.length}</p>
              <p className="text-[10px] text-muted-foreground">Suggested Slots</p>
            </div>
            <div className="bg-card rounded-lg p-3 border border-border text-center">
              <Clock className="w-5 h-5 text-accent mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">
                {suggestions.filter(s => s.predicted_demand === "high").length}
              </p>
              <p className="text-[10px] text-muted-foreground">High Demand Slots</p>
            </div>
            <div className="bg-card rounded-lg p-3 border border-border text-center">
              <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">
                ${suggestions.reduce((s, sg) => s + sg.suggested_price, 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">Projected Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">AI Suggestions</h3>
            <Button size="sm" onClick={applyAll} className="bg-gradient-primary hover:opacity-90">
              <Sparkles className="w-3 h-3 mr-1" /> Apply All to Calendar
            </Button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {suggestions.map((s, i) => (
              <Card key={i} className="hover:bg-secondary/30 transition-colors">
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[50px]">
                      <p className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString("en-US", { month: "short" })}</p>
                      <p className="text-lg font-bold text-foreground">{new Date(s.date).getDate()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {s.time_start} – {s.time_end}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.resource} • {s.client_type}
                      </p>
                      <p className="text-[11px] text-muted-foreground italic mt-0.5">{s.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] ${demandColors[s.predicted_demand]}`}>
                      {s.predicted_demand} demand
                    </Badge>
                    <span className="text-sm font-semibold text-primary">${s.suggested_price}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {suggestions.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Auto-Schedule</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Add your {config.resourceLabelPlural.toLowerCase()} and configure schedule settings, 
              then click "Generate Schedule" to let AI create an optimized schedule.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAutoSchedule;
