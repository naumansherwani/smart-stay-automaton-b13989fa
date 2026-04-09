import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, DollarSign, Calendar, TrendingUp, Shield, Brain,
  BarChart3, Globe, Activity, Crown, Plane, Car, Stethoscope,
  GraduationCap, Truck, Theater, Hotel, Eye, EyeOff
} from "lucide-react";
import Logo from "@/components/Logo";

const INDUSTRY_ICONS: Record<string, any> = {
  hospitality: Hotel, airlines: Plane, car_rental: Car,
  healthcare: Stethoscope, education: GraduationCap,
  logistics: Truck, events_entertainment: Theater,
};

const INDUSTRY_COLORS: Record<string, string> = {
  hospitality: "#0d9488", airlines: "#3b82f6", car_rental: "#0ea5e9",
  healthcare: "#ef4444", education: "#8b5cf6",
  logistics: "#f97316", events_entertainment: "#d946ef",
};

const OwnerConsole = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0, totalBookings: 0, totalResources: 0,
    activeSubscriptions: 0, trialingUsers: 0, industries: {} as Record<string, number>,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [showSecret, setShowSecret] = useState(true);

  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchStats = async () => {
      const [profiles, bookings, resources, subscriptions] = await Promise.all([
        supabase.from("profiles").select("id, display_name, company_name, industry, created_at, user_id"),
        supabase.from("bookings").select("id, guest_name, check_in, check_out, status, total_price, created_at, resource_id"),
        supabase.from("resources").select("id, name, industry"),
        supabase.from("subscriptions").select("id, status, plan, is_lifetime, user_id"),
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
      });

      setRecentUsers((profiles.data || []).slice(-10).reverse());
      setRecentBookings((bookings.data || []).slice(-20).reverse());
    };
    fetchStats();
  }, [isAdmin]);

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Activity className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const totalRevenue = recentBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-yellow-400" />
            <span className="text-lg font-bold text-foreground">Owner Console</span>
            <Badge className="bg-yellow-400/10 text-yellow-400 border-yellow-400/30">SECRET</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSecret(!showSecret)}>
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/dashboard"}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Users, label: "Total Users", value: stats.totalUsers, color: "text-primary" },
            { icon: Calendar, label: "Total Bookings", value: stats.totalBookings, color: "text-[hsl(217,91%,60%)]" },
            { icon: Globe, label: "Resources", value: stats.totalResources, color: "text-[hsl(160,60%,45%)]" },
            { icon: Shield, label: "Active Subs", value: stats.activeSubscriptions, color: "text-[hsl(270,80%,70%)]" },
            { icon: Activity, label: "Trialing", value: stats.trialingUsers, color: "text-[hsl(38,92%,60%)]" },
            { icon: DollarSign, label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, color: "text-[hsl(160,60%,45%)]" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center space-y-1">
                <s.icon className={`w-6 h-6 mx-auto ${s.color}`} />
                <p className={`text-2xl font-bold ${s.color}`}>{showSecret ? s.value : "•••"}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 7-in-1 Industry Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              7-in-1 Industry Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {Object.entries(INDUSTRY_ICONS).map(([key, Icon]) => (
                <div
                  key={key}
                  className="p-4 rounded-xl border border-border hover:border-primary/30 transition-all text-center space-y-2 group cursor-default"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto"
                    style={{ backgroundColor: `${INDUSTRY_COLORS[key]}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: INDUSTRY_COLORS[key] }} />
                  </div>
                  <p className="text-xs font-semibold text-foreground capitalize">{key.replace(/_/g, " ")}</p>
                  <p className="text-lg font-bold" style={{ color: INDUSTRY_COLORS[key] }}>
                    {showSecret ? (stats.industries[key] || 0) : "•"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">resources</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="w-3.5 h-3.5" /> Users
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Bookings
            </TabsTrigger>
            <TabsTrigger value="revenue" className="gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Revenue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader><CardTitle className="text-sm">Recent Users</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b">
                        <th className="pb-2 font-medium">Name</th>
                        <th className="pb-2 font-medium">Company</th>
                        <th className="pb-2 font-medium">Industry</th>
                        <th className="pb-2 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((u) => (
                        <tr key={u.id} className="border-b border-border/50">
                          <td className="py-2 text-foreground">{showSecret ? u.display_name : "•••"}</td>
                          <td className="py-2 text-muted-foreground">{showSecret ? (u.company_name || "—") : "•••"}</td>
                          <td className="py-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {u.industry?.replace(/_/g, " ") || "—"}
                            </Badge>
                          </td>
                          <td className="py-2 text-muted-foreground text-xs">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {recentUsers.length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No users yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
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

          <TabsContent value="revenue">
            <Card>
              <CardHeader><CardTitle className="text-sm">Revenue Summary</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                    <p className="text-2xl font-bold text-primary">{showSecret ? `$${totalRevenue.toLocaleString()}` : "•••"}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Booking Revenue</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[hsl(160,60%,45%)]/5 border border-[hsl(160,60%,45%)]/20 text-center">
                    <p className="text-2xl font-bold text-[hsl(160,60%,45%)]">
                      {showSecret ? `$${recentBookings.length > 0 ? Math.round(totalRevenue / recentBookings.length) : 0}` : "•••"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Avg Booking Value</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[hsl(217,91%,60%)]/5 border border-[hsl(217,91%,60%)]/20 text-center">
                    <p className="text-2xl font-bold text-[hsl(217,91%,60%)]">
                      {showSecret ? stats.totalBookings : "•••"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Lifetime Bookings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OwnerConsole;
