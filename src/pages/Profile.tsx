import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Save, User, Building2, Phone, Globe, Crown, Loader2, Camera, ShieldCheck, ShieldAlert, Smartphone, LogOut, Key, CheckCircle2, XCircle, Monitor } from "lucide-react";
import { toast } from "sonner";
import { type IndustryType } from "@/lib/industryConfig";
import { getUserAvatarUrl, getUserDisplayName, getUserInitials } from "@/lib/utils";

const industries: { value: IndustryType; label: string }[] = [
  { value: "hospitality", label: "Hospitality" },
  { value: "airlines", label: "Airlines" },
  { value: "car_rental", label: "Car Rental" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "logistics", label: "Logistics" },
  { value: "events_entertainment", label: "Events & Entertainment" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { subscription } = useSubscription();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState<IndustryType>("hospitality");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 2FA State
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [enrollQR, setEnrollQR] = useState<string | null>(null);
  const [enrollSecret, setEnrollSecret] = useState<string | null>(null);
  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);

  // Session State
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [signingOutAll, setSigningOutAll] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setCompanyName(profile.company_name || "");
      setPhone(profile.phone || "");
      setIndustry(profile.industry || "hospitality");
    }
  }, [profile]);

  // Check MFA status
  useEffect(() => {
    const checkMFA = async () => {
      setMfaLoading(true);
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (!error && data) {
          const verifiedFactors = data.totp.filter(f => f.status === "verified");
          setMfaEnabled(verifiedFactors.length > 0);
        }
      } catch {
        // MFA not available
      }
      setMfaLoading(false);
    };
    if (user) {
      checkMFA();
      setLastSignIn(user.last_sign_in_at || null);
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await updateProfile({ avatar_url: newUrl });
      toast.success("Profile photo updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        company_name: companyName,
        phone,
        industry,
      })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile updated successfully!");
    }
  };

  // 2FA Functions
  const handleEnroll2FA = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });
      if (error) throw error;
      setEnrollQR(data.totp.qr_code);
      setEnrollSecret(data.totp.secret);
      setEnrollFactorId(data.id);
      setShowEnrollDialog(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to start 2FA setup");
    }
    setEnrolling(false);
  };

  const handleVerifyEnrollment = async () => {
    if (!enrollFactorId || verifyCode.length !== 6) return;
    setEnrolling(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollFactorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollFactorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;

      setMfaEnabled(true);
      setShowEnrollDialog(false);
      setVerifyCode("");
      setEnrollQR(null);
      setEnrollSecret(null);
      setEnrollFactorId(null);
      toast.success("🔒 Two-Factor Authentication enabled! Your account is now secured.");
    } catch (err: any) {
      toast.error(err.message || "Invalid verification code. Please try again.");
    }
    setEnrolling(false);
  };

  const handleDisable2FA = async () => {
    setDisabling2FA(true);
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      if (data?.totp) {
        for (const factor of data.totp) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }
      setMfaEnabled(false);
      toast.success("Two-Factor Authentication disabled");
    } catch (err: any) {
      toast.error(err.message || "Failed to disable 2FA");
    }
    setDisabling2FA(false);
  };

  // Session Functions
  const handleSignOutAll = async () => {
    setSigningOutAll(true);
    try {
      await supabase.auth.signOut({ scope: "global" });
      toast.success("Signed out from all devices");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out");
    }
    setSigningOutAll(false);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const resolvedDisplayName = displayName || getUserDisplayName(user, profile?.display_name);
  const avatarUrl = getUserAvatarUrl(user, profile?.avatar_url);
  const initials = getUserInitials(resolvedDisplayName, user?.email);
  const planLabel = subscription?.plan ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) : "Trial";
  const statusLabel = subscription?.status === "active" ? "Active" : subscription?.status === "trialing" ? "Trial" : subscription?.status || "Unknown";

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Unknown";
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Logo size="lg" showName />
          </div>
          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
            Log Out
          </Button>
        </div>
      </header>

      <main className="container py-8 max-w-2xl space-y-6">
        {/* Profile Card with Security Badge */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="w-28 h-28 border-4 border-primary/30 shadow-xl ring-4 ring-primary/10">
                  <AvatarImage src={avatarUrl ?? undefined} alt={`${resolvedDisplayName} profile photo`} />
                  <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">{resolvedDisplayName}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    <Crown className="w-3 h-3 mr-1" /> {planLabel}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{statusLabel}</Badge>
                  {/* Account Secured Badge */}
                  {!mfaLoading && (
                    mfaEnabled ? (
                      <Badge className="text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Account Secured ✅
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20">
                        <ShieldAlert className="w-3 h-3 mr-1" /> 2FA Not Enabled
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🔒 Two-Factor Authentication */}
        <Card className={mfaEnabled ? "border-emerald-500/30" : "border-amber-500/30"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" /> Two-Factor Authentication (2FA)
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account using an authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Smartphone className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Authenticator App</p>
                  <p className="text-sm text-muted-foreground">
                    {mfaLoading ? "Checking status..." : mfaEnabled ? "Active — your account is protected" : "Not configured — enable for extra security"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {mfaLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : mfaEnabled ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDisable2FA}
                      disabled={disabling2FA}
                    >
                      {disabling2FA ? <Loader2 className="w-4 h-4 animate-spin" /> : "Disable"}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="bg-gradient-primary"
                    onClick={handleEnroll2FA}
                    disabled={enrolling}
                  >
                    {enrolling ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ShieldCheck className="w-4 h-4 mr-1" />}
                    Enable 2FA
                  </Button>
                )}
              </div>
            </div>

            {!mfaEnabled && !mfaLoading && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>Recommendation:</strong> Enable 2FA to protect your account from unauthorized access. 
                  Use Google Authenticator, Authy, or any TOTP-compatible app.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 📱 Session Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" /> Session Management
            </CardTitle>
            <CardDescription>
              Manage your active sessions and sign out from other devices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Session */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Current Session</p>
                    <p className="text-xs text-muted-foreground">This device — Active now</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                  Active
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 rounded bg-background/60">
                  <span className="text-muted-foreground">Last Sign In</span>
                  <p className="font-medium text-foreground">{formatDate(lastSignIn)}</p>
                </div>
                <div className="p-2 rounded bg-background/60">
                  <span className="text-muted-foreground">Auth Provider</span>
                  <p className="font-medium text-foreground capitalize">
                    {user?.app_metadata?.provider || "email"}
                  </p>
                </div>
                <div className="p-2 rounded bg-background/60">
                  <span className="text-muted-foreground">Email Verified</span>
                  <p className="font-medium text-foreground flex items-center gap-1">
                    {user?.email_confirmed_at ? (
                      <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Yes</>
                    ) : (
                      <><XCircle className="w-3 h-3 text-red-500" /> No</>
                    )}
                  </p>
                </div>
                <div className="p-2 rounded bg-background/60">
                  <span className="text-muted-foreground">2FA Status</span>
                  <p className="font-medium text-foreground flex items-center gap-1">
                    {mfaEnabled ? (
                      <><ShieldCheck className="w-3 h-3 text-emerald-500" /> Enabled</>
                    ) : (
                      <><ShieldAlert className="w-3 h-3 text-amber-500" /> Disabled</>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Sign Out All Devices */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/5">
              <div>
                <p className="font-medium text-sm text-foreground">Sign Out All Devices</p>
                <p className="text-xs text-muted-foreground">
                  This will sign you out from all browsers and devices
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSignOutAll}
                disabled={signingOutAll}
              >
                {signingOutAll ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <LogOut className="w-4 h-4 mr-1" />
                )}
                Sign Out All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone"><Phone className="w-3.5 h-3.5 inline mr-1" />Phone</Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567 890" />
            </div>
          </CardContent>
        </Card>

        {/* Company & Industry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Company & Industry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your company" />
            </div>
            <div className="space-y-2">
              <Label><Globe className="w-3.5 h-3.5 inline mr-1" />Industry</Label>
              <Select value={industry} onValueChange={v => setIndustry(v as IndustryType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {industries.map(i => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </main>

      {/* 2FA Enrollment Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Setup Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app, then enter the 6-digit code to verify
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* QR Code */}
            {enrollQR && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={enrollQR} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}

            {/* Manual Secret */}
            {enrollSecret && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Can't scan? Enter this code manually:</p>
                <div className="p-2 bg-muted rounded-md font-mono text-xs text-center break-all select-all">
                  {enrollSecret}
                </div>
              </div>
            )}

            {/* Verify Code */}
            <div className="space-y-2">
              <Label htmlFor="verifyCode">Verification Code</Label>
              <Input
                id="verifyCode"
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
              />
            </div>

            <Button
              onClick={handleVerifyEnrollment}
              disabled={verifyCode.length !== 6 || enrolling}
              className="w-full bg-gradient-primary"
            >
              {enrolling ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ShieldCheck className="w-4 h-4 mr-2" />
              )}
              Verify & Enable 2FA
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
