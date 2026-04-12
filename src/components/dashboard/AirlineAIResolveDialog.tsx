import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Mail, DollarSign, Zap, Send, CheckCircle2, AlertTriangle,
  Smile, Meh, Frown, Plane, Clock, Users, CreditCard, Gift
} from "lucide-react";
import { toast } from "sonner";

interface DisruptedFlight {
  flight: string;
  route: string;
  delay: string;
  reason: string;
  passengers: number;
  connections: number;
  severity: string;
}

interface AirlineAIResolveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flight: DisruptedFlight | null;
  onResolved: (flightCode: string) => void;
}

// Compensation calculation based on delay duration and EU261/DOT guidelines
function calculateCompensation(delayStr: string, passengers: number) {
  const minutes = parseInt(delayStr) || 0;
  let perPassenger = 0;
  let tier = "Standard";

  if (minutes >= 180) {
    perPassenger = 600;
    tier = "Maximum (3h+)";
  } else if (minutes >= 120) {
    perPassenger = 400;
    tier = "High (2-3h)";
  } else if (minutes >= 60) {
    perPassenger = 250;
    tier = "Medium (1-2h)";
  } else if (minutes >= 30) {
    perPassenger = 100;
    tier = "Standard (30-60min)";
  } else {
    perPassenger = 50;
    tier = "Courtesy (<30min)";
  }

  return {
    perPassenger,
    total: perPassenger * passengers,
    tier,
    minutes,
  };
}

function generateApologyEmail(flight: DisruptedFlight, compensation: number) {
  return `Dear Valued Passenger,

We sincerely apologize for the disruption to your flight ${flight.flight} (${flight.route}).

Due to ${flight.reason.toLowerCase()}, your flight experienced a delay of ${flight.delay}. We understand how frustrating this can be, and we take full responsibility for the inconvenience caused.

As part of our commitment to your satisfaction, we are offering you a compensation of $${compensation.toFixed(2)} per passenger. You may choose to receive this as:
• A direct refund to your original payment method
• A travel voucher worth 125% of the compensation amount ($${(compensation * 1.25).toFixed(2)})

${flight.connections > 0 ? `We have also automatically rebooked the ${flight.connections} affected connecting passenger(s) on the next available flights at no additional cost.\n` : ""}Our customer care team is available 24/7 should you need further assistance.

Thank you for your patience and continued trust in our airline.

Warm regards,
Customer Experience Team
AI-Assisted Resolution | Ref: ${flight.flight}-${Date.now().toString(36).toUpperCase()}`;
}

