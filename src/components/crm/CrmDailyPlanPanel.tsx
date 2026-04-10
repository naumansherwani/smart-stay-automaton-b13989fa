import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Sun, Coffee, Brain, Target, TrendingUp, RefreshCw, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCrmTasks } from "@/hooks/useCrmTasks";
import { toast } from "sonner";
import type { IndustryType } from "@/lib/industryConfig";
import { getIndustryConfig } from "@/lib/industryConfig";
import { format } from "date-fns";

interface Props {
  industry: IndustryType;
}

interface DailyPlan {
  id: string;
  plan_date: string;
  tasks_summary: any[];
  ai_recommendations: any[];
  focus_areas: string[];
  productivity_score: number | null;
  mood: string | null;
}

export default function CrmDailyPlanPanel({ industry }: Props) {
  const { user } = useAuth();
  const { todayTasks, pendingTasks, overdueTasks, completedTasks } = useCrmTasks();
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const industryConfig = getIndustryConfig(industry);
  const today = format(new Date(), "yyyy-MM-dd");

  const fetchPlan = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("crm_daily_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("plan_date", today)
      .maybeSingle();
    setPlan(data as unknown as DailyPlan | null);
    setLoading(false);
  }, [user, today]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-daily-planner", {
        body: {
          action: "generate_daily_plan",
          industry,
          today_tasks: todayTasks.slice(0, 10),
          pending_tasks: pendingTasks.slice(0, 15),
          overdue_tasks: overdueTasks.slice(0, 5),
          completed_count: completedTasks.length,
        },
      });
      if (error) throw error;

      // Save plan to DB
      const planData = {
        user_id: user!.id,
        industry,
        plan_date: today,
        tasks_summary: data?.tasks_summary || [],
        ai_recommendations: data?.recommendations || [],
        focus_areas: data?.focus_areas || [],
        productivity_score: data?.productivity_score || null,
        mood: data?.mood || null,
      };

      const { data: saved, error: saveErr } = await supabase
        .from("crm_daily_plans")
        .upsert(planData as any, { onConflict: "user_id,plan_date" })
        .select()
        .single();

      if (!saveErr && saved) setPlan(saved as unknown as DailyPlan);
      toast.success("AI Daily Plan generated!");
    } catch {
      toast.error("Plan generate nahi ho saka");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-yellow-500" />
          <h2 className="font-semibold">Today's AI Plan — {format(new Date(), "EEEE, MMM d")}</h2>
        </div>
        <Button size="sm" onClick={generatePlan} disabled={generating}>
          {generating ? <><RefreshCw className="h-4 w-4 mr-1 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-1" />{plan ? "Regenerate" : "Generate AI Plan"}</>}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          <div><p className="text-lg font-bold">{todayTasks.length}</p><p className="text-xs text-muted-foreground">Today's Tasks</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <div><p className="text-lg font-bold">{overdueTasks.length}</p><p className="text-xs text-muted-foreground">Overdue</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          <div><p className="text-lg font-bold">{pendingTasks.length}</p><p className="text-xs text-muted-foreground">Pending</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div><p className="text-lg font-bold">{plan?.productivity_score ?? "—"}</p><p className="text-xs text-muted-foreground">AI Score</p></div>
        </CardContent></Card>
      </div>

      {!plan ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 mx-auto text-primary/40 mb-3" />
            <h3 className="font-semibold mb-1">No Plan Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click "Generate AI Plan" to let AI analyze your tasks, contacts, and {industryConfig.label.toLowerCase()} priorities to create a smart daily plan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Focus Areas */}
          {plan.focus_areas && plan.focus_areas.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />Focus Areas
              </CardTitle></CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-2">
                  {plan.focus_areas.map((area, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-primary/5 rounded text-sm">
                      <span className="font-medium text-primary">{i + 1}.</span>
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendations */}
          {plan.ai_recommendations && plan.ai_recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />AI Recommendations
              </CardTitle></CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-2">
                  {plan.ai_recommendations.map((rec: any, i: number) => (
                    <div key={i} className="p-2 bg-muted/50 rounded text-sm">
                      {typeof rec === "string" ? rec : rec.text || JSON.stringify(rec)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Task Summary */}
          {plan.tasks_summary && plan.tasks_summary.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
                <Coffee className="h-4 w-4 text-amber-600" />Prioritized Task Order
              </CardTitle></CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-1.5">
                  {plan.tasks_summary.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                      <Badge variant="outline" className="text-[10px] shrink-0">{i + 1}</Badge>
                      <span className="flex-1">{typeof item === "string" ? item : item.title || item.text || JSON.stringify(item)}</span>
                      {item.priority && <Badge variant="secondary" className="text-[10px]">{item.priority}</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mood / Productivity */}
          {plan.mood && (
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">AI Assessment: {plan.mood}</p>
                  <p className="text-xs text-muted-foreground">Based on your current workload and industry trends</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
