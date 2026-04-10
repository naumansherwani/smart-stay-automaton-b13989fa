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
import CrmWorkTimer from "@/components/crm/CrmWorkTimer";
import CrmLiveKPIs from "@/components/crm/CrmLiveKPIs";
import CrmQuickActions from "@/components/crm/CrmQuickActions";
import CrmAdminPanel from "@/components/crm/CrmAdminPanel";
import CrmToolPanel from "@/components/crm/CrmToolPanel";
import CrmVoiceAssistant from "@/components/crm/CrmVoiceAssistant";
import { Users, TicketCheck, TrendingUp, Clock, Sparkles, ArrowLeft, Crown, LayoutDashboard, AlertTriangle, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import CrmRevenueChart from "@/components/crm/CrmRevenueChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatarUrl, getUserDisplayName, getUserInitials } from "@/lib/utils";
import { ConversationProvider } from "@elevenlabs/react";

export default function CRM() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { subscription, isActive, isTrialing, trialDaysLeft, loading: subLoading } = useSubscription();
  const [tab, setTab] = useState("overview");
  const navigate = useNavigate();

  if (profileLoading || subLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  const industry = profile?.industry || "hospitality";
  const industryConfig = getIndustryConfig(industry);
  const crmConfig = getCrmConfig(industry);
  const isPremium = subscription?.plan === "premium" || subscription?.is_lifetime || isTrialing;
  const displayName = getUserDisplayName(user, profile?.display_name);
  const avatarUrl = getUserAvatarUrl(user, profile?.avatar_url);
  const initials = getUserInitials(displayName, user?.email);

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
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl">{industryConfig.icon}</span>
                  <h1 className="text-xl font-bold">AI CRM</h1>
                  <Crown className="h-4 w-4 text-yellow-500" />
                  {isTrialing && (
                    <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      Trial — {trialDaysLeft}d left
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{industryConfig.label} — {crmConfig.contactLabelPlural} Management</p>
              </div>
            </div>

            <Button variant="ghost" className="h-auto px-2 py-1.5" onClick={() => navigate("/profile")}>
              <div className="flex items-center gap-2">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={avatarUrl ?? undefined} alt={`${displayName} profile photo`} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs text-muted-foreground mt-1">Profile</p>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {isTrialing && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20">
          <div className="container mx-auto px-4 py-2.5">
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
        </div>
      )}

      <div className="container mx-auto px-4 py-4 space-y-4">
        <CrmWorkTimer />
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
          <TabsContent value="tickets"><CrmTicketsTab industry={industry} isPremium={true} /></TabsContent>
          <TabsContent value="deals"><CrmDealsTab industry={industry} /></TabsContent>
          <TabsContent value="activities"><CrmActivitiesTab industry={industry} /></TabsContent>
          <TabsContent value="analytics"><CrmRevenueChart industry={industry} /></TabsContent>
          <TabsContent value="ai-insights"><CrmAiInsightsTab industry={industry} isPremium={true} /></TabsContent>
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
    </div>
  );
}
