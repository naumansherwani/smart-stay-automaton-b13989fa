import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
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
import { Users, TicketCheck, TrendingUp, Clock, Sparkles, ArrowLeft, Crown, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export default function CRM() {
  const { profile, loading: profileLoading } = useProfile();
  const { subscription, isActive, loading: subLoading } = useSubscription();
  const [tab, setTab] = useState("overview");
  const navigate = useNavigate();

  if (profileLoading || subLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  const industry = profile?.industry || "hospitality";
  const industryConfig = getIndustryConfig(industry);
  const crmConfig = getCrmConfig(industry);
  const isPremium = subscription?.plan === "premium" || subscription?.is_lifetime || false;

  if (!isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <Crown className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">AI CRM — Premium Feature</h2>
            <p className="text-muted-foreground mb-6">The world's most advanced AI CRM is available for Premium subscribers.</p>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => navigate("/pricing")}>Upgrade to Premium</Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{industryConfig.icon}</span>
                  <h1 className="text-xl font-bold">AI CRM</h1>
                  {isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
                </div>
                <p className="text-sm text-muted-foreground">{industryConfig.label} — {crmConfig.contactLabelPlural} Management</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Work Timer - always visible */}
        <CrmWorkTimer />

        {/* Live KPIs */}
        <CrmLiveKPIs industry={industry} />

        {/* Admin Panel (only shows for admins) */}
        <CrmAdminPanel />

        {/* Main Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-6 w-full max-w-3xl mx-auto">
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
            <TabsTrigger value="ai-insights" className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /><span className="hidden sm:inline">AI</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <CrmQuickActions industry={industry} onNavigate={setTab} />
          </TabsContent>
          <TabsContent value="contacts"><CrmContactsTab industry={industry} /></TabsContent>
          <TabsContent value="tickets"><CrmTicketsTab industry={industry} isPremium={isPremium} /></TabsContent>
          <TabsContent value="deals"><CrmDealsTab industry={industry} /></TabsContent>
          <TabsContent value="activities"><CrmActivitiesTab industry={industry} /></TabsContent>
          <TabsContent value="ai-insights"><CrmAiInsightsTab industry={industry} isPremium={isPremium} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
