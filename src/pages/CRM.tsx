import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { getCrmConfig } from "@/lib/crmConfig";
import { getIndustryConfig } from "@/lib/industryConfig";
import CrmContactsTab from "@/components/crm/CrmContactsTab";
import CrmTicketsTab from "@/components/crm/CrmTicketsTab";
import CrmDealsTab from "@/components/crm/CrmDealsTab";
import CrmActivitiesTab from "@/components/crm/CrmActivitiesTab";
import CrmAiInsightsTab from "@/components/crm/CrmAiInsightsTab";
import CrmWidgetsPanel from "@/components/crm/CrmWidgetsPanel";
import CrmWorkTimer from "@/components/crm/CrmWorkTimer";
import CrmLiveKPIs from "@/components/crm/CrmLiveKPIs";
import CrmQuickActions from "@/components/crm/CrmQuickActions";
import CrmAdminPanel from "@/components/crm/CrmAdminPanel";
import CrmBreakGames from "@/components/crm/CrmBreakGames";
import CrmIndustryConnect from "@/components/crm/CrmIndustryConnect";
import CrmToolPanel from "@/components/crm/CrmToolPanel";
import CrmVoiceAssistant from "@/components/crm/CrmVoiceAssistant";
import CrmAiEmailComposer from "@/components/crm/CrmAiEmailComposer";
import CrmPredictiveRevenue from "@/components/crm/CrmPredictiveRevenue";
import CrmCompetitorIntelligence from "@/components/crm/CrmCompetitorIntelligence";
import CrmSentimentDashboard from "@/components/crm/CrmSentimentDashboard";
import CrmSmartMeetingScheduler from "@/components/crm/CrmSmartMeetingScheduler";
import CrmPerformanceTab from "@/components/crm/CrmPerformanceTab";
import CrmSecurityPanel from "@/components/crm/CrmSecurityPanel";
import CrmFlightOpsCalendar from "@/components/crm/CrmFlightOpsCalendar";
import { Users, TicketCheck, TrendingUp, Clock, Sparkles, Crown, LayoutDashboard, AlertTriangle, BarChart3, Mail, Globe, Heart, CalendarClock, Gauge, Shield, Building2, Gamepad2, Plane } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import CrmRevenueChart from "@/components/crm/CrmRevenueChart";
import { getUserDisplayName } from "@/lib/utils";
import AppLayout from "@/components/app/AppLayout";

