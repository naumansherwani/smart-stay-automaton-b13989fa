import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, DollarSign, Calendar, BarChart3, Activity, Crown, Eye, EyeOff,
  Briefcase, Layers, RefreshCw, Mic, Rocket, Heart, TrendingUp, Globe, ShoppingCart
} from "lucide-react";
import OwnerStatsCards from "@/components/admin/OwnerStatsCards";
import OwnerIndustryOverview from "@/components/admin/OwnerIndustryOverview";
import OwnerUsersTab from "@/components/admin/OwnerUsersTab";
import OwnerCrmTab from "@/components/admin/OwnerCrmTab";
import OwnerFeaturesTab from "@/components/admin/OwnerFeaturesTab";
import OwnerSubscriptionsTab from "@/components/admin/OwnerSubscriptionsTab";
import OwnerVoiceAssistantTab from "@/components/admin/OwnerVoiceAssistantTab";
import OwnerOnboardingTab from "@/components/admin/OwnerOnboardingTab";
import OwnerRetentionTab from "@/components/admin/OwnerRetentionTab";
import OwnerMrrCommandCenter from "@/components/admin/OwnerMrrCommandCenter";
import OwnerGrowthCommandCenter from "@/components/admin/OwnerGrowthCommandCenter";
import OwnerSalesFunnelTab from "@/components/admin/OwnerSalesFunnelTab";
import AiGuideChatbot from "@/components/AiGuideChatbot";

