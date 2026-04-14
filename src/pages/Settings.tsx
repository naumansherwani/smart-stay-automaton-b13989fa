import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users, Shield, Bell, Palette, CreditCard, Globe, Crown,
  BarChart3, Mail, Activity, Lock, Eye, Server, Zap,
  UserCheck, UserX, AlertTriangle, TrendingUp, Settings as SettingsIcon
} from "lucide-react";
import { toast } from "sonner";
import { LANGUAGES } from "@/i18n";
import { getUserAvatarUrl, getUserDisplayName, getUserInitials } from "@/lib/utils";
import AiGuideChatbot from "@/components/AiGuideChatbot";

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { subscription } = useSubscription();
  const [isAdmin, setIsAdmin] = useState(false);
  const [theme, setTheme] = useState<string>(localStorage.getItem("theme") || "dark");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  // Admin stats
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    // Fetch admin stats
    supabase.from("profiles").select("id", { count: "exact", head: true }).then(({ count }) => {
      setTotalUsers(count || 0);
    });
    supabase.from("profiles").select("id", { count: "exact", head: true })
      .gte("updated_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .then(({ count }) => {
        setActiveUsers(count || 0);
      });
  }, [isAdmin]);

  const handleThemeChange = (val: string) => {
    setTheme(val);
    localStorage.setItem("theme", val);
    if (val === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const displayName = getUserDisplayName(user, profile?.display_name);
  const avatarUrl = getUserAvatarUrl(user, profile?.avatar_url);
  const initials = getUserInitials(displayName, user?.email);

  if (!isAdmin) {
    // Non-admin: simple preferences only
    return (
      <AppLayout>
        <div className="container py-8 max-w-3xl space-y-6">
          <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Palette className="w-4 h-4" /> Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Theme</Label>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Language</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                  {LANGUAGES.map((lang) => (
                    <Button
                      key={lang.code}
                      variant={i18n.language === lang.code ? "default" : "outline"}
                      size="sm"
                      className={`gap-1.5 ${i18n.language === lang.code ? "bg-gradient-primary" : ""}`}
                      onClick={() => i18n.changeLanguage(lang.code)}
                    >
                      <span>{lang.flag}</span>
                      <span className="text-xs">{lang.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Admin/Owner Settings
  return (
    <AppLayout>
      <div className="container py-8 max-w-4xl space-y-6">
        {/* Owner Header */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-3 border-primary/40 shadow-lg ring-2 ring-primary/10">
            <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Owner Console</h1>
              <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30">
                <Crown className="w-3 h-3 mr-1" /> Owner
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{user?.email} · Platform Administrator</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase">Total Users</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-emerald-500 mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase">Active (7d)</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{activeUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-500 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase">Industries</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">8</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-500 mb-1">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase">Security</span>
              </div>
              <p className="text-2xl font-extrabold text-emerald-500">Secured</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="platform" className="space-y-6">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="platform" className="gap-1.5 text-xs">
              <Server className="w-3.5 h-3.5" /> Platform
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" /> Users
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-1.5 text-xs">
              <Mail className="w-3.5 h-3.5" /> Email
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5 text-xs">
              <Shield className="w-3.5 h-3.5" /> Security
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-1.5 text-xs">
              <Palette className="w-3.5 h-3.5" /> Appearance
            </TabsTrigger>
          </TabsList>

          {/* PLATFORM TAB */}
          <TabsContent value="platform">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" /> Platform Overview
                  </CardTitle>
                  <CardDescription>Your HostFlow AI platform status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-xs text-muted-foreground">Plan</p>
                      <p className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-500" />
                        {subscription?.plan === "premium" ? "Premium (Lifetime)" : subscription?.plan || "Trial"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-xs text-muted-foreground">Role</p>
                      <p className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" /> Owner / Admin
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm font-medium text-foreground">🏢 HostFlow AI</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Multi-industry AI platform · 8 Industries · Smart CRM · AI Automation
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Revenue Controls
                  </CardTitle>
                  <CardDescription>Manage subscription plans and pricing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">Subscription Plans</p>
                      <p className="text-xs text-muted-foreground">Trial · Starter · Professional · Premium</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.info("Plan management coming soon")}>
                      Manage
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">Payment History</p>
                      <p className="text-xs text-muted-foreground">View all platform transactions</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.info("Payment history coming soon")}>
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> User Management
                </CardTitle>
                <CardDescription>Manage registered users and roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <UserCheck className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
                    <p className="text-xl font-bold">{totalUsers}</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <Activity className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                    <p className="text-xl font-bold">{activeUsers}</p>
                    <p className="text-xs text-muted-foreground">Active (7 days)</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <UserX className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xl font-bold">{totalUsers - activeUsers}</p>
                    <p className="text-xs text-muted-foreground">Inactive</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">View All Users</p>
                    <p className="text-xs text-muted-foreground">See details, assign roles, ban/unban users</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast.info("Full user list coming soon")}>
                    Open
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Role Management</p>
                    <p className="text-xs text-muted-foreground">Assign admin, moderator, or user roles</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast.info("Role management coming soon")}>
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EMAIL TAB */}
          <TabsContent value="email">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" /> Email Configuration
                  </CardTitle>
                  <CardDescription>Manage email domain, templates, and notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">Sender Domain</p>
                      <p className="text-xs text-muted-foreground">hostflowai.live</p>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">Email Templates</p>
                      <p className="text-xs text-muted-foreground">Customize booking confirmations, welcome emails, etc.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.info("Template editor coming soon")}>
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" /> Notification Rules
                  </CardTitle>
                  <CardDescription>Configure what triggers email notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">New User Signup</p>
                      <p className="text-xs text-muted-foreground">Get notified when someone signs up</p>
                    </div>
                    <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">New Booking</p>
                      <p className="text-xs text-muted-foreground">Get notified on new bookings across industries</p>
                    </div>
                    <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Security Alerts</p>
                      <p className="text-xs text-muted-foreground">Unusual login attempts, mass deletes</p>
                    </div>
                    <Switch checked={true} disabled />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SECURITY TAB */}
          <TabsContent value="security">
            <div className="space-y-4">
              <Card className="border-emerald-500/20">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" /> Security Overview
                  </CardTitle>
                  <CardDescription>Platform security status and controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <p className="text-xs text-muted-foreground">RLS Policies</p>
                      <p className="text-sm font-bold text-emerald-500 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Enabled
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <p className="text-xs text-muted-foreground">2FA</p>
                      <p className="text-sm font-bold text-emerald-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Available
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">Audit Logs</p>
                      <p className="text-xs text-muted-foreground">View all security-related activity</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.info("Audit logs coming soon")}>
                      View
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">Security Alerts</p>
                      <p className="text-xs text-muted-foreground">Mass deletes, suspicious exports, rapid edits</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.info("Security alerts dashboard coming soon")}>
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" /> Data Protection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">Data Encryption</p>
                      <p className="text-xs text-muted-foreground">All data encrypted at rest and in transit</p>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">API Key Management</p>
                      <p className="text-xs text-muted-foreground">Rotate and manage API keys</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.info("API key management coming soon")}>
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* APPEARANCE TAB */}
          <TabsContent value="preferences">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Theme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={theme} onValueChange={handleThemeChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Language
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {LANGUAGES.map((lang) => (
                      <Button
                        key={lang.code}
                        variant={i18n.language === lang.code ? "default" : "outline"}
                        size="sm"
                        className={`gap-1.5 ${i18n.language === lang.code ? "bg-gradient-primary" : ""}`}
                        onClick={() => i18n.changeLanguage(lang.code)}
                      >
                        <span>{lang.flag}</span>
                        <span className="text-xs">{lang.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <AiGuideChatbot context="settings" industry={profile?.industry || "hospitality"} />
    </AppLayout>
  );
};

export default Settings;
