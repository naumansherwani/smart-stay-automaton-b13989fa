import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeShim } from "@/lib/replitApi";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Mail, Phone, Building2, Globe, Users, Sparkles, FileText, Receipt, Banknote,
  CheckCircle2, XCircle, Send, Plus, Loader2, Wand2, FileSignature, Star
} from "lucide-react";
import { toast } from "sonner";
import { DEAL_STAGES, STAGE_COLORS, fmtGBP, type DealStage, type EntLead } from "@/hooks/useEnterpriseCrm";
import ComposeModal, { type ComposeInitial } from "@/components/founder/email/ComposeModal";

interface Props {
  lead: EntLead | null;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

interface AiInsight {
  score: number;
  priority: "low" | "medium" | "high" | "urgent";
  est_value_gbp: number;
  suggested_package: string;
  next_step: string;
  risk_flags: string[];
  win_probability: number;
}

const PACKAGE_TEMPLATES: Record<string, ComposeInitial> = {
  proposal: {
    subject: "HostFlow AI · Custom Enterprise Proposal",
    body: "Hi {{name}},\n\nThank you for your interest in HostFlow AI. Based on your requirements ({{industry}}, {{team}} team), I've prepared a tailored proposal:\n\n• Multi-user workspace with SSO\n• Custom AI workflows for your operations\n• Dedicated async onboarding (no calls required)\n• Priority support with SLA\n• Invoice / contract billing in GBP\n\nI'll send the full PDF proposal in a follow-up email shortly. Let me know if you'd like any adjustments.\n\nBest regards,\nNauman Sherwani\nFounder, HostFlow AI Technologies\nconnectai@hostflowai.net",
    fromIdentity: "advisor",
  },
  pricing: {
    subject: "HostFlow AI · Enterprise Pricing",
    body: "Hi {{name}},\n\nAs requested, here's our Enterprise pricing structure tailored for {{company}}:\n\n• Tier 1 (up to 25 seats): from £499/month\n• Tier 2 (26–100 seats): from £1,200/month\n• Tier 3 (100+ seats): custom quote\n\nAll Enterprise tiers include dedicated onboarding, custom workflows, SSO, and priority support. Final pricing depends on your selected workflows and integrations.\n\nHappy to walk through anything by email.\n\nNauman",
    fromIdentity: "advisor",
  },
  contract: {
    subject: "HostFlow AI · Service Agreement Ready for Review",
    body: "Hi {{name}},\n\nPlease find attached the HostFlow AI Service Agreement for {{company}}.\n\nKey terms:\n• 12-month initial term, monthly auto-renewal thereafter\n• 30-day termination notice\n• 99.9% uptime SLA\n• GDPR-compliant data processing addendum included\n\nReply with any redlines and we'll iterate. Once signed, we'll generate the first invoice.\n\nBest,\nNauman",
    fromIdentity: "advisor",
  },
  invoice: {
    subject: "HostFlow AI · Invoice for {{company}}",
    body: "Hi {{name}},\n\nPlease find your invoice attached.\n\nAmount due: £___\nDue date: Net 14\nPayment methods: Bank transfer or custom payment link (details below).\n\nLet me know once payment is initiated and we'll trigger account activation.\n\nBilling team\nbilling@hostflowai.net",
    fromIdentity: "billing",
  },
  bank_transfer: {
    subject: "HostFlow AI · Bank Transfer Details for {{company}}",
    body: "Hi {{name}},\n\nFor bank transfer payment, please use the following details:\n\nBank: Clear Bank UK\nAccount Name: HostFlow AI Technologies Ltd\nSort Code: __-__-__\nAccount Number: ________\nIBAN: GB__ CLRB ____ ____ ____ __\nSWIFT/BIC: CLRBGB22\nReference: {{company}}-ENT\n\nKindly send the remittance confirmation to billing@hostflowai.net so we can match the payment quickly.\n\nThanks,\nBilling team",
    fromIdentity: "billing",
  },
};

export default function EntLeadDetailSheet({ lead, open, onClose, onChanged }: Props) {
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeInit, setComposeInit] = useState<ComposeInitial | undefined>();
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Reset on lead change
  useEffect(() => {
    setInsight(null);
    setNoteText("");
  }, [lead?.id]);

