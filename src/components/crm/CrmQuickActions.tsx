import { useCrmContacts, useCrmTickets, useCrmDeals, useCrmActivities } from "@/hooks/useCrm";
import { getCrmConfig } from "@/lib/crmConfig";
import { getIndustryConfig } from "@/lib/industryConfig";
import type { IndustryType } from "@/lib/industryConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, TicketCheck, TrendingUp, Clock, Users, Sparkles, Zap } from "lucide-react";
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

  const recentTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress").slice(0, 3);
  const topDeals = deals.filter(d => d.stage !== "Won" && d.stage !== "Lost").sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 3);
  const recentActivities = activities.slice(0, 5);

  return (
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
          <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onNavigate("activities")}>
            <Plus className="h-4 w-4 mr-2" />Log Activity
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start text-primary" onClick={() => onNavigate("ai-insights")}>
            <Sparkles className="h-4 w-4 mr-2" />AI Insights
          </Button>
        </CardContent>
      </Card>

      {/* Urgent Tickets */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><TicketCheck className="h-4 w-4 text-orange-500" />Urgent {config.ticketLabelPlural}</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => onNavigate("tickets")}>View all<ArrowRight className="h-3 w-3 ml-1" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No open {config.ticketLabelPlural.toLowerCase()} 🎉</p>
          ) : (
            <div className="space-y-2">
              {recentTickets.map(t => (
                <div key={t.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">#{t.ticket_number}</p>
                  </div>
                  <Badge variant={t.priority === "critical" ? "destructive" : t.priority === "high" ? "secondary" : "outline"} className="text-xs shrink-0">
                    {t.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Deals */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" />Top {config.dealLabelPlural}</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => onNavigate("deals")}>View all<ArrowRight className="h-3 w-3 ml-1" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {topDeals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No active {config.dealLabelPlural.toLowerCase()}</p>
          ) : (
            <div className="space-y-2">
              {topDeals.map(d => (
                <div key={d.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{d.stage}</p>
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">${(d.value || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
