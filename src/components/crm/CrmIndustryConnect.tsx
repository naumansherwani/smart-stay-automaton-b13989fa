import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, Building2, Sparkles, CheckCircle2, Copy, Mail, Loader2, RefreshCw } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { INDUSTRY_CONFIGS, type IndustryType } from "@/lib/industryConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Step = "select" | "code-sent" | "connected";

export default function CrmIndustryConnect() {
  const { user } = useAuth();
  const { profile, updateIndustry } = useProfile();
  const [step, setStep] = useState<Step>("connected");
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>("hospitality");
  const [generatedCode, setGeneratedCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [sending, setSending] = useState(false);
  const [autoManage, setAutoManage] = useState(true);

  const currentIndustry = profile?.industry || "hospitality";
  const config = INDUSTRY_CONFIGS[currentIndustry];
  const isConnected = step === "connected";

  // Generate a simple 6-digit code
  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleStartConnect = () => {
    setSelectedIndustry(currentIndustry);
    setStep("select");
    setInputCode("");
    setGeneratedCode("");
  };

  const handleSendCode = async () => {
    if (!user) return;
    setSending(true);

    // Generate code
    const code = generateCode();
    setGeneratedCode(code);

    // Save code to user's alerts as a notification
    await supabase.from("alerts").insert({
      user_id: user.id,
      type: "crm_connect",
      title: "🔗 CRM Connection Code",
      message: `Your industry connection code is: ${code}. Enter this code in CRM → Connect tab to link your work with ${INDUSTRY_CONFIGS[selectedIndustry]?.label || selectedIndustry}.`,
    });

    setSending(false);
    setStep("code-sent");
    toast.success("Connection code generated! Check your notifications 🔔");
  };

  const handleVerifyCode = async () => {
    if (inputCode.trim() === generatedCode) {
      await updateIndustry(selectedIndustry);
      setStep("connected");
      toast.success(`✅ Successfully connected to ${INDUSTRY_CONFIGS[selectedIndustry]?.label}!`);
    } else {
      toast.error("Invalid code. Please check and try again.");
    }
  };

  const handleDisconnect = () => {
    setStep("select");
    setGeneratedCode("");
    setInputCode("");
    toast.info("Disconnected from industry CRM");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success("Code copied!");
  };

  // ─── Step 1: Select Industry ───
  if (step === "select") {
    return (
      <Card className="border-primary/20 max-w-lg mx-auto">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5 text-primary" />
            Connect Your Work to Industry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
            <p className="text-sm text-foreground font-medium mb-1">How it works:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Select your company's industry below</li>
              <li>Click "Get Connection Code" — a code will be sent to your notifications</li>
              <li>Enter that code to confirm and connect</li>
              <li>AI will automatically manage your work!</li>
            </ol>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Your Industry</label>
            <Select value={selectedIndustry} onValueChange={(v) => setSelectedIndustry(v as IndustryType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INDUSTRY_CONFIGS).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" onClick={handleSendCode} disabled={sending}>
            {sending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
            ) : (
              <><Mail className="h-4 w-4 mr-2" />Get Connection Code</>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            A 6-digit code will appear in your 🔔 notifications
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Step 2: Enter Code ───
  if (step === "code-sent") {
    return (
      <Card className="border-primary/20 max-w-lg mx-auto">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-5 w-5 text-primary" />
            Enter Connection Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-center">
            <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
              ✅ Code sent to your notifications!
            </p>
            <p className="text-xs text-muted-foreground">
              Check the 🔔 bell icon in the top bar
            </p>
          </div>

          {/* Show code directly for easy access */}
          <div className="rounded-lg bg-muted/50 border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">Your connection code:</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-mono font-bold tracking-[0.3em] text-primary">
                {generatedCode}
              </span>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copyCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Enter Code to Confirm</label>
            <Input
              placeholder="Enter 6-digit code"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              maxLength={6}
              className="text-center text-lg font-mono tracking-widest"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep("select")}>
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleVerifyCode}
              disabled={inputCode.length !== 6}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm & Connect
            </Button>
          </div>

          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={handleSendCode}>
            <RefreshCw className="h-3 w-3 mr-1" />Resend Code
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ─── Step 3: Connected ───
  return (
    <Card className="border-primary/20 max-w-lg mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-5 w-5 text-primary" />
          Industry CRM Connection
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 ml-auto">
            <CheckCircle2 className="h-3 w-3 mr-1" />Connected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
          <p className="font-medium text-sm text-foreground mb-2">
            ✅ Your work is connected to: {config?.label} {config?.icon}
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• AI auto-schedules tasks based on {config?.label} workflows</li>
            <li>• Contacts, deals & tickets sync with industry standards</li>
            <li>• Performance tracked against {config?.label} benchmarks</li>
          </ul>
        </div>

        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">AI Auto-Manage Tasks</span>
          </div>
          <Switch checked={autoManage} onCheckedChange={setAutoManage} />
        </div>

        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <span className="text-sm">CRM Sync Active</span>
          </div>
          <Badge variant="outline" className="text-xs">Always On</Badge>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleStartConnect}>
            <RefreshCw className="h-4 w-4 mr-2" />Change Industry
          </Button>
          <Button variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
