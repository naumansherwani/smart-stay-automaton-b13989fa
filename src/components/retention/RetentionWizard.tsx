import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { invokeShim } from "@/lib/replitApi";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  DollarSign, Activity, Sparkles, Wrench, Trophy, PauseCircle, MoreHorizontal,
  Heart, ArrowDown, X, Check, Loader2, Download, Zap, Clock, Globe2
} from "lucide-react";

type Reason = "expensive" | "low_usage" | "missing_features" | "technical" | "competitor" | "temporary_break" | "other";

const REASONS: { id: Reason; label: string; icon: any; color: string }[] = [
  { id: "expensive", label: "Too expensive", icon: DollarSign, color: "text-amber-500" },
  { id: "low_usage", label: "Not using enough", icon: Activity, color: "text-blue-500" },
  { id: "missing_features", label: "Missing features", icon: Sparkles, color: "text-purple-500" },
  { id: "technical", label: "Technical problems", icon: Wrench, color: "text-rose-500" },
  { id: "competitor", label: "Switching competitor", icon: Trophy, color: "text-orange-500" },
  { id: "temporary_break", label: "Temporary break", icon: PauseCircle, color: "text-cyan-500" },
  { id: "other", label: "Other", icon: MoreHorizontal, color: "text-muted-foreground" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCompleted?: () => void;
}

export default function RetentionWizard({ open, onOpenChange, onCompleted }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState<Reason | null>(null);
  const [reasonDetails, setReasonDetails] = useState("");
  const [competitorName, setCompetitorName] = useState("");
  const [featureRequested, setFeatureRequested] = useState("");
  const [satisfactionScore, setSatisfactionScore] = useState<number>(7);
  const [valueSummary, setValueSummary] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [offerAccepted, setOfferAccepted] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1); setReason(null); setReasonDetails(""); setCompetitorName("");
      setFeatureRequested(""); setSatisfactionScore(7); setOfferAccepted(null);
    }
  }, [open]);

  // Fetch personal value summary when entering step 3
  useEffect(() => {
    if (step !== 3 || !user || valueSummary) return;
    (async () => {
      const [logs, usage] = await Promise.all([
        supabase.from("crm_activity_logs").select("id").eq("user_id", user.id),
        supabase.from("feature_usage").select("feature_key, usage_count, last_used_at").eq("user_id", user.id),
      ]);
      const aiTasks = (usage.data ?? []).reduce((s, u: any) => s + (u.usage_count || 0), 0);
      const hoursSaved = Math.round(aiTasks * 0.4);
      const usageScore = Math.min(100, Math.round((aiTasks * 2) + ((logs.data?.length || 0) * 1)));
      setValueSummary({
        logins: logs.data?.length || 0,
        ai_tasks: aiTasks,
        hours_saved: hoursSaved,
        revenue_opportunities: Math.round(aiTasks * 12),
        languages_used: 1,
        usage_score: usageScore,
        features_used: usage.data?.length || 0,
      });
    })();
  }, [step, user, valueSummary]);

  const submit = async (action: "stayed" | "paused" | "downgraded" | "canceled", extra: any = {}) => {
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await invokeShim("retention-action", {
        body: {
          action,
          reason: reason || "other",
          reasonDetails,
          competitorName: competitorName || null,
          featureRequested: featureRequested || null,
          valueSummary: valueSummary || {},
          offerShown: offerAccepted,
          satisfactionScore: action === "canceled" ? satisfactionScore : null,
          freeText: action === "canceled" ? reasonDetails : null,
          ...extra,
        },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      const labels: Record<string, string> = {
        stayed: "Welcome back! 💙 We're glad you stayed.",
        paused: "Subscription paused. We'll see you soon!",
        downgraded: "Plan downgraded successfully.",
        canceled: "Cancellation processed. We're sorry to see you go.",
      };
      toast.success(labels[action]);
      onCompleted?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const exportData = async () => {
    if (!user) return;
    const tables = ["bookings", "crm_contacts", "crm_deals", "feature_usage"];
    const all: Record<string, any> = {};
    for (const t of tables) {
      const { data } = await (supabase.from(t as any) as any).select("*").eq("user_id", user.id);
      all[t] = data ?? [];
    }
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `hostflow-data-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported");
  };

  const offers = useMemo(() => {
    switch (reason) {
      case "expensive":
        return [
          { id: "discount_20", label: "Get 20% off next month", icon: DollarSign, action: () => { setOfferAccepted("discount_20"); submit("stayed", { offerShown: "discount_20" }); } },
          { id: "downgrade_basic", label: "Downgrade to a lower plan", icon: ArrowDown, action: () => { setOfferAccepted("downgrade_basic"); submit("downgraded", { downgradeTo: "basic" }); } },
        ];
      case "low_usage":
        return [
          { id: "pause_30", label: "Pause for 30 days (free)", icon: PauseCircle, action: () => { setOfferAccepted("pause_30"); submit("paused", { pauseDays: 30 }); } },
          { id: "show_features", label: "Show me unused features", icon: Sparkles, action: () => { setOfferAccepted("show_features"); window.open("/dashboard", "_blank"); } },
        ];
      case "missing_features":
        return [
          { id: "feature_request", label: "Request a feature", icon: Sparkles, action: () => setStep(2.5 as any) },
          { id: "roadmap", label: "View product roadmap", icon: Globe2, action: () => window.open("https://hostflowai.net/about", "_blank") },
        ];
      case "technical":
        return [
          { id: "priority_support", label: "Get priority support ticket", icon: Zap, action: () => { setOfferAccepted("priority_support"); submit("stayed", { offerShown: "priority_support" }); } },
          { id: "live_help", label: "Open live help chat", icon: Heart, action: () => { setOfferAccepted("live_help"); window.open("https://hostflowai.net/contact", "_blank"); } },
        ];
      case "competitor":
        return [
          { id: "custom_discount", label: "Get custom retention discount", icon: DollarSign, action: () => { setOfferAccepted("custom_discount"); submit("stayed", { offerShown: "custom_discount" }); } },
        ];
      case "temporary_break":
        return [
          { id: "pause_7", label: "Pause 7 days", icon: Clock, action: () => { setOfferAccepted("pause_7"); submit("paused", { pauseDays: 7 }); } },
          { id: "pause_30", label: "Pause 30 days", icon: Clock, action: () => { setOfferAccepted("pause_30"); submit("paused", { pauseDays: 30 }); } },
          { id: "pause_60", label: "Pause 60 days", icon: Clock, action: () => { setOfferAccepted("pause_60"); submit("paused", { pauseDays: 60 }); } },
        ];
      default:
        return [];
    }
  }, [reason]);

  const progress = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            Before you go...
          </DialogTitle>
          <Progress value={progress} className="h-1.5 mt-2" />
        </DialogHeader>

        {/* Step 1: Reason */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Help us improve — what's the main reason you're leaving?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REASONS.map(r => {
                const Icon = r.icon;
                const selected = reason === r.id;
                return (
                  <Card
                    key={r.id}
                    onClick={() => setReason(r.id)}
                    className={`p-3 cursor-pointer transition-all hover:border-primary/50 ${selected ? "border-primary bg-primary/5" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${r.color}`} />
                      <span className="text-sm font-medium">{r.label}</span>
                      {selected && <Check className="w-4 h-4 text-primary ml-auto" />}
                    </div>
                  </Card>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Never mind</Button>
              <Button disabled={!reason} onClick={() => setStep(2)}>Continue</Button>
            </div>
          </div>
        )}

        {/* Step 2: Save offers */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Badge className="mb-2 bg-primary/15 text-primary border-primary/30">Personalized for you</Badge>
              <h3 className="text-base font-semibold">Wait — we have something better for you</h3>
              <p className="text-sm text-muted-foreground mt-1">Pick an option that works, or continue to cancel.</p>
            </div>

            {reason === "competitor" && (
              <Input placeholder="Which competitor? (helps us improve)" value={competitorName} onChange={e => setCompetitorName(e.target.value)} />
            )}
            {reason === "missing_features" && (
              <Input placeholder="What feature did you need?" value={featureRequested} onChange={e => setFeatureRequested(e.target.value)} />
            )}

            <div className="grid gap-2">
              {offers.map(o => {
                const Icon = o.icon;
                return (
                  <Card key={o.id} className="p-3 hover:border-primary/50 transition-all">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{o.label}</span>
                      </div>
                      <Button size="sm" onClick={o.action} disabled={submitting}>
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept"}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button variant="outline" onClick={() => setStep(3)}>No thanks, continue</Button>
            </div>
          </div>
        )}

        {/* Step 3: Personal value summary */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">Look what you've built with HostFlow AI</h3>
              <p className="text-sm text-muted-foreground mt-1">All this will pause if you leave.</p>
            </div>
            {!valueSummary ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <ValueStat label="Logins" value={valueSummary.logins} icon={Activity} color="text-blue-500" />
                <ValueStat label="AI tasks done" value={valueSummary.ai_tasks} icon={Sparkles} color="text-purple-500" />
                <ValueStat label="Hours saved" value={`${valueSummary.hours_saved}h`} icon={Clock} color="text-emerald-500" />
                <ValueStat label="Revenue opps" value={`$${valueSummary.revenue_opportunities}`} icon={DollarSign} color="text-amber-500" />
                <ValueStat label="Features used" value={valueSummary.features_used} icon={Zap} color="text-rose-500" />
                <ValueStat label="Usage score" value={`${valueSummary.usage_score}/100`} icon={Trophy} color="text-orange-500" />
              </div>
            )}
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)}>Continue</Button>
            </div>
          </div>
        )}

        {/* Step 4: Final confirm */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Choose your final action</h3>

            <Textarea
              placeholder="Anything else you'd like us to know? (optional)"
              value={reasonDetails}
              onChange={e => setReasonDetails(e.target.value)}
              maxLength={1000}
              rows={3}
            />

            <div className="grid gap-2">
              <Button onClick={() => submit("stayed")} disabled={submitting} className="justify-start gap-2 h-auto py-3">
                <Heart className="w-4 h-4 text-rose-500" />
                <div className="text-left">
                  <div className="font-semibold">Stay subscribed</div>
                  <div className="text-xs text-primary-foreground/70">Keep all features and your progress</div>
                </div>
              </Button>
              <Button variant="outline" onClick={() => submit("paused", { pauseDays: 30 })} disabled={submitting} className="justify-start gap-2 h-auto py-3">
                <PauseCircle className="w-4 h-4 text-cyan-500" />
                <div className="text-left">
                  <div className="font-semibold">Pause account 30 days</div>
                  <div className="text-xs text-muted-foreground">No charges, resume anytime</div>
                </div>
              </Button>
              <Button variant="outline" onClick={() => submit("downgraded", { downgradeTo: "basic" })} disabled={submitting} className="justify-start gap-2 h-auto py-3">
                <ArrowDown className="w-4 h-4 text-amber-500" />
                <div className="text-left">
                  <div className="font-semibold">Downgrade plan</div>
                  <div className="text-xs text-muted-foreground">Pay less, keep core features</div>
                </div>
              </Button>
              <Button variant="outline" onClick={exportData} disabled={submitting} className="justify-start gap-2 h-auto py-3">
                <Download className="w-4 h-4 text-blue-500" />
                <div className="text-left">
                  <div className="font-semibold">Export my data first</div>
                  <div className="text-xs text-muted-foreground">Download everything as JSON</div>
                </div>
              </Button>
              <Button variant="ghost" onClick={() => submit("canceled")} disabled={submitting} className="justify-start gap-2 h-auto py-3 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10">
                <X className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-semibold">Cancel subscription</div>
                  <div className="text-xs opacity-70">We'll be sad, but we understand</div>
                </div>
              </Button>
            </div>

            <div className="flex justify-start">
              <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ValueStat({ label, value, icon: Icon, color }: { label: string; value: any; icon: any; color: string }) {
  return (
    <Card className="p-3">
      <Icon className={`w-4 h-4 ${color}`} />
      <div className="text-lg font-bold mt-1">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}