  const computeLocalInsight = useMemo<AiInsight | null>(() => {
    if (!lead) return null;
    let score = 40;
    const flags: string[] = [];
    const teamMap: Record<string, number> = { "1-10": 10, "11-50": 25, "51-200": 50, "201-500": 75, "500+": 95 };
    const teamScore = teamMap[lead.team_size || ""] || 15;
    score += teamScore * 0.4;
    if (lead.country && /united kingdom|usa|united states|germany|france|uae|saudi/i.test(lead.country)) score += 15;
    if (lead.industry) score += 5;
    if ((lead.features_needed || "").length > 80) score += 8;
    if ((lead.current_challenges || "").length > 80) score += 7;
    if (!lead.phone) flags.push("No phone — email-only follow-up");
    if (!(lead.features_needed || "").trim()) flags.push("No automation requirements specified");
    if ((lead.team_size || "") === "1-10") flags.push("Small team — verify enterprise fit");
    score = Math.min(100, Math.round(score));

    const priority: AiInsight["priority"] =
      score >= 80 ? "urgent" : score >= 65 ? "high" : score >= 45 ? "medium" : "low";

    const estByTeam: Record<string, number> = { "1-10": 6000, "11-50": 18000, "51-200": 48000, "201-500": 96000, "500+": 180000 };
    const est_value_gbp = lead.estimated_value_gbp ? Number(lead.estimated_value_gbp) : (estByTeam[lead.team_size || ""] || 12000);

    const pkg = score >= 80 ? "Enterprise Tier 3 (custom)" : score >= 65 ? "Enterprise Tier 2" : "Enterprise Tier 1";

    const next_step =
      lead.status === "new" ? "Send custom proposal email within 24h"
      : lead.status === "qualified" ? "Send pricing PDF + book follow-up"
      : lead.status === "proposal" ? "Send contract draft + bank transfer details"
      : lead.status === "negotiation" ? "Confirm scope and lock in pricing"
      : "Mark won and trigger onboarding";

    return { score, priority, est_value_gbp, suggested_package: pkg, next_step, risk_flags: flags, win_probability: Math.min(95, Math.round(score * 0.85)) };
  }, [lead]);

  useEffect(() => {
    setInsight(computeLocalInsight);
  }, [computeLocalInsight]);

