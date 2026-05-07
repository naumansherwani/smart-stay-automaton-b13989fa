import { useMemo, useRef, useState } from "react";
import {
  X, Send, Sparkles, Loader2, Wand2, Clock, ChevronDown, Paperclip,
  Bold, Italic, Link2, List, Quote, Type, FileText, Hash, ChevronUp,
  Star, Briefcase, Mail, CreditCard, Building2, MessageSquare, Calendar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SEND_IDENTITIES = [
  { id: "advisor",    address: "connectai@hostflowai.net",     label: "HostFlow ConnectAI",       sub: "AI Advisor",          color: "#06B6D4" },
  { id: "enterprise", address: "connectai@hostflowai.net",     label: "Enterprise Sales",         sub: "Owner",               color: "#F59E0B" },
  { id: "support",    address: "support@hostflowai.net",       label: "Support",                  sub: "Customer Success",    color: "#10B981" },
  { id: "billing",    address: "billing@hostflowai.net",       label: "Billing",                  sub: "Finance",             color: "#3B82F6" },
  { id: "general",    address: "naumansherwani@hostflowai.net",label: "Nauman Sherwani",          sub: "Founder",             color: "#8B5CF6" },
] as const;
type SendIdentityId = typeof SEND_IDENTITIES[number]["id"];

type Template = { key: string; label: string; icon: any; subject: string; body: string };
const TEMPLATES: Template[] = [
  { key: "welcome",    label: "Welcome",    icon: Star,
    subject: "Welcome to HostFlow AI Technologies",
    body: "Hi {{name}},\n\nThank you for reaching out to HostFlow AI Technologies. I'm Nauman, founder of HostFlow AI.\n\nI'd love to learn more about your business and how we can help you scale.\n\nBest,\nNauman Sherwani\nFounder, HostFlow AI Technologies" },
  { key: "demo",       label: "Demo",       icon: Calendar,
    subject: "Your HostFlow AI Demo · Booking Confirmation",
    body: "Hi {{name}},\n\nI've reserved time on the calendar for your HostFlow AI demo.\n\nMeeting link: {{link}}\nDate & time: {{date}}\n\nLooking forward to it.\n\nNauman" },
  { key: "followup",   label: "Follow-up",  icon: MessageSquare,
    subject: "Quick follow-up",
    body: "Hi {{name}},\n\nFollowing up on my last note — happy to jump on a quick call this week if useful.\n\nBest,\nNauman" },
  { key: "proposal",   label: "Proposal",   icon: FileText,
    subject: "HostFlow AI · Proposal Inside",
    body: "Hi {{name}},\n\nAs discussed, here is the tailored proposal for your team. I've kept it focused on the highest-ROI items first.\n\nLet me know what stands out.\n\nNauman" },
  { key: "payment",    label: "Payment",    icon: CreditCard,
    subject: "Friendly payment reminder",
    body: "Hi {{name}},\n\nA quick reminder that invoice {{invoice}} is due. Let me know if you need anything from our side.\n\nThanks,\nNauman" },
  { key: "enterprise", label: "Enterprise", icon: Building2,
    subject: "Welcome to HostFlow AI Enterprise",
    body: "Hi {{name}},\n\nWelcome aboard. Our enterprise onboarding team will reach out within 24 hours with your dedicated success manager.\n\nMy direct line is below — use it any time.\n\nNauman Sherwani\nFounder, HostFlow AI Technologies" },
];

const AI_MODES = [
  { id: "draft",      label: "Draft from intent",  icon: Wand2 },
  { id: "reply",      label: "Professional reply", icon: Sparkles },
  { id: "shorten",    label: "Shorten",            icon: Sparkles },
  { id: "persuasive", label: "More persuasive",    icon: Sparkles },
  { id: "grammar",    label: "Fix grammar",        icon: Sparkles },
  { id: "sales",      label: "Sales tone",         icon: Sparkles },
  { id: "founder",    label: "Founder tone",       icon: Sparkles },
  { id: "urgent",     label: "Urgent tone",        icon: Sparkles },
];

export interface ComposeInitial {
  to?: string; cc?: string; bcc?: string; subject?: string; body?: string;
  inReplyTo?: string; references?: string; replyContext?: string; fromIdentity?: SendIdentityId;
}

function parseRecipients(input: string): string[] {
  return input.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
}
function isEmail(s: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

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
  const [aiOpen, setAiOpen] = useState(true);
  const [sending, setSending] = useState(false);
  const [scheduleAt, setScheduleAt] = useState<string>("");
  const [scheduling, setScheduling] = useState(false);
  const [fromIdentity, setFromIdentity] = useState<SendIdentityId>(initial?.fromIdentity || "advisor");
  const [identityOpen, setIdentityOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const activeIdentity = SEND_IDENTITIES.find((i) => i.id === fromIdentity)!;

  const toChips = useMemo(() => parseRecipients(to), [to]);
  const wordCount = useMemo(() => body.trim() ? body.trim().split(/\s+/).length : 0, [body]);
  const charCount = body.length;

  if (!open) return null;

  const applyTemplate = (key: string) => {
    const t = TEMPLATES.find((x) => x.key === key);
    if (!t) return;
    setSubject(t.subject); setBody(t.body); setActiveTemplate(key);
  };

  const wrapSelection = (before: string, after = before) => {
    const ta = bodyRef.current; if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = body.slice(start, end);
    const next = body.slice(0, start) + before + (sel || "text") + after + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + (sel || "text").length);
    });
  };

  const insertAtLineStart = (prefix: string) => {
    const ta = bodyRef.current; if (!ta) return;
    const start = ta.selectionStart;
    const before = body.slice(0, start);
    const lineStart = before.lastIndexOf("\n") + 1;
    const next = body.slice(0, lineStart) + prefix + body.slice(lineStart);
    setBody(next);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(start + prefix.length, start + prefix.length); });
  };

  const mdToHtml = (s: string) => {
    const esc = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return esc
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[\s>])\*([^*\n]+)\*/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" style="color:#06B6D4">$1</a>')
      .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #475569;padding-left:12px;color:#475569;margin:8px 0">$1</blockquote>')
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>[\s\S]+?<\/li>)/g, "<ul style=\"padding-left:20px;margin:8px 0\">$1</ul>");
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

  const validateBeforeSend = () => {
    const recipients = toChips;
    if (recipients.length === 0) { toast.error("Add at least one recipient"); return false; }
    const bad = recipients.find((r) => !isEmail(r));
    if (bad) { toast.error(`Invalid email: ${bad}`); return false; }
    if (!subject.trim()) { toast.error("Subject is required"); return false; }
    if (!body.trim())    { toast.error("Body is required"); return false; }
    return true;
  };

  const handleSend = async () => {
    if (!validateBeforeSend()) return;
    setSending(true);
    try {
      const html = `<div style="font-family:Inter,-apple-system,Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.65;color:#0F172A;white-space:pre-wrap">${mdToHtml(body)}</div>`;
      await onSend({ to, cc: cc || undefined, bcc: bcc || undefined, subject, html, inReplyTo: initial?.inReplyTo, references: initial?.references, fromIdentity });
      toast.success("Email sent");
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  };

  const handleSchedule = async () => {
    if (!validateBeforeSend()) return;
    if (!scheduleAt) { toast.error("Pick a date & time"); return; }
    const when = new Date(scheduleAt);
    if (isNaN(when.getTime()) || when.getTime() < Date.now() + 30_000) {
      toast.error("Pick a time at least 1 minute in the future"); return;
    }
    setScheduling(true);
    try {
      const html = `<div style="font-family:Inter,-apple-system,Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.65;color:#0F172A;white-space:pre-wrap">${mdToHtml(body)}</div>`;
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
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full md:max-w-4xl max-h-[94vh] flex flex-col rounded-t-2xl md:rounded-2xl overflow-hidden border border-[var(--fos-border)] shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        style={{
          background: "linear-gradient(180deg, var(--fos-card) 0%, var(--fos-bg) 100%)",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px var(--fos-border)",
        }}
      >
        {/* accent gradient strip */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{
          background: `linear-gradient(90deg, transparent 0%, ${activeIdentity.color} 50%, transparent 100%)`,
        }} />

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--fos-border)]/70">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${activeIdentity.color}33, ${activeIdentity.color}10)`, border: `1px solid ${activeIdentity.color}44` }}>
                <Send className="w-3.5 h-3.5" style={{ color: activeIdentity.color }} />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[var(--fos-card)]" />
            </div>
            <div>
              <div className="text-[var(--fos-text)] text-[13px] font-semibold tracking-tight">New Message</div>
              <div className="text-[10px] text-[var(--fos-muted)] tracking-wide">{activeIdentity.label} · {activeIdentity.sub}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="hidden md:inline-flex items-center gap-1 text-[9px] text-[var(--fos-muted)] px-1.5 py-0.5 rounded border border-[var(--fos-border)] bg-[var(--fos-bg)]/50 font-mono">ESC</kbd>
            <button onClick={onClose} className="ml-1 w-7 h-7 rounded-lg flex items-center justify-center text-[var(--fos-muted)] hover:text-[var(--fos-text)] hover:bg-[var(--fos-bg)]/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* RECIPIENTS */}
          <div className="px-6 py-2.5 border-b border-[var(--fos-border)]/40 space-y-1.5">
            <div className="flex items-start gap-3">
              <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--fos-muted)] w-14 shrink-0 pt-2 font-semibold">To</span>
              <div className="flex-1 flex flex-wrap items-center gap-1.5 min-h-[32px]">
                {toChips.length > 1 && toChips.slice(0, -1).map((email, idx) => (
                  <span key={idx} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] ${
                    isEmail(email)
                      ? "bg-[var(--fos-accent)]/10 text-[var(--fos-accent)] border border-[var(--fos-accent)]/30"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/40"
                  }`}>
                    <span className="w-1 h-1 rounded-full bg-current" />
                    {email}
                  </span>
                ))}
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder={toChips.length === 0 ? "recipient@example.com" : ""}
                  className="flex-1 min-w-[180px] bg-transparent text-[13px] text-[var(--fos-text)] outline-none placeholder:text-[var(--fos-muted)]/40 py-1.5"
                />
              </div>
              <button onClick={() => setShowCc((v) => !v)} className="text-[10px] uppercase tracking-wider text-[var(--fos-muted)] hover:text-[var(--fos-accent)] pt-2 transition-colors">
                Cc·Bcc
              </button>
            </div>
            {showCc && (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--fos-muted)] w-14 shrink-0 font-semibold">Cc</span>
                  <input value={cc} onChange={(e) => setCc(e.target.value)} className="flex-1 bg-transparent text-[13px] text-[var(--fos-text)] outline-none placeholder:text-[var(--fos-muted)]/40 py-1.5" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--fos-muted)] w-14 shrink-0 font-semibold">Bcc</span>
                  <input value={bcc} onChange={(e) => setBcc(e.target.value)} className="flex-1 bg-transparent text-[13px] text-[var(--fos-text)] outline-none placeholder:text-[var(--fos-muted)]/40 py-1.5" />
                </div>
              </>
            )}
            <div className="flex items-center gap-3 border-t border-[var(--fos-border)]/40 pt-1.5">
              <Hash className="w-3 h-3 text-[var(--fos-muted)] shrink-0 ml-0.5" />
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="flex-1 bg-transparent text-[14px] text-[var(--fos-text)] font-medium outline-none placeholder:text-[var(--fos-muted)]/40 py-1.5"
              />
              {subject && <span className="text-[10px] text-[var(--fos-muted)] tabular-nums">{subject.length}</span>}
            </div>
          </div>

          {/* TEMPLATES STRIP */}
          <div className="px-6 py-2.5 border-b border-[var(--fos-border)]/40 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--fos-muted)] font-semibold shrink-0">Templates</span>
            <div className="w-px h-3 bg-[var(--fos-border)] shrink-0" />
            {TEMPLATES.map((t) => {
              const Icon = t.icon;
              const isActive = activeTemplate === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => applyTemplate(t.key)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-all ${
                    isActive
                      ? "bg-[var(--fos-accent)]/15 text-[var(--fos-accent)] border-[var(--fos-accent)]/50 shadow-[0_0_0_1px_rgba(6,182,212,0.2)]"
                      : "bg-[var(--fos-bg)]/60 text-[var(--fos-muted)] border-[var(--fos-border)] hover:text-[var(--fos-text)] hover:border-[var(--fos-accent)]/40"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* FORMATTING TOOLBAR */}
          <div className="px-6 py-1.5 border-b border-[var(--fos-border)]/40 flex items-center gap-0.5 bg-[var(--fos-bg)]/30">
            <button onClick={() => wrapSelection("**")}    title="Bold"        className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--fos-muted)] hover:text-[var(--fos-text)] hover:bg-[var(--fos-card)] transition-colors"><Bold className="w-3.5 h-3.5" /></button>
            <button onClick={() => wrapSelection("*")}     title="Italic"      className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--fos-muted)] hover:text-[var(--fos-text)] hover:bg-[var(--fos-card)] transition-colors"><Italic className="w-3.5 h-3.5" /></button>
            <button onClick={() => {
              const url = prompt("Link URL", "https://"); if (!url) return;
              wrapSelection("[", `](${url})`);
            }} title="Link" className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--fos-muted)] hover:text-[var(--fos-text)] hover:bg-[var(--fos-card)] transition-colors"><Link2 className="w-3.5 h-3.5" /></button>
            <div className="w-px h-4 bg-[var(--fos-border)] mx-1" />
            <button onClick={() => insertAtLineStart("- ")}  title="Bulleted list" className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--fos-muted)] hover:text-[var(--fos-text)] hover:bg-[var(--fos-card)] transition-colors"><List className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertAtLineStart("> ")}  title="Quote"         className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--fos-muted)] hover:text-[var(--fos-text)] hover:bg-[var(--fos-card)] transition-colors"><Quote className="w-3.5 h-3.5" /></button>
            <div className="w-px h-4 bg-[var(--fos-border)] mx-1" />
            <button title="Attachments coming soon" disabled className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--fos-muted)]/40 cursor-not-allowed"><Paperclip className="w-3.5 h-3.5" /></button>
            <div className="ml-auto flex items-center gap-3 text-[10px] text-[var(--fos-muted)] tabular-nums">
              <span className="flex items-center gap-1"><Type className="w-3 h-3" />{wordCount} words</span>
              <span>{charCount} chars</span>
            </div>
          </div>

          {/* BODY */}
          <div className="relative">
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => { setBody(e.target.value); setActiveTemplate(null); }}
              placeholder="Write your message…"
              rows={14}
              className="w-full bg-transparent text-[var(--fos-text)] text-[14px] leading-[1.65] outline-none px-6 py-5 resize-none placeholder:text-[var(--fos-muted)]/35"
              style={{ fontFamily: "Inter, -apple-system, Segoe UI, sans-serif" }}
            />
            {!body && (
              <div className="pointer-events-none absolute top-16 left-6 right-6 text-[11px] text-[var(--fos-muted)]/40">
                <div className="flex items-center gap-2">
                  <span className="opacity-60">Tip ·</span>
                  <span><kbd className="text-[10px] px-1 py-0.5 rounded bg-[var(--fos-card)] border border-[var(--fos-border)] font-mono">**bold**</kbd></span>
                  <span><kbd className="text-[10px] px-1 py-0.5 rounded bg-[var(--fos-card)] border border-[var(--fos-border)] font-mono">*italic*</kbd></span>
                  <span><kbd className="text-[10px] px-1 py-0.5 rounded bg-[var(--fos-card)] border border-[var(--fos-border)] font-mono">- list</kbd></span>
                  <span><kbd className="text-[10px] px-1 py-0.5 rounded bg-[var(--fos-card)] border border-[var(--fos-border)] font-mono">[link](url)</kbd></span>
                </div>
              </div>
            )}
          </div>

          {/* AI ASSISTANT */}
          <div className="border-t border-[var(--fos-border)]/60" style={{
            background: "linear-gradient(180deg, transparent 0%, rgba(6,182,212,0.04) 100%)",
          }}>
            <button
              onClick={() => setAiOpen((v) => !v)}
              className="w-full px-6 py-2.5 flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md flex items-center justify-center bg-gradient-to-br from-cyan-400/20 to-violet-500/20 border border-cyan-400/30">
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--fos-muted)] font-semibold group-hover:text-[var(--fos-text)] transition-colors">AI Email Assistant</span>
                <span className="text-[10px] text-[var(--fos-muted)]/60">· 8 modes</span>
              </div>
              {aiOpen ? <ChevronUp className="w-3.5 h-3.5 text-[var(--fos-muted)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--fos-muted)]" />}
            </button>
            {aiOpen && (
              <div className="px-6 pb-3 flex flex-wrap gap-1.5">
                {AI_MODES.map((m) => {
                  const busy = aiBusy === m.id;
                  return (
                    <button
                      key={m.id}
                      disabled={aiBusy !== null}
                      onClick={() => runAI(m.id)}
                      className="px-2.5 py-1 rounded-lg text-[11px] bg-[var(--fos-card)]/80 text-[var(--fos-text)] hover:bg-[var(--fos-card)] hover:border-cyan-400/50 border border-[var(--fos-border)] disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5 transition-all"
                    >
                      {busy ? <Loader2 className="w-3 h-3 animate-spin text-cyan-300" /> : <m.icon className="w-3 h-3 text-cyan-300" />}
                      {m.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-[var(--fos-border)] flex items-center justify-between gap-3"
          style={{ background: "linear-gradient(180deg, var(--fos-card) 0%, var(--fos-bg) 100%)" }}>
          {/* From identity card */}
          <div className="relative">
            <button
              onClick={() => setIdentityOpen((v) => !v)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg bg-[var(--fos-bg)]/70 border border-[var(--fos-border)] hover:border-[var(--fos-accent)]/50 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold tracking-tight"
                style={{
                  background: `linear-gradient(135deg, ${activeIdentity.color}40, ${activeIdentity.color}15)`,
                  border: `1px solid ${activeIdentity.color}55`,
                  color: activeIdentity.color,
                }}>
                {activeIdentity.label.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-[11px] font-semibold text-[var(--fos-text)] leading-tight">{activeIdentity.label}</div>
                <div className="text-[9px] text-[var(--fos-muted)] leading-tight">{activeIdentity.address}</div>
              </div>
              <ChevronDown className={`w-3 h-3 text-[var(--fos-muted)] group-hover:text-[var(--fos-text)] transition-transform ${identityOpen ? "rotate-180" : ""}`} />
            </button>
            {identityOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-72 rounded-xl border border-[var(--fos-border)] bg-[var(--fos-card)] shadow-2xl overflow-hidden z-10 animate-in fade-in slide-in-from-bottom-1 duration-150">
                <div className="px-3 py-2 text-[9px] uppercase tracking-[0.18em] text-[var(--fos-muted)] font-semibold border-b border-[var(--fos-border)]/60">Send as</div>
                {SEND_IDENTITIES.map((i) => {
                  const isActive = i.id === fromIdentity;
                  return (
                    <button
                      key={i.id}
                      onClick={() => { setFromIdentity(i.id); setIdentityOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--fos-bg)]/60 transition-colors ${isActive ? "bg-[var(--fos-bg)]/40" : ""}`}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: `linear-gradient(135deg, ${i.color}40, ${i.color}15)`, border: `1px solid ${i.color}55`, color: i.color }}>
                        {i.label.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-[var(--fos-text)] truncate">{i.label}</div>
                        <div className="text-[10px] text-[var(--fos-muted)] truncate">{i.sub} · {i.address}</div>
                      </div>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--fos-bg)]/70 border border-[var(--fos-border)] hover:border-[var(--fos-accent)]/40 transition-colors">
              <Clock className="w-3 h-3 text-[var(--fos-muted)]" />
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="bg-transparent text-[11px] text-[var(--fos-text)] outline-none w-[150px]"
              />
              <button
                onClick={handleSchedule}
                disabled={scheduling || !scheduleAt}
                className="text-[11px] text-[var(--fos-accent)] font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
              >
                {scheduling ? <Loader2 className="w-3 h-3 animate-spin" /> : "Schedule"}
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={sending}
              className="relative px-5 py-2 rounded-lg font-semibold text-[12px] flex items-center gap-2 text-[#0B1120] shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-wait transition-all hover:shadow-cyan-500/40 active:scale-[0.98] overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)",
              }}
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {sending ? "Sending…" : "Send"}
              <kbd className="hidden md:inline-flex items-center text-[9px] px-1 py-0.5 rounded bg-black/15 font-mono ml-1">⌘↵</kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
