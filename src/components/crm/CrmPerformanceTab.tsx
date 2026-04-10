import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCrmPerformance, PerformanceReport } from "@/hooks/useCrmPerformance";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Clock, Coffee, TrendingUp, Calendar, Sparkles, Target, Activity, FileText, Bell, CheckCircle2, AlertTriangle } from "lucide-react";

interface Props {
  industry: string;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500";
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-muted" />
        <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
          className={`${color.replace("text-", "stroke-")}`}
          strokeDasharray={`${score * 2.64} 264`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-2xl font-bold ${color}`}>{score}</span>
      </div>
    </div>
  );
}

export default function CrmPerformanceTab({ industry }: Props) {
  const {
    reports, todayStats, weeklyStats, unreadReport, loading, generating,
    generateReport, markReportRead,
  } = useCrmPerformance();
  const [showReport, setShowReport] = useState<PerformanceReport | null>(null);

  // Auto-show unread report as notification popup
  useEffect(() => {
    if (unreadReport) {
      setShowReport(unreadReport);
    }
  }, [unreadReport]);

  const latestReport = reports[0];

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Today's Performance */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{formatDuration(todayStats.workSeconds)}</p>
            <p className="text-xs text-muted-foreground">Today's Work</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Coffee className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold">{formatDuration(todayStats.breakSeconds)}</p>
            <p className="text-xs text-muted-foreground">Today's Breaks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{todayStats.sessions}</p>
            <p className="text-xs text-muted-foreground">Work Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 mx-auto text-purple-500 mb-1" />
            <p className="text-2xl font-bold">{todayStats.breaks}</p>
            <p className="text-xs text-muted-foreground">Breaks Taken</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Weekly Work vs Breaks (minutes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="work" name="Work" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="breaks" name="Breaks" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">No data this week. Start a work session to track performance.</p>
          )}
        </CardContent>
      </Card>

      {/* Latest Monthly Report + Generate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" /> AI Monthly Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestReport ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {new Date(latestReport.report_month).toLocaleDateString("en", { month: "long", year: "numeric" })}
                  </p>
                  <Badge variant={latestReport.productivity_score >= 70 ? "default" : "secondary"}>
                    Score: {latestReport.productivity_score}
                  </Badge>
                </div>
                <ScoreRing score={latestReport.productivity_score} />
                <p className="text-sm text-muted-foreground">{latestReport.ai_summary}</p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowReport(latestReport)}>
                  <FileText className="h-4 w-4 mr-1" /> View Full Report
                </Button>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">No reports yet. Generate your first monthly performance report.</p>
              </div>
            )}
            <Button onClick={generateReport} disabled={generating} className="w-full gap-2">
              <Sparkles className="h-4 w-4" />
              {generating ? "Generating..." : "Generate Monthly Report"}
            </Button>
          </CardContent>
        </Card>

        {/* Report History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Report History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {reports.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setShowReport(r)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      {!r.is_read && <Bell className="h-3 w-3 text-primary animate-pulse" />}
                      <span className="text-sm font-medium">
                        {new Date(r.report_month).toLocaleDateString("en", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{r.days_active}d active</span>
                      <Badge variant={r.productivity_score >= 70 ? "default" : "secondary"} className="text-xs">
                        {r.productivity_score}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No reports generated yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Detail Dialog */}
      <Dialog open={!!showReport} onOpenChange={(open) => {
        if (!open) {
          if (showReport && !showReport.is_read) markReportRead(showReport.id);
          setShowReport(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          {showReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Performance Report —{" "}
                  {new Date(showReport.report_month).toLocaleDateString("en", { month: "long", year: "numeric" })}
                </DialogTitle>
                <DialogDescription>AI-generated monthly performance analysis</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <ScoreRing score={showReport.productivity_score} />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <Clock className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">{formatDuration(showReport.total_work_seconds)}</p>
                      <p className="text-xs text-muted-foreground">Total Work</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <Coffee className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="font-medium">{formatDuration(showReport.total_break_seconds)}</p>
                      <p className="text-xs text-muted-foreground">Total Breaks</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium">{showReport.total_sessions} sessions</p>
                      <p className="text-xs text-muted-foreground">Avg {showReport.avg_session_minutes}m each</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="font-medium">{showReport.days_active} days</p>
                      <p className="text-xs text-muted-foreground">Active Days</p>
                    </div>
                  </div>
                </div>

                {showReport.ai_summary && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-sm font-medium mb-1 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> AI Summary
                    </p>
                    <p className="text-sm text-muted-foreground">{showReport.ai_summary}</p>
                  </div>
                )}

                {Array.isArray(showReport.ai_recommendations) && showReport.ai_recommendations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Target className="h-3 w-3" /> AI Recommendations
                    </p>
                    {showReport.ai_recommendations.map((rec: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{rec}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