  async function refreshAiInsight() {
    if (!lead) return;
    setInsightLoading(true);
    try {
      const { data, error } = await invokeShim("founder-adviser", {
        body: {
          mode: "enterprise_lead_score",
          messages: [
            { role: "system", content: "You are an enterprise sales adviser. Reply ONLY with strict JSON: {\"score\":0-100,\"priority\":\"low|medium|high|urgent\",\"est_value_gbp\":number,\"suggested_package\":\"string\",\"next_step\":\"string\",\"risk_flags\":[\"string\"],\"win_probability\":0-100}" },
            { role: "user", content: `Score this enterprise lead:\nCompany: ${lead.company_name}\nIndustry: ${lead.industry || "n/a"}\nCountry: ${lead.country || "n/a"}\nTeam: ${lead.team_size || "n/a"}\nChallenges: ${lead.current_challenges || "n/a"}\nFeatures needed: ${lead.features_needed || "n/a"}\nCurrent status: ${lead.status}` },
          ],
        },
      });
      if (error) throw error;
      const reply = data?.reply || data?.content || "";
      const match = reply.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setInsight({ ...computeLocalInsight!, ...parsed });
        toast.success("AI insight refreshed");
      } else {
        toast.message("AI returned no structured insight — keeping local score.");
      }
    } catch (e: any) {
      toast.error("AI refresh failed — local insight retained.");
    } finally {
      setInsightLoading(false);
    }
  }

  function fillTemplate(tmpl: ComposeInitial): ComposeInitial {
    if (!lead) return tmpl;
    const replace = (s: string) => s
      .replace(/\{\{name\}\}/g, lead.full_name?.split(" ")[0] || "there")
      .replace(/\{\{company\}\}/g, lead.company_name || "your team")
      .replace(/\{\{industry\}\}/g, lead.industry || "your industry")
      .replace(/\{\{team\}\}/g, lead.team_size || "your");
    return { ...tmpl, to: lead.work_email, subject: tmpl.subject ? replace(tmpl.subject) : "", body: tmpl.body ? replace(tmpl.body) : "" };
  }

  function openCompose(tmpl: ComposeInitial) {
    setComposeInit(fillTemplate(tmpl));
    setComposeOpen(true);
  }

  async function setStatus(status: DealStage) {
    if (!lead) return;
    setUpdating(true);
    const { error } = await supabase.from("enterprise_leads").update({ status }).eq("id", lead.id);
    setUpdating(false);
    if (error) toast.error("Update failed");
    else { toast.success(`Marked ${status}`); onChanged(); }
  }

  async function addNote() {
    if (!lead || !noteText.trim()) return;
    setSavingNote(true);
    const { error } = await supabase.from("ent_notes").insert({ lead_id: lead.id, body: noteText.trim() });
    setSavingNote(false);
    if (error) toast.error("Could not save note");
    else { toast.success("Note added"); setNoteText(""); }
  }

  async function handleSend(payload: any) {
    const { data, error } = await supabase.functions.invoke("resend-send", { body: { action: "send", ...payload } });
    if (error) throw new Error(error.message);
    if (!data?.ok) throw new Error(data?.error || "Send failed");
    if (lead) {
      await supabase.from("ent_notes").insert({ lead_id: lead.id, body: `📧 Email sent: ${payload.subject}` });
    }
    return data.data;
  }

  if (!lead) return null;

  const priorityColor =
    insight?.priority === "urgent" ? "bg-red-500/15 text-red-400 border-red-500/30" :
    insight?.priority === "high"   ? "bg-orange-500/15 text-orange-400 border-orange-500/30" :
    insight?.priority === "medium" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                                     "bg-slate-500/15 text-slate-400 border-slate-500/30";

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0 bg-background border-l border-amber-500/20">
          <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-b border-border/40">
            <SheetHeader className="text-left space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-lg font-bold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">{lead.company_name}</span>
                  </SheetTitle>
                  <SheetDescription className="text-xs flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-foreground/80">{lead.full_name}</span>
                    <span>·</span>
                    <a href={`mailto:${lead.work_email}`} className="text-amber-400 hover:underline inline-flex items-center gap-1"><Mail className="w-3 h-3" />{lead.work_email}</a>
                    {lead.phone && <><span>·</span><span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span></>}
                  </SheetDescription>
                </div>
                <Badge variant="outline" className={`${STAGE_COLORS[lead.status as DealStage] || ""} capitalize shrink-0`}>{lead.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {lead.industry && <Badge variant="outline" className="text-[10px]">{lead.industry}</Badge>}
                {lead.country && <Badge variant="outline" className="text-[10px]"><Globe className="w-2.5 h-2.5 mr-1" />{lead.country}</Badge>}
                {lead.team_size && <Badge variant="outline" className="text-[10px]"><Users className="w-2.5 h-2.5 mr-1" />{lead.team_size}</Badge>}
              </div>
            </SheetHeader>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* AI Sales Advisor */}
            {insight && (
              <section className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold">AI Sales Advisor</h3>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={refreshAiInsight} disabled={insightLoading}>
                    {insightLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                    Refresh
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Stat label="Lead Score" value={`${insight.score}/100`} />
                  <Stat label="Priority" value={<Badge variant="outline" className={`${priorityColor} capitalize text-[10px]`}>{insight.priority}</Badge>} />
                  <Stat label="Est. Value" value={fmtGBP(insight.est_value_gbp)} />
                  <Stat label="Win Probability" value={`${insight.win_probability}%`} />
                </div>
                <div className="text-xs space-y-1.5 pt-1">
                  <div><span className="text-muted-foreground">Suggested package:</span> <span className="font-semibold text-amber-400">{insight.suggested_package}</span></div>
                  <div><span className="text-muted-foreground">Best next step:</span> <span className="text-foreground/90">{insight.next_step}</span></div>
                  {insight.risk_flags.length > 0 && (
                    <div className="flex items-start gap-1.5 pt-1">
                      <span className="text-muted-foreground shrink-0">Risk flags:</span>
                      <div className="flex flex-wrap gap-1">
                        {insight.risk_flags.map((f) => <Badge key={f} variant="outline" className="text-[9px] border-orange-500/30 text-orange-400">{f}</Badge>)}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Founder Action Buttons */}
            <section className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Founder Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <ActionBtn icon={Send} label="Send Proposal" onClick={() => openCompose(PACKAGE_TEMPLATES.proposal)} />
                <ActionBtn icon={FileText} label="Send Pricing" onClick={() => openCompose(PACKAGE_TEMPLATES.pricing)} />
                <ActionBtn icon={FileSignature} label="Send Contract" onClick={() => openCompose(PACKAGE_TEMPLATES.contract)} />
                <ActionBtn icon={Receipt} label="Generate Invoice" onClick={() => openCompose(PACKAGE_TEMPLATES.invoice)} />
                <ActionBtn icon={Banknote} label="Bank Transfer" onClick={() => openCompose(PACKAGE_TEMPLATES.bank_transfer)} />
                <ActionBtn icon={Mail} label="Custom Email" onClick={() => openCompose({ to: lead.work_email, fromIdentity: "advisor" })} />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button size="sm" variant="outline" className="h-9 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10" disabled={updating} onClick={() => setStatus("won")}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Mark Won
                </Button>
                <Button size="sm" variant="outline" className="h-9 border-red-500/40 text-red-400 hover:bg-red-500/10" disabled={updating} onClick={() => setStatus("lost")}>
                  <XCircle className="w-3.5 h-3.5 mr-1.5" /> Mark Lost
                </Button>
              </div>
            </section>

            <Separator />

            {/* Pipeline quick move */}
            <section className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Pipeline Stage</h3>
              <div className="flex flex-wrap gap-1.5">
                {DEAL_STAGES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    disabled={updating || lead.status === s}
                    className={`text-[10px] capitalize px-2.5 py-1 rounded-md border transition-all ${
                      lead.status === s
                        ? `${STAGE_COLORS[s]} font-semibold ring-1 ring-current/30`
                        : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>

            <Separator />

            {/* Lead detail */}
            <section className="space-y-3">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Requirements</h3>
              {lead.current_challenges && (
                <div className="text-xs">
                  <div className="text-muted-foreground mb-1">Current challenges</div>
                  <div className="text-foreground/90 whitespace-pre-wrap p-3 rounded-lg bg-muted/30 border border-border/40">{lead.current_challenges}</div>
                </div>
              )}
              {lead.features_needed && (
                <div className="text-xs">
                  <div className="text-muted-foreground mb-1">Features needed</div>
                  <div className="text-foreground/90 whitespace-pre-wrap p-3 rounded-lg bg-muted/30 border border-border/40">{lead.features_needed}</div>
                </div>
              )}
              {!lead.current_challenges && !lead.features_needed && (
                <p className="text-xs text-muted-foreground italic">No requirements provided.</p>
              )}
            </section>

            <Separator />

            {/* Notes */}
            <section className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Add Note</h3>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Internal note about this lead…"
                rows={3}
                className="text-xs"
              />
              <Button size="sm" onClick={addNote} disabled={savingNote || !noteText.trim()} className="h-8">
                {savingNote ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                Save Note
              </Button>
              <p className="text-[10px] text-muted-foreground">Notes appear in the Notes tab. Email actions are auto-logged.</p>
            </section>

            <Separator />

            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <div>Submitted {new Date(lead.created_at).toLocaleString("en-GB")}</div>
              <div>Source: {lead.source}</div>
              <div>Reply identity: <span className="text-amber-400">connectai@hostflowai.net</span></div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSend={handleSend}
        initial={composeInit}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg bg-background/60 border border-border/40 px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-bold text-foreground mt-0.5 truncate">{value}</div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onClick}
      className="h-9 justify-start text-[11px] border-border/60 hover:border-amber-500/40 hover:bg-amber-500/5"
    >
      <Icon className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
      {label}
    </Button>
  );
}