const OwnerConsole = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showSecret, setShowSecret] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const [stats, setStats] = useState({
    totalUsers: 0, totalBookings: 0, totalResources: 0,
    activeSubscriptions: 0, trialingUsers: 0, industries: {} as Record<string, number>,
    totalCrmContacts: 0, totalCrmDeals: 0, totalWorkspaces: 0,
    totalActivityLogs: 0, totalFeatureUsage: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [crmContacts, setCrmContacts] = useState<any[]>([]);
  const [crmDeals, setCrmDeals] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [featureUsage, setFeatureUsage] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  const fetchAllData = async () => {
    if (!isAdmin) return;
    const [
      profiles, bookings, resources, subscriptions,
      contacts, deals, logs, usage, ws
    ] = await Promise.all([
      supabase.from("profiles").select("id, display_name, company_name, industry, created_at, user_id"),
      supabase.from("bookings").select("id, guest_name, check_in, check_out, status, total_price, created_at, resource_id"),
      supabase.from("resources").select("id, name, industry"),
      supabase.from("subscriptions").select("id, status, plan, is_lifetime, user_id"),
      supabase.from("crm_contacts").select("id, name, company, industry, lifecycle_stage, total_revenue, created_at"),
      supabase.from("crm_deals").select("id, title, stage, value, probability, industry, created_at"),
      supabase.from("crm_activity_logs").select("id, action_type, entity_type, industry, description, created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("feature_usage").select("id, feature_key, usage_count, last_used_at"),
      supabase.from("workspaces").select("id, name, industry, is_active, created_at"),
    ]);

    const industryCount: Record<string, number> = {};
    (resources.data || []).forEach((r: any) => {
      industryCount[r.industry] = (industryCount[r.industry] || 0) + 1;
    });

    setStats({
      totalUsers: profiles.data?.length || 0,
      totalBookings: bookings.data?.length || 0,
      totalResources: resources.data?.length || 0,
      activeSubscriptions: (subscriptions.data || []).filter((s: any) => s.status === "active" || s.is_lifetime).length,
      trialingUsers: (subscriptions.data || []).filter((s: any) => s.status === "trialing").length,
      industries: industryCount,
      totalCrmContacts: contacts.data?.length || 0,
      totalCrmDeals: deals.data?.length || 0,
      totalWorkspaces: ws.data?.length || 0,
      totalActivityLogs: logs.data?.length || 0,
      totalFeatureUsage: usage.data?.length || 0,
    });

    setRecentUsers((profiles.data || []).slice(-10).reverse());
    setRecentBookings((bookings.data || []).slice(-20).reverse());
    setCrmContacts((contacts.data || []).slice(-20).reverse());
    setCrmDeals((deals.data || []).slice(-20).reverse());
    setActivityLogs(logs.data || []);
    setFeatureUsage(usage.data || []);
    setWorkspaces(ws.data || []);
    setSubscriptionsList(subscriptions.data || []);
    setLastRefresh(new Date());
  };

  useEffect(() => { fetchAllData(); }, [isAdmin]);

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Activity className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const totalRevenue = recentBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const totalDealValue = crmDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-yellow-400" />
            <span className="text-base font-bold text-foreground">Owner Console</span>
            <Badge className="bg-yellow-400/10 text-yellow-400 border-yellow-400/30 text-[10px]">SECRET</Badge>
            <div className="flex items-center gap-1.5 ml-3">
              <div className="w-2 h-2 rounded-full bg-[hsl(160,60%,45%)] animate-pulse" />
              <span className="text-[10px] text-muted-foreground">
                Synced {lastRefresh.toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchAllData}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowSecret(!showSecret)}>
              {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/dashboard"}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <OwnerStatsCards stats={stats} totalRevenue={totalRevenue} showSecret={showSecret} />
        <OwnerIndustryOverview industries={stats.industries} showSecret={showSecret} />

        <Tabs defaultValue="mrr" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="mrr" className="gap-1.5 text-xs">
              <TrendingUp className="w-3 h-3" /> MRR Command
            </TabsTrigger>
            <TabsTrigger value="growth" className="gap-1.5 text-xs">
              <Globe className="w-3 h-3" /> Growth
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5 text-xs">
              <Users className="w-3 h-3" /> Users
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1.5 text-xs">
              <Calendar className="w-3 h-3" /> Bookings
            </TabsTrigger>
            <TabsTrigger value="crm" className="gap-1.5 text-xs">
              <Briefcase className="w-3 h-3" /> CRM
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-1.5 text-xs">
              <Layers className="w-3 h-3" /> Features
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1.5 text-xs">
              <Crown className="w-3 h-3" /> Subscriptions
            </TabsTrigger>
            <TabsTrigger value="revenue" className="gap-1.5 text-xs">
              <BarChart3 className="w-3 h-3" /> Revenue
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-1.5 text-xs">
              <Mic className="w-3 h-3" /> Voice AI
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="gap-1.5 text-xs">
              <Rocket className="w-3 h-3" /> Onboarding
            </TabsTrigger>
            <TabsTrigger value="retention" className="gap-1.5 text-xs">
              <Heart className="w-3 h-3" /> Retention
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mrr">
            <OwnerMrrCommandCenter />
          </TabsContent>

          <TabsContent value="growth">
            <OwnerGrowthCommandCenter />
          </TabsContent>

          <TabsContent value="users">
            <OwnerUsersTab recentUsers={recentUsers} showSecret={showSecret} />
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader><CardTitle className="text-sm">Recent Bookings (All Users)</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b">
                        <th className="pb-2 font-medium">Guest</th>
                        <th className="pb-2 font-medium">Check In</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.map((b) => (
                        <tr key={b.id} className="border-b border-border/50">
                          <td className="py-2 text-foreground">{showSecret ? b.guest_name : "•••"}</td>
                          <td className="py-2 text-muted-foreground text-xs">
                            {new Date(b.check_in).toLocaleDateString()}
                          </td>
                          <td className="py-2">
                            <Badge variant={b.status === "confirmed" ? "default" : "secondary"} className="text-xs">
                              {b.status}
                            </Badge>
                          </td>
                          <td className="py-2 text-foreground font-medium">
                            {showSecret ? `$${b.total_price || 0}` : "•••"}
                          </td>
                        </tr>
                      ))}
                      {recentBookings.length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No bookings yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crm">
            <OwnerCrmTab contacts={crmContacts} deals={crmDeals} activityLogs={activityLogs} showSecret={showSecret} />
          </TabsContent>

          <TabsContent value="features">
            <OwnerFeaturesTab featureUsage={featureUsage} workspaces={workspaces} showSecret={showSecret} />
          </TabsContent>

          <TabsContent value="subscriptions">
            <OwnerSubscriptionsTab subscriptions={subscriptionsList} showSecret={showSecret} />
          </TabsContent>

          <TabsContent value="revenue">
            <Card>
              <CardHeader><CardTitle className="text-sm">Revenue Summary</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                    <p className="text-2xl font-bold text-primary">{showSecret ? `$${totalRevenue.toLocaleString()}` : "•••"}</p>
                    <p className="text-xs text-muted-foreground mt-1">Booking Revenue</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[hsl(330,70%,55%)]/5 border border-[hsl(330,70%,55%)]/20 text-center">
                    <p className="text-2xl font-bold text-[hsl(330,70%,55%)]">{showSecret ? `$${totalDealValue.toLocaleString()}` : "•••"}</p>
                    <p className="text-xs text-muted-foreground mt-1">CRM Deal Pipeline</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[hsl(160,60%,45%)]/5 border border-[hsl(160,60%,45%)]/20 text-center">
                    <p className="text-2xl font-bold text-[hsl(160,60%,45%)]">
                      {showSecret ? `$${recentBookings.length > 0 ? Math.round(totalRevenue / recentBookings.length) : 0}` : "•••"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Avg Booking Value</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[hsl(217,91%,60%)]/5 border border-[hsl(217,91%,60%)]/20 text-center">
                    <p className="text-2xl font-bold text-[hsl(217,91%,60%)]">
                      {showSecret ? `$${(totalRevenue + totalDealValue).toLocaleString()}` : "•••"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Total Platform Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice">
            <OwnerVoiceAssistantTab />
          </TabsContent>

          <TabsContent value="onboarding">
            <OwnerOnboardingTab />
          </TabsContent>

          <TabsContent value="retention">
            <OwnerRetentionTab />
          </TabsContent>
        </Tabs>
      </main>
      <AiGuideChatbot context="dashboard" industry="hospitality" />
    </div>
  );
};

export default OwnerConsole;
