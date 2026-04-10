import { useCrmContacts, useCrmTickets, useCrmDeals, useCrmActivities } from "@/hooks/useCrm";
import { getCrmConfig } from "@/lib/crmConfig";
import { getIndustryConfig } from "@/lib/industryConfig";
import type { IndustryType } from "@/lib/industryConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, ArrowRight, TicketCheck, TrendingUp, Clock, Users, Sparkles, Zap, Calendar, DollarSign, PenLine, Wrench, Activity, Target, CheckCircle2, AlertTriangle } from "lucide-react";
import CrmRevenueChart from "./CrmRevenueChart";
import { format } from "date-fns";

interface Props {
  industry: IndustryType;
  onNavigate: (tab: string) => void;
}

export default function CrmQuickActions({ industry, onNavigate }: Props) {
  const config = getCrmConfig(industry);
  const industryConfig = getIndustryConfig(industry);
  const { contacts } = useCrmContacts();
  const { tickets } = useCrmTickets();
  const { deals } = useCrmDeals();
  const { activities } = useCrmActivities();

  const recentTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress").slice(0, 5);
  const topDeals = deals.filter(d => d.stage !== "Won" && d.stage !== "Lost").sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5);
  const recentActivities = activities.slice(0, 5);

  const wonDeals = deals.filter(d => d.stage === "Won");
  const totalRevenue = wonDeals.reduce((s, d) => s + (d.value || 0), 0);
  const openTicketCount = tickets.filter(t => t.status === "open").length;
  const activeContacts = contacts.filter(c => c.lifecycle_stage === "customer").length;

  const toolIconMap: Record<string, React.ReactNode> = {
    "ai-calendar": <Calendar className="h-4 w-4 mr-2 text-blue-500" />,
    "ai-pricing": <DollarSign className="h-4 w-4 mr-2 text-green-500" />,
    "manual-booking": <PenLine className="h-4 w-4 mr-2 text-orange-500" />,
    "ai-scheduling": <Calendar className="h-4 w-4 mr-2 text-purple-500" />,
    "resource-mgmt": <Wrench className="h-4 w-4 mr-2 text-slate-500" />,
    "fleet-mgmt": <Wrench className="h-4 w-4 mr-2 text-blue-600" />,
    "route-optimizer": <ArrowRight className="h-4 w-4 mr-2 text-teal-500" />,
    "capacity-planner": <TrendingUp className="h-4 w-4 mr-2 text-amber-500" />,
    "smart-tasks": <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />,
    "daily-planner": <Target className="h-4 w-4 mr-2 text-yellow-600" />,
    "google-sync": <Sparkles className="h-4 w-4 mr-2 text-red-500" />,
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions + Industry Tools + Urgent Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" />Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onNavigate("contacts")}>
              <Plus className="h-4 w-4 mr-2" />Add {config.contactLabel}
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onNavigate("tickets")}>
              <Plus className="h-4 w-4 mr-2" />New {config.ticketLabel}
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onNavigate("deals")}>
              <Plus className="h-4 w-4 mr-2" />New {config.dealLabel}
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start text-primary" onClick={() => onNavigate("ai-insights")}>
              <Sparkles className="h-4 w-4 mr-2" />AI Insights
            </Button>
          </CardContent>
        </Card>

        {/* Industry-Specific Tools */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span>{industryConfig.icon}</span>
              {industryConfig.label} Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {config.crmTools.map(tool => (
              <Button key={tool.id} variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => onNavigate(`tool-${tool.id}`)}>
                {toolIconMap[tool.id] || <Wrench className="h-4 w-4 mr-2" />}
                {tool.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Urgent Tickets + Recent Activity */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" />Urgent</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => onNavigate("tickets")}>View all<ArrowRight className="h-3 w-3 ml-1" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">No open {config.ticketLabelPlural.toLowerCase()} 🎉</p>
              ) : (
                <div className="space-y-1.5">
                  {recentTickets.slice(0, 3).map(t => (
                    <div key={t.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                      <span className="truncate flex-1 font-medium">{t.subject}</span>
                      <Badge variant={t.priority === "critical" ? "destructive" : "outline"} className="text-[10px] shrink-0 ml-2">{t.priority}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-blue-500" />Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">No activities yet</p>
              ) : (
                <div className="space-y-1.5">
                  {recentActivities.map(a => (
                    <div key={a.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-xs">
                      <Badge variant="outline" className="text-[10px] capitalize shrink-0">{a.type}</Badge>
                      <span className="truncate flex-1">{a.subject || a.description || "Activity"}</span>
                      <span className="text-muted-foreground shrink-0">{format(new Date(a.created_at), "MMM d")}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Deals Pipeline Preview */}
      {topDeals.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-500" />Top {config.dealLabelPlural}</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => onNavigate("deals")}>View pipeline<ArrowRight className="h-3 w-3 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
              {topDeals.map(d => (
                <div key={d.id} className="p-3 bg-muted/30 rounded">
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  <p className="text-xs text-primary font-bold">${(d.value || 0).toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="outline" className="text-[10px]">{d.stage}</Badge>
                    <span className="text-[10px] text-muted-foreground">{d.probability}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Charts */}
      <CrmRevenueChart industry={industry} />
    </div>
  );
}