export default function CRM() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { subscription, isActive, isTrialing, trialDaysLeft, loading: subLoading } = useSubscription();
  const [tab, setTab] = useState("overview");
  const [breakActive, setBreakActive] = useState(false);
  const navigate = useNavigate();

  if (profileLoading || subLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  const industry = profile?.industry || "hospitality";
  const industryConfig = getIndustryConfig(industry);
  const crmConfig = getCrmConfig(industry);
  const isPremium = subscription?.plan === "premium" || subscription?.is_lifetime || isTrialing;
  const displayName = getUserDisplayName(user, profile?.display_name);

  if (!isActive || !isPremium) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <Crown className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">AI CRM — Premium Only</h2>
            <p className="text-muted-foreground mb-4">
              {!isActive
                ? "Your trial has expired. Upgrade to Premium to access the full AI CRM."
                : "AI CRM is exclusively available for Premium subscribers. Upgrade to unlock the most advanced AI-powered CRM."
              }
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Premium includes: AI Calendar, AI Pricing, Full CRM, Priority Support & more!
            </p>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => navigate("/pricing")}>Upgrade to Premium</Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toolTabs = crmConfig.crmTools.map(tool => ({
    id: `tool-${tool.id}`,
    label: tool.label,
    icon: tool.icon,
    tool,
  }));

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xl">{industryConfig.icon}</span>
            <h1 className="text-xl font-bold">AI CRM</h1>
            <Crown className="h-4 w-4 text-yellow-500" />
          </div>
          {isTrialing && (
            <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
              Trial — {trialDaysLeft}d left
            </Badge>
          )}
          <p className="text-sm text-muted-foreground">{industryConfig.label} — {crmConfig.contactLabelPlural} Management</p>
        </div>

        {isTrialing && (
          <div className="bg-yellow-500/10 rounded-lg border border-yellow-500/20 px-4 py-2.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                <span className="text-yellow-800 dark:text-yellow-200">
                  <strong>Free Trial:</strong> {trialDaysLeft} days remaining — All Premium features unlocked!
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Progress value={((3 - trialDaysLeft) / 3) * 100} className="w-24 h-2" />
                <Button size="sm" variant="outline" className="text-xs border-yellow-500/30 hover:bg-yellow-500/10" onClick={() => navigate("/pricing")}>
                  Choose Plan
                </Button>
              </div>
            </div>
          </div>
        )}

        <CrmWidgetsPanel displayName={displayName} />
        <CrmWorkTimer onBreakChange={setBreakActive} />
        <CrmBreakGames isOnBreak={breakActive} />
        <CrmLiveKPIs industry={industry} />
        <CrmAdminPanel />

        <Tabs value={tab} onValueChange={setTab}>
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-auto min-w-full">
              <TabsTrigger value="overview" className="flex items-center gap-1.5">
                <LayoutDashboard className="h-4 w-4" /><span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-1.5">
                <Users className="h-4 w-4" /><span className="hidden sm:inline">{crmConfig.contactLabelPlural}</span>
              </TabsTrigger>
              {industry === "airlines" && (
                <TabsTrigger value="flight-ops" className="flex items-center gap-1.5">
                  <Plane className="h-4 w-4" /><span className="hidden sm:inline">Flight Ops</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="tickets" className="flex items-center gap-1.5">
                <TicketCheck className="h-4 w-4" /><span className="hidden sm:inline">{crmConfig.ticketLabelPlural}</span>
              </TabsTrigger>
              <TabsTrigger value="deals" className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /><span className="hidden sm:inline">{crmConfig.dealLabelPlural}</span>
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /><span className="hidden sm:inline">Activities</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="ai-insights" className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /><span className="hidden sm:inline">AI</span>
              </TabsTrigger>
              <TabsTrigger value="email-composer" className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" /><span className="hidden sm:inline">Email AI</span>
              </TabsTrigger>
              <TabsTrigger value="revenue-forecast" className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /><span className="hidden sm:inline">Forecast</span>
              </TabsTrigger>
              <TabsTrigger value="competitor-intel" className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" /><span className="hidden sm:inline">Competitors</span>
              </TabsTrigger>
              <TabsTrigger value="sentiment" className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" /><span className="hidden sm:inline">Sentiment</span>
              </TabsTrigger>
              <TabsTrigger value="meeting-scheduler" className="flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4" /><span className="hidden sm:inline">Meetings</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-1.5">
                <Gauge className="h-4 w-4" /><span className="hidden sm:inline">Performance</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" /><span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="industry-connect" className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" /><span className="hidden sm:inline">Connect</span>
              </TabsTrigger>
              {toolTabs.map(tt => (
                <TabsTrigger key={tt.id} value={tt.id} className="flex items-center gap-1.5">
                  <span className="text-sm">{tt.icon}</span><span className="hidden sm:inline">{tt.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="overview">
            <CrmQuickActions industry={industry} onNavigate={setTab} />
          </TabsContent>
          <TabsContent value="contacts"><CrmContactsTab industry={industry} /></TabsContent>
          {industry === "airlines" && (
            <TabsContent value="flight-ops"><CrmFlightOpsCalendar /></TabsContent>
          )}
          <TabsContent value="tickets"><CrmTicketsTab industry={industry} isPremium={true} /></TabsContent>
          <TabsContent value="deals"><CrmDealsTab industry={industry} /></TabsContent>
          <TabsContent value="activities"><CrmActivitiesTab industry={industry} /></TabsContent>
          <TabsContent value="analytics"><CrmRevenueChart industry={industry} /></TabsContent>
          <TabsContent value="ai-insights"><CrmAiInsightsTab industry={industry} isPremium={true} /></TabsContent>
          <TabsContent value="email-composer"><CrmAiEmailComposer industry={industry} /></TabsContent>
          <TabsContent value="revenue-forecast"><CrmPredictiveRevenue industry={industry} /></TabsContent>
          <TabsContent value="competitor-intel"><CrmCompetitorIntelligence industry={industry} /></TabsContent>
          <TabsContent value="sentiment"><CrmSentimentDashboard industry={industry} /></TabsContent>
          <TabsContent value="meeting-scheduler"><CrmSmartMeetingScheduler industry={industry} /></TabsContent>
          <TabsContent value="performance"><CrmPerformanceTab industry={industry} /></TabsContent>
          <TabsContent value="security"><CrmSecurityPanel /></TabsContent>
          <TabsContent value="industry-connect"><CrmIndustryConnect /></TabsContent>
          {toolTabs.map(tt => (
            <TabsContent key={tt.id} value={tt.id}>
              <CrmToolPanel toolId={tt.tool.id} industry={industry} tool={tt.tool} />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <ConversationProvider>
        <CrmVoiceAssistant industry={industry} />
      </ConversationProvider>
    </AppLayout>
  );
}