export default function AirlineAIResolveDialog({
  open, onOpenChange, flight, onResolved
}: AirlineAIResolveDialogProps) {
  const [step, setStep] = useState<"compose" | "sending" | "done">("compose");
  const [emailBody, setEmailBody] = useState("");
  const [subject, setSubject] = useState("");
  const [compensationType, setCompensationType] = useState<"refund" | "voucher">("voucher");
  const [isVoucher, setIsVoucher] = useState(true);
  const [sentimentBefore, setSentimentBefore] = useState(25);
  const [sentimentAfter, setSentimentAfter] = useState(25);
  const [sendProgress, setSendProgress] = useState(0);

  const comp = flight ? calculateCompensation(flight.delay, flight.passengers) : null;

  useEffect(() => {
    if (flight && open) {
      setStep("compose");
      setSendProgress(0);
      const compensation = calculateCompensation(flight.delay, flight.passengers);
      setSubject(`Apology & Compensation — Flight ${flight.flight} Delay`);
      setEmailBody(generateApologyEmail(flight, compensation.perPassenger));
      setIsVoucher(true);
      setCompensationType("voucher");
      // Simulate current sentiment based on severity
      const baseSentiment = flight.severity === "critical" ? 15 : flight.severity === "high" ? 30 : 50;
      setSentimentBefore(baseSentiment);
      setSentimentAfter(baseSentiment);
    }
  }, [flight, open]);

  const handleSendAndResolve = async () => {
    if (!flight || !comp) return;
    setStep("sending");

    // Simulate sending progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 80));
      setSendProgress(i);
    }

    // Simulate sentiment improvement after resolution
    const improvement = isVoucher ? 45 : 35; // voucher gives better sentiment
    const newSentiment = Math.min(95, sentimentBefore + improvement);
    setSentimentAfter(newSentiment);

    setStep("done");

    toast.success(
      `✈️ Disruption resolved for ${flight.flight}: ${flight.passengers} emails sent, $${comp.total.toLocaleString()} ${isVoucher ? "vouchers" : "refunds"} queued.`
    );
  };

  const handleClose = () => {
    if (flight && step === "done") {
      onResolved(flight.flight);
    }
    onOpenChange(false);
    // Reset after close animation
    setTimeout(() => setStep("compose"), 300);
  };

  if (!flight || !comp) return null;

  const voucherAmount = comp.perPassenger * 1.25;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-primary" />
            AI Disruption Resolution — {flight.flight}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <Plane className="w-3 h-3" /> {flight.route}
            </Badge>
            <Badge variant="destructive" className="gap-1">
              <Clock className="w-3 h-3" /> +{flight.delay}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Users className="w-3 h-3" /> {flight.passengers} passengers
            </Badge>
            <Badge variant="outline" className={
              flight.severity === "critical" ? "text-destructive border-destructive/30" :
              flight.severity === "high" ? "text-warning border-warning/30" : "text-muted-foreground"
            }>
              {flight.severity.toUpperCase()}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {step === "compose" && (
          <div className="space-y-5 mt-2">
            {/* ── Compensation Calculator ── */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-success" />
                Compensation Calculator
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-card p-3 border border-border/60 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Per Passenger</p>
                  <p className="text-xl font-bold text-foreground">${comp.perPassenger}</p>
                </div>
                <div className="rounded-lg bg-card p-3 border border-border/60 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total ({flight.passengers} pax)</p>
                  <p className="text-xl font-bold text-primary">${comp.total.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-card p-3 border border-border/60 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tier</p>
                  <p className="text-xs font-semibold text-foreground mt-1">{comp.tier}</p>
                </div>
              </div>

              {/* Refund / Voucher Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/60">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className={`w-4 h-4 ${!isVoucher ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${!isVoucher ? "text-foreground" : "text-muted-foreground"}`}>
                      Refund (${comp.perPassenger})
                    </span>
                  </div>
                </div>
                <Switch
                  checked={isVoucher}
                  onCheckedChange={(checked) => {
                    setIsVoucher(checked);
                    setCompensationType(checked ? "voucher" : "refund");
                  }}
                />
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${isVoucher ? "text-foreground" : "text-muted-foreground"}`}>
                    Voucher (${voucherAmount.toFixed(0)})
                  </span>
                  <Gift className={`w-4 h-4 ${isVoucher ? "text-success" : "text-muted-foreground"}`} />
                </div>
              </div>
              {isVoucher && (
                <p className="text-[11px] text-success flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Voucher includes 25% bonus — better retention & sentiment impact
                </p>
              )}
            </div>

            {/* ── AI Email Composer ── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                AI-Generated Apology Email
                <Badge variant="secondary" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                  <Zap className="w-3 h-3 mr-0.5" /> Auto-generated
                </Badge>
              </h3>
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Email Body</Label>
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={10}
                  className="text-sm font-mono leading-relaxed"
                />
              </div>
            </div>

            {/* ── Current Sentiment ── */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Frown className="w-4 h-4 text-warning" />
                Current Passenger Sentiment
              </h3>
              <div className="flex items-center gap-3">
                <Progress value={sentimentBefore} className="flex-1 h-2" />
                <span className={`text-sm font-bold ${
                  sentimentBefore >= 60 ? "text-success" : sentimentBefore >= 35 ? "text-warning" : "text-destructive"
                }`}>
                  {sentimentBefore}%
                </span>
                {sentimentBefore < 35 ? (
                  <Frown className="w-4 h-4 text-destructive" />
                ) : sentimentBefore < 60 ? (
                  <Meh className="w-4 h-4 text-warning" />
                ) : (
                  <Smile className="w-4 h-4 text-success" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Based on {flight.delay} delay and {flight.severity} severity disruption
              </p>
            </div>
          </div>
        )}

        {step === "sending" && (
          <div className="py-12 space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Send className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Sending personalized emails to {flight.passengers} passengers...
              </p>
              <p className="text-xs text-muted-foreground">
                Processing {isVoucher ? "vouchers" : "refunds"} simultaneously
              </p>
            </div>
            <div className="max-w-xs mx-auto space-y-1">
              <Progress value={sendProgress} className="h-2" />
              <p className="text-[11px] text-muted-foreground">{sendProgress}% complete</p>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="py-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <p className="text-lg font-semibold text-foreground">Disruption Resolved!</p>
              <p className="text-sm text-muted-foreground">
                {flight.passengers} personalized emails sent with {isVoucher ? "travel vouchers" : "refunds"}
              </p>
            </div>

            {/* Resolution Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Emails Sent</p>
                <p className="text-2xl font-bold text-foreground">{flight.passengers}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {isVoucher ? "Vouchers Issued" : "Refunds Queued"}
                </p>
                <p className="text-2xl font-bold text-success">
                  ${(isVoucher ? comp.perPassenger * 1.25 * flight.passengers : comp.total).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Sentiment Before/After */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Smile className="w-4 h-4 text-success" />
                Sentiment Impact
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Before</p>
                  <div className="flex items-center gap-2">
                    <Progress value={sentimentBefore} className="flex-1 h-2" />
                    <span className="text-sm font-bold text-destructive">{sentimentBefore}%</span>
                    <Frown className="w-4 h-4 text-destructive" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">After Resolution</p>
                  <div className="flex items-center gap-2">
                    <Progress value={sentimentAfter} className="flex-1 h-2" />
                    <span className="text-sm font-bold text-success">{sentimentAfter}%</span>
                    <Smile className="w-4 h-4 text-success" />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-success font-medium">
                ↑ +{sentimentAfter - sentimentBefore}% sentiment improvement after AI resolution
              </p>
            </div>

            {flight.connections > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                ✈️ {flight.connections} connecting passengers auto-rebooked on next available flights
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "compose" && (
            <div className="flex items-center gap-2 w-full justify-between">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSendAndResolve} className="gap-2">
                <Send className="w-4 h-4" />
                Send & Resolve ({flight.passengers} emails)
              </Button>
            </div>
          )}
          {step === "done" && (
            <Button onClick={handleClose} className="w-full gap-2">
              <CheckCircle2 className="w-4 h-4" /> Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
