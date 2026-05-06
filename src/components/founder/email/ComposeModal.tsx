import { useState } from "react";
import { X, Send, Sparkles, FileText, Loader2, Wand2, Clock, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SEND_IDENTITIES = [
  { id: "advisor",    address: "connectai@hostflowai.net", label: "HostFlow ConnectAI · AI Advisor", color: "#06B6D4" },
  { id: "enterprise", address: "connectai@hostflowai.net", label: "HostFlow AI · Enterprise Sales (Owner)", color: "#F59E0B" },
  { id: "support",    address: "support@hostflowai.net",   label: "Support",          color: "#10B981" },
  { id: "billing",    address: "billing@hostflowai.net",   label: "Billing",          color: "#3B82F6" },
  { id: "general",    address: "naumansherwani@hostflowai.net", label: "Founder (Owner)", color: "#8B5CF6" },
] as const;
type SendIdentityId = typeof SEND_IDENTITIES[number]["id"];

const TEMPLATES: Record<string, { subject: string; body: string }> = {
  welcome: {
    subject: "Welcome to HostFlow AI Technologies",
    body: "Hi {{name}},\n\nThank you for reaching out to HostFlow AI Technologies. I'm Nauman, founder of HostFlow AI.\n\nI'd love to learn more about your business and how we can help you scale.\n\nBest,\nNauman Sherwani\nFounder, HostFlow AI Technologies",
  },
  demo: {
    subject: "Your HostFlow AI Demo · Booking Confirmation",
    body: "Hi {{name}},\n\nI've reserved time on the calendar for your HostFlow AI demo.\n\nMeeting link: {{link}}\nDate & time: {{date}}\n\nLooking forward to it.\n\nNauman",
  },
  followup: {
    subject: "Quick follow-up",
    body: "Hi {{name}},\n\nFollowing up on my last note — happy to jump on a quick call this week if useful.\n\nBest,\nNauman",
  },
  proposal: {
    subject: "HostFlow AI · Proposal Inside",
    body: "Hi {{name}},\n\nAs discussed, here is the tailored proposal for your team. I've kept it focused on the highest-ROI items first.\n\nLet me know what stands out.\n\nNauman",
  },
  payment: {
    subject: "Friendly payment reminder",
    body: "Hi {{name}},\n\nA quick reminder that invoice {{invoice}} is due. Let me know if you need anything from our side.\n\nThanks,\nNauman",
  },
  enterprise: {
    subject: "Welcome to HostFlow AI Enterprise",
    body: "Hi {{name}},\n\nWelcome aboard. Our enterprise onboarding team will reach out within 24 hours with your dedicated success manager.\n\nMy direct line is below — use it any time.\n\nNauman Sherwani\nFounder, HostFlow AI Technologies",
  },
};

const AI_MODES = [
  { id: "draft", label: "Draft from intent", icon: Wand2 },
  { id: "reply", label: "Professional reply", icon: Sparkles },
  { id: "shorten", label: "Shorten", icon: Sparkles },
  { id: "persuasive", label: "More persuasive", icon: Sparkles },
  { id: "grammar", label: "Fix grammar", icon: Sparkles },
  { id: "sales", label: "Sales tone", icon: Sparkles },
  { id: "founder", label: "Founder tone", icon: Sparkles },
  { id: "urgent", label: "Urgent tone", icon: Sparkles },
];

export interface ComposeInitial {
  to?: string; cc?: string; bcc?: string; subject?: string; body?: string; inReplyTo?: string; references?: string; replyContext?: string;
  fromIdentity?: SendIdentityId;
}

export default function ComposeModal({
  open, onClose, onSend, initial,
}: { open: boolean; onClose: () => void; onSend: (p: any) => Promise<any>; initial?: ComposeInitial }) {
  const [to, setTo] = useState(initial?.to || "");
  const [cc, setCc] = useState(initial?.cc || "");
  const [bcc, setBcc] = useState(initial?.bcc || "");
  const [showCc, setShowCc] = useState(!!(initial?.cc || initial?.bcc));
  const [subject, setSubject] = useState(initial?.subject || "");
  const [body, setBody] = useState(initial?.body || "");
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [scheduleAt, setScheduleAt] = useState<string>("");
  const [scheduling, setScheduling] = useState(false);
  const [fromIdentity, setFromIdentity] = useState<SendIdentityId>(initial?.fromIdentity || "advisor");
  const activeIdentity = SEND_IDENTITIES.find((i) => i.id === fromIdentity)!;

  if (!open) return null;

  const applyTemplate = (key: string) => {
    const t = TEMPLATES[key];
    if (!t) return;
    setSubject(t.subject);
    setBody(t.body);
  };

  const runAI = async (mode: string) => {
    setAiBusy(mode);
    try {
      const { data, error } = await supabase.functions.invoke("owner-email-ai", {
        body: { mode, input: body || subject, context: initial?.replyContext || "" },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.text) setBody(data.text);
      toast.success("AI updated draft");
    } catch (e: any) { toast.error(e.message); }
    finally { setAiBusy(null); }
  };

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error("To, subject and body are required"); return;
    }
    setSending(true);
    try {
      const html = `<div style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#0F172A;white-space:pre-wrap">${body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
      await onSend({ to, cc: cc || undefined, bcc: bcc || undefined, subject, html, inReplyTo: initial?.inReplyTo, references: initial?.references, fromIdentity });
      toast.success("Email sent");
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  };

  const handleSchedule = async () => {
    if (!to.trim() || !subject.trim() || !body.trim() || !scheduleAt) {
      toast.error("Need recipient, subject, body and a future date/time"); return;
    }
    const when = new Date(scheduleAt);
    if (isNaN(when.getTime()) || when.getTime() < Date.now() + 30_000) {
      toast.error("Pick a time at least 1 minute in the future"); return;
    }
    setScheduling(true);
    try {
      const html = `<div style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#0F172A;white-space:pre-wrap">${body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("owner_scheduled_emails").insert({
        user_id: user.id, to_addr: to, cc: cc || null, bcc: bcc || null,
        subject, html, in_reply_to: initial?.inReplyTo || null, ref_headers: initial?.references || null,
        send_at: when.toISOString(), status: "pending",
      });
      if (error) throw error;
      toast.success(`Scheduled for ${when.toLocaleString()}`);
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setScheduling(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="founder-card w-full md:max-w-3xl max-h-[92vh] flex flex-col rounded-t-2xl md:rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--fos-border)]">
          <div className="flex items-center gap-2 text-[var(--fos-text)] font-semibold text-sm">
            <Send className="w-4 h-4 text-[var(--fos-accent)]" /> New Message
          </div>
          <button onClick={onClose} className="text-[var(--fos-muted)] hover:text-[var(--fos-text)]"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-3 border-b border-[var(--fos-border)]/60 space-y-2">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[var(--fos-muted)] w-12 shrink-0">To</span>
              <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" className="flex-1 bg-transparent text-[var(--fos-text)] outline-none placeholder:text-[var(--fos-muted)]/50 py-1" />
              <button onClick={() => setShowCc((v) => !v)} className="text-[var(--fos-muted)] hover:text-[var(--fos-accent)] text-[11px]">Cc/Bcc</button>
            </div>
            {showCc && (
              <>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-[var(--fos-muted)] w-12 shrink-0">Cc</span>
                  <input value={cc} onChange={(e) => setCc(e.target.value)} className="flex-1 bg-transparent text-[var(--fos-text)] outline-none placeholder:text-[var(--fos-muted)]/50 py-1" />
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-[var(--fos-muted)] w-12 shrink-0">Bcc</span>
                  <input value={bcc} onChange={(e) => setBcc(e.target.value)} className="flex-1 bg-transparent text-[var(--fos-text)] outline-none placeholder:text-[var(--fos-muted)]/50 py-1" />
                </div>
              </>
            )}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[var(--fos-muted)] w-12 shrink-0">Subject</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="flex-1 bg-transparent text-[var(--fos-text)] outline-none placeholder:text-[var(--fos-muted)]/50 py-1" />
            </div>
          </div>

          <div className="px-5 py-2 border-b border-[var(--fos-border)]/60 flex flex-wrap items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[var(--fos-muted)] mr-1" />
            {Object.entries(TEMPLATES).map(([k]) => (
              <button key={k} onClick={() => applyTemplate(k)} className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-[var(--fos-bg)] text-[var(--fos-muted)] hover:text-[var(--fos-accent)] border border-[var(--fos-border)]">
                {k}
              </button>
            ))}
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
            rows={14}
            className="w-full bg-transparent text-[var(--fos-text)] text-sm leading-relaxed outline-none px-5 py-4 resize-none placeholder:text-[var(--fos-muted)]/50"
          />

          <div className="px-5 py-3 border-t border-[var(--fos-border)]/60 bg-[var(--fos-bg)]/40">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--fos-accent)]" />
              <span className="text-[11px] uppercase tracking-wider text-[var(--fos-muted)] font-semibold">AI Email Assistant</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AI_MODES.map((m) => (
                <button
                  key={m.id}
                  disabled={aiBusy !== null}
                  onClick={() => runAI(m.id)}
                  className="px-2.5 py-1 rounded text-[11px] bg-[var(--fos-card)] text-[var(--fos-text)] hover:border-[var(--fos-accent)] border border-[var(--fos-border)] disabled:opacity-50 flex items-center gap-1"
                >
                  {aiBusy === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <m.icon className="w-3 h-3" />}
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[var(--fos-border)] flex items-center justify-between gap-3 bg-[var(--fos-card)]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--fos-muted)]">From</span>
            <div className="relative">
              <select
                value={fromIdentity}
                onChange={(e) => setFromIdentity(e.target.value as SendIdentityId)}
                className="appearance-none bg-[var(--fos-bg)] border border-[var(--fos-border)] rounded-md text-[11px] text-[var(--fos-text)] pl-5 pr-6 py-1 outline-none focus:border-[var(--fos-accent)] cursor-pointer"
                style={{ borderColor: activeIdentity.color + "55" }}
              >
                {SEND_IDENTITIES.map((i) => (
                  <option key={i.id} value={i.id}>{i.label} — {i.address}</option>
                ))}
              </select>
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ background: activeIdentity.color }} />
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--fos-muted)] pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--fos-bg)] border border-[var(--fos-border)]">
              <Clock className="w-3 h-3 text-[var(--fos-muted)]" />
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="bg-transparent text-[10px] text-[var(--fos-text)] outline-none"
              />
              <button onClick={handleSchedule} disabled={scheduling || !scheduleAt} className="text-[10px] text-[var(--fos-accent)] font-semibold disabled:opacity-40">
                {scheduling ? <Loader2 className="w-3 h-3 animate-spin" /> : "Schedule"}
              </button>
            </div>
            <button onClick={handleSend} disabled={sending} className="px-4 py-1.5 rounded-lg bg-[var(--fos-accent)] text-[#0B1120] font-semibold text-xs flex items-center gap-2 hover:opacity-90 disabled:opacity-50">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}