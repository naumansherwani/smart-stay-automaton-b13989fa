import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { LANGUAGES } from "@/i18n";
import { INDUSTRY_CONFIGS, type IndustryType } from "@/lib/industryConfig";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, Globe, Bell, Palette, Building2, CreditCard, Plus, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import IndustryIcon from "@/components/dashboard/IndustryIcon";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { profile, updateProfile, updateIndustry } = useProfile();
  const { subscription } = useSubscription();
  const { workspaces, activeWorkspace, createWorkspace, switchWorkspace } = useWorkspaces();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [company, setCompany] = useState(profile?.company_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [theme, setTheme] = useState<string>(localStorage.getItem("theme") || "dark");
  const [showAddIndustry, setShowAddIndustry] = useState(false);

  const industryLabel = profile?.industry
    ? INDUSTRY_CONFIGS[profile.industry]?.label || profile.industry
    : "Not selected";

  const planLabel = subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : "Free Trial";

  const handleThemeChange = (val: string) => {
    setTheme(val);
    localStorage.setItem("theme", val);
    if (val === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSaveProfile = async () => {
    await updateProfile({ display_name: displayName, company_name: company, phone });
    toast.success(t("settings.saved"));
  };

  const handleSwitchWorkspace = async (ws: typeof workspaces[0]) => {
    await switchWorkspace(ws.id);
    await updateIndustry(ws.industry);
    toast.success(`Switched to ${ws.name}`);
    navigate("/dashboard");
  };

  const handleAddIndustry = async (industry: IndustryType) => {
    const label = INDUSTRY_CONFIGS[industry]?.label || industry;
    const ws = await createWorkspace(label, industry);
    if (ws) {
      await updateIndustry(industry);
      toast.success(`${label} workspace created!`);
      setShowAddIndustry(false);
      navigate("/dashboard");
    }
  };

  // Industries already added
  const addedIndustries = workspaces.map(ws => ws.industry);
  const availableIndustries = Object.values(INDUSTRY_CONFIGS).filter(
    c => !addedIndustries.includes(c.id)
  );

  return (
    <AppLayout>
      <div className="container py-8 max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground">Manage your account, workspace, and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="profile" className="gap-1.5 text-xs">
              <User className="w-3.5 h-3.5" /> Profile
            </TabsTrigger>
            <TabsTrigger value="workspace" className="gap-1.5 text-xs">
              <Building2 className="w-3.5 h-3.5" /> Workspace
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-1.5 text-xs">
              <CreditCard className="w-3.5 h-3.5" /> Billing
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-1.5 text-xs">
              <Palette className="w-3.5 h-3.5" /> Preferences
            </TabsTrigger>
            <TabsTrigger value="industries" className="gap-1.5 text-xs">
              <Globe className="w-3.5 h-3.5" /> Industries
            </TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Account Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled className="bg-muted/30" />
                </div>
                <div>
                  <Label>{t("settings.displayName")}</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div>
                  <Label>{t("settings.company")}</Label>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
                <div>
                  <Label>{t("settings.phone")}</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <Button onClick={handleSaveProfile} className="bg-gradient-primary">
                  {t("settings.save")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WORKSPACE TAB */}
          <TabsContent value="workspace">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current Workspace</CardTitle>
                <CardDescription>Your active industry workspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center gap-3">
                    {profile?.industry && <IndustryIcon industry={profile.industry} size={24} />}
                    <div>
                      <p className="text-sm font-medium text-foreground">{industryLabel}</p>
                      <p className="text-xs text-muted-foreground">Primary workspace</p>
                    </div>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  To manage or add industries, go to the <strong>Industries</strong> tab.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BILLING TAB */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Subscription & Billing</CardTitle>
                <CardDescription>Manage your plan and payment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">Current Plan</p>
                    <p className="text-xs text-muted-foreground">
                      {subscription?.status === "trialing" ? "Free trial active" : "Active subscription"}
                    </p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20">{planLabel}</Badge>
                </div>
                {subscription?.trial_ends_at && subscription.status === "trialing" && (
                  <p className="text-xs text-muted-foreground">
                    Trial ends: {new Date(subscription.trial_ends_at).toLocaleDateString()}
                  </p>
                )}
                <Button variant="outline" onClick={() => window.location.href = "/pricing"}>
                  View Plans & Upgrade
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PREFERENCES TAB */}
          <TabsContent value="preferences">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="w-4 h-4" /> {t("settings.theme")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={theme} onValueChange={handleThemeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">{t("settings.dark")}</SelectItem>
                      <SelectItem value="light">{t("settings.light")}</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" /> {t("settings.language")}
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4" /> {t("settings.notifications")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("settings.emailNotifs")}</p>
                      <p className="text-xs text-muted-foreground">{t("settings.emailNotifsDesc")}</p>
                    </div>
                    <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("settings.pushNotifs")}</p>
                      <p className="text-xs text-muted-foreground">{t("settings.pushNotifsDesc")}</p>
                    </div>
                    <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("settings.marketingEmails")}</p>
                      <p className="text-xs text-muted-foreground">{t("settings.marketingEmailsDesc")}</p>
                    </div>
                    <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* INDUSTRIES TAB */}
          <TabsContent value="industries">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Manage Industries</CardTitle>
                  <CardDescription>Switch between workspaces or add new industries</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workspaces.length > 0 ? (
                    workspaces.map(ws => (
                      <div
                        key={ws.id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                          ws.is_active
                            ? "border-primary/40 bg-primary/5"
                            : "border-border bg-muted/10 hover:border-primary/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IndustryIcon industry={ws.industry} size={22} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{ws.name}</p>
                            <p className="text-xs text-muted-foreground">{INDUSTRY_CONFIGS[ws.industry]?.label}</p>
                          </div>
                        </div>
                        {ws.is_active ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            <Check className="w-3 h-3 mr-1" /> Active
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleSwitchWorkspace(ws)}
                          >
                            Switch <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20">
                      <div className="flex items-center gap-3">
                        {profile?.industry && <IndustryIcon industry={profile.industry} size={22} />}
                        <div>
                          <p className="text-sm font-medium text-foreground">{industryLabel}</p>
                          <p className="text-xs text-muted-foreground">Current workspace</p>
                        </div>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        <Check className="w-3 h-3 mr-1" /> Active
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add New Industry */}
              {!showAddIndustry ? (
                <Button
                  onClick={() => setShowAddIndustry(true)}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Plus className="w-4 h-4" /> Add New Industry
                </Button>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Select an Industry</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setShowAddIndustry(false)}>
                        Cancel
                      </Button>
                    </div>
                    <CardDescription>Choose an industry to create a new workspace</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availableIndustries.map(config => (
                        <button
                          key={config.id}
                          onClick={() => handleAddIndustry(config.id)}
                          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                        >
                          <IndustryIcon industry={config.id} size={28} />
                          <div>
                            <p className="text-sm font-semibold text-foreground">{config.label}</p>
                            <p className="text-xs text-muted-foreground">Create workspace</p>
                          </div>
                        </button>
                      ))}
                      {availableIndustries.length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-2 text-center py-4">
                          All industries have been added.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
