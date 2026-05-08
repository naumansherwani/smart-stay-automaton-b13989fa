import { useMemo, useState } from "react";
import { Inbox, Mail, MailOpen, Pencil, RefreshCw, Send, Sparkles, X, AlertTriangle } from "lucide-react";
import { useAgentInbox } from "@/hooks/useAgentInbox";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Advisor = {
  id: string;
  label: string;
  emoji: string;
  email: string | null; // null = All
  fromName: string;
};

const ADVISORS: Advisor[] = [
  { id: "all", label: "All Inboxes", emoji: "📧", email: null, fromName: "HostFlow ConnectAI" },
  { id: "aria", label: "Aria (Hospitality)", emoji: "🏨", email: "aria@hostflowai.net", fromName: "Aria | HostFlow AI" },
  { id: "orion", label: "Orion (Airlines)", emoji: "✈️", email: "orion@hostflowai.net", fromName: "Orion | HostFlow AI" },
  { id: "rex", label: "Rex (Car Rental)", emoji: "🚗", email: "rex@hostflowai.net", fromName: "Rex | HostFlow AI" },
  { id: "lyra", label: "Lyra (Healthcare)", emoji: "🏥", email: "lyra@hostflowai.net", fromName: "Lyra | HostFlow AI" },
  { id: "sage", label: "Sage (Education)", emoji: "📚", email: "sage@hostflowai.net", fromName: "Sage | HostFlow AI" },
  { id: "atlas", label: "Atlas (Logistics)", emoji: "🚚", email: "atlas@hostflowai.net", fromName: "Atlas | HostFlow AI" },
  { id: "vega", label: "Vega (Events)", emoji: "🎭", email: "vega@hostflowai.net", fromName: "Vega | HostFlow AI" },
  { id: "kai", label: "Kai (Railways)", emoji: "🚂", email: "kai@hostflowai.net", fromName: "Kai | HostFlow AI" },
  { id: "sherlock", label: "Sherlock (Owner)", emoji: "🔍", email: "sherlock@hostflowai.net", fromName: "Sherlock | HostFlow AI" },
];

const FROM_IDENTITIES = [
  { id: "advisor", email: "connectai@hostflowai.net", name: "HostFlow ConnectAI" },
  { id: "aria", email: "aria@hostflowai.net", name: "Aria | HostFlow AI" },
  { id: "orion", email: "orion@hostflowai.net", name: "Orion | HostFlow AI" },
  { id: "rex", email: "rex@hostflowai.net", name: "Rex | HostFlow AI" },
  { id: "lyra", email: "lyra@hostflowai.net", name: "Lyra | HostFlow AI" },
  { id: "sage", email: "sage@hostflowai.net", name: "Sage | HostFlow AI" },
  { id: "atlas", email: "atlas@hostflowai.net", name: "Atlas | HostFlow AI" },
  { id: "vega", email: "vega@hostflowai.net", name: "Vega | HostFlow AI" },
  { id: "kai", email: "kai@hostflowai.net", name: "Kai | HostFlow AI" },
  { id: "sherlock", email: "sherlock@hostflowai.net", name: "Sherlock | HostFlow AI" },
  { id: "founder", email: "naumansherwani@hostflowai.net", name: "Nauman Sherwani" },
];

function timeAgo(iso: string) {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function AIAgentsEmailCenter() {
  const [activeTabId, setActiveTabId] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composePrefill, setComposePrefill] = useState<{ to?: string; subject?: string; identityId?: string } | null>(null);

  const activeTab = ADVISORS.find((a) => a.id === activeTabId)!;
  const { emails, loading, error, refresh, markRead, sendEmail } = useAgentInbox(activeTab.email || undefined);

  const selected = useMemo(() => emails.find((e) => e.id === selectedId) || null, [emails, selectedId]);

  const advisorBadge = (toAddress: string) => {
    const a = ADVISORS.find((x) => x.email && x.email.toLowerCase() === toAddress?.toLowerCase());
    return a ? `${a.emoji} ${a.label.split(" ")[0]}` : "📧";
  };

  const openReply = (e: typeof emails[number]) => {
    const matched = ADVISORS.find((a) => a.email?.toLowerCase() === e.toAddress?.toLowerCase());
    setComposePrefill({
      to: e.fromEmail,
      subject: e.subject?.startsWith("Re:") ? e.subject : `Re: ${e.subject}`,
      identityId: matched?.id || "advisor",
    });
    setComposeOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="founder-card p-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[var(--fos-text)] text-xl font-semibold tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--fos-accent)]" /> AI Agents Email Center
            </h2>
            <p className="text-[var(--fos-muted)] text-xs mt-1">
              Live inbox for all 9 AI advisors · Realtime SSE stream · Backend: Replit
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void refresh()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--fos-border)] bg-[var(--fos-bg)] text-[var(--fos-text)] text-xs font-semibold hover:border-[var(--fos-accent)]/40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button
              onClick={() => { setComposePrefill({ identityId: activeTabId === "all" ? "advisor" : activeTabId }); setComposeOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--fos-accent)] text-[#0B1120] text-xs font-semibold hover:opacity-90"
            >
              <Pencil className="w-3.5 h-3.5" /> New Email
            </button>
          </div>
        </div>

        <div className="founder-card overflow-hidden grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_380px_minmax(0,1fr)] min-h-[640px]">
          {/* LEFT: advisor tabs */}
          <div className="border-b md:border-b-0 md:border-r border-[var(--fos-border)] bg-[var(--fos-bg)]/50 p-3 space-y-1 overflow-x-auto md:overflow-x-visible">
            <div className="flex md:block gap-1 md:gap-0 md:space-y-1">
              {ADVISORS.map((a) => {
                const isActive = a.id === activeTabId;
                return (
                  <button
                    key={a.id}
                    onClick={() => { setActiveTabId(a.id); setSelectedId(null); }}
                    className={`shrink-0 md:w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                      isActive
                        ? "bg-[var(--fos-accent)]/15 text-[var(--fos-accent)]"
                        : "text-[var(--fos-muted)] hover:text-[var(--fos-text)] hover:bg-[var(--fos-card)]"
                    }`}
                  >
                    <span className="text-base leading-none">{a.emoji}</span>
                    <span className="truncate">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CENTER: list */}
          <div className="border-b xl:border-b-0 xl:border-r border-[var(--fos-border)] bg-[var(--fos-bg)]/30">
            <div className="px-5 py-4 border-b border-[var(--fos-border)] flex items-center justify-between">
              <div>
                <div className="text-[var(--fos-text)] text-sm font-semibold">{activeTab.label}</div>
                <div className="text-[var(--fos-muted)] text-[11px]">
                  {emails.length} message{emails.length === 1 ? "" : "s"} · {emails.filter((m) => !m.isRead).length} unread
                </div>
              </div>
              {loading && <RefreshCw className="w-4 h-4 text-[var(--fos-muted)] animate-spin" />}
            </div>

            <div className="max-h-[560px] overflow-y-auto divide-y divide-[var(--fos-border)]/60">
              {error && (
                <div className="p-4 text-center">
                  <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <div className="text-[var(--fos-text)] text-xs">Could not load inbox — retrying…</div>
                  <button
                    onClick={() => void refresh()}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-[var(--fos-accent)]/10 text-[var(--fos-accent)] text-[11px] font-semibold"
                  >
                    Retry now
                  </button>
                </div>
              )}
              {loading && emails.length === 0 && !error && (
                <div className="p-3 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-lg bg-[var(--fos-card)]/60 animate-pulse" />
                  ))}
                </div>
              )}
              {!loading && !error && emails.length === 0 && (
                <div className="p-8 text-center">
                  <MailOpen className="w-8 h-8 text-[var(--fos-muted)] mx-auto mb-3" />
                  <div className="text-[var(--fos-text)] text-sm font-medium">No emails yet</div>
                  <p className="text-[var(--fos-muted)] text-xs mt-1">Inbox is ready for incoming messages.</p>
                </div>
              )}
              {emails.map((m) => {
                const active = selected?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedId(m.id); if (!m.isRead) void markRead(m.id); }}
                    className={`w-full text-left px-5 py-4 transition-colors ${active ? "bg-[var(--fos-accent)]/10" : "hover:bg-[var(--fos-card)]/60"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!m.isRead ? "bg-[var(--fos-accent)]" : "bg-transparent border border-[var(--fos-border)]"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[var(--fos-text)] text-sm font-semibold truncate">{m.fromName || m.fromEmail}</div>
                          <div className="text-[10px] text-[var(--fos-muted)] shrink-0">{timeAgo(m.receivedAt)}</div>
                        </div>
                        <div className="text-[12px] text-[var(--fos-text)] mt-0.5 truncate">{m.subject}</div>
                        <div className="text-[11px] text-[var(--fos-muted)] mt-1 line-clamp-2">
                          {(m.body || m.preview || "").slice(0, 100)}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--fos-accent)]/10 text-[var(--fos-accent)]">
                            {advisorBadge(m.toAddress)}
                          </span>
                          <span className="text-[10px] text-[var(--fos-muted)] truncate">{m.fromEmail}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: detail */}
          <div className="p-6 xl:p-8 hidden xl:block">
            {selected ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-[var(--fos-text)] text-xl font-semibold tracking-tight break-words">{selected.subject}</h3>
                    <div className="mt-2 space-y-1 text-[12px] text-[var(--fos-muted)]">
                      <div>From: <span className="text-[var(--fos-text)]">{selected.fromName} &lt;{selected.fromEmail}&gt;</span></div>
                      <div>To: <span className="text-[var(--fos-text)]">{selected.toAddress}</span> · <span className="text-[var(--fos-accent)]">{selected.advisorName}</span></div>
                      <div>{new Date(selected.receivedAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!selected.isRead && (
                      <button
                        onClick={() => void markRead(selected.id)}
                        className="px-3 py-2 rounded-lg border border-[var(--fos-border)] text-[var(--fos-text)] text-xs font-semibold hover:border-[var(--fos-accent)]/40"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => openReply(selected)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--fos-accent)] text-[#0B1120] text-xs font-semibold hover:opacity-90"
                    >
                      <Send className="w-3.5 h-3.5" /> Reply
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--fos-border)] bg-[var(--fos-bg)]/50 p-5">
                  <div className="text-[var(--fos-text)] text-sm whitespace-pre-wrap break-words">{selected.body || selected.preview}</div>
                </div>

                {selected.aiReply && (
                  <div className="rounded-xl border border-[var(--fos-accent)]/40 bg-[var(--fos-accent)]/5 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-[var(--fos-accent)]" />
                      <span className="text-[var(--fos-accent)] text-xs font-bold uppercase tracking-wider">AI Response Sent</span>
                    </div>
                    <div className="text-[var(--fos-text)] text-sm whitespace-pre-wrap break-words">{selected.aiReply}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[300px] grid place-items-center text-center">
                <div>
                  <Inbox className="w-10 h-10 text-[var(--fos-muted)] mx-auto mb-3" />
                  <div className="text-[var(--fos-text)] text-base font-semibold">Select an email</div>
                  <p className="text-[var(--fos-muted)] text-sm mt-1">Pick a message from the list to read it here.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal detail view (shown on screens < xl, where the right pane is hidden) */}
        <Dialog
          open={!!selected}
          onOpenChange={(o) => { if (!o) setSelectedId(null); }}
        >
          <DialogContent className="xl:hidden max-w-2xl bg-[var(--fos-card)] border-[var(--fos-border)] text-[var(--fos-text)]">
            {selected && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-[var(--fos-text)] text-lg font-semibold tracking-tight break-words pr-6">{selected.subject}</h3>
                  <div className="mt-2 space-y-0.5 text-[11px] text-[var(--fos-muted)]">
                    <div>From: <span className="text-[var(--fos-text)]">{selected.fromName} &lt;{selected.fromEmail}&gt;</span></div>
                    <div>To: <span className="text-[var(--fos-text)]">{selected.toAddress}</span> · <span className="text-[var(--fos-accent)]">{selected.advisorName}</span></div>
                    <div>{new Date(selected.receivedAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--fos-border)] bg-[var(--fos-bg)]/50 p-4 max-h-[50vh] overflow-y-auto">
                  <div className="text-[var(--fos-text)] text-sm whitespace-pre-wrap break-words">
                    {selected.body || selected.preview}
                  </div>
                </div>
                {selected.aiReply && (
                  <div className="rounded-lg border border-[var(--fos-accent)]/40 bg-[var(--fos-accent)]/5 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--fos-accent)]" />
                      <span className="text-[var(--fos-accent)] text-[10px] font-bold uppercase tracking-wider">AI Response Sent</span>
                    </div>
                    <div className="text-[var(--fos-text)] text-xs whitespace-pre-wrap break-words">{selected.aiReply}</div>
                  </div>
                )}
                <div className="flex items-center justify-end gap-2">
                  {!selected.isRead && (
                    <button
                      onClick={() => void markRead(selected.id)}
                      className="px-3 py-2 rounded-lg border border-[var(--fos-border)] text-[var(--fos-text)] text-xs font-semibold hover:border-[var(--fos-accent)]/40"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => openReply(selected)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--fos-accent)] text-[#0B1120] text-xs font-semibold hover:opacity-90"
                  >
                    <Send className="w-3.5 h-3.5" /> Reply
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <ComposeAgentEmailModal
        open={composeOpen}
        onClose={() => { setComposeOpen(false); setComposePrefill(null); }}
        prefill={composePrefill}
        onSend={async (payload) => {
          await sendEmail(payload);
          toast.success("Email sent");
          setComposeOpen(false);
          setComposePrefill(null);
        }}
      />
    </>
  );
}

function ComposeAgentEmailModal({
  open,
  onClose,
  prefill,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  prefill: { to?: string; subject?: string; identityId?: string } | null;
  onSend: (p: { to: string; subject: string; text: string; from_name: string; from_email: string }) => Promise<void>;
}) {
  const [identityId, setIdentityId] = useState(prefill?.identityId || "advisor");
  const [to, setTo] = useState(prefill?.to || "");
  const [subject, setSubject] = useState(prefill?.subject || "");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // sync prefill when reopened
  useMemo(() => {
    if (open) {
      setIdentityId(prefill?.identityId || "advisor");
      setTo(prefill?.to || "");
      setSubject(prefill?.subject || "");
      setText("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const identity = FROM_IDENTITIES.find((i) => i.id === identityId) || FROM_IDENTITIES[0];

  const submit = async () => {
    if (!to || !subject || !text) {
      toast.error("To, subject and body are required");
      return;
    }
    setSending(true);
    try {
      await onSend({
        to,
        subject,
        text,
        from_name: identity.name,
        from_email: identity.email,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--fos-border)] bg-[var(--fos-card)] shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[var(--fos-border)]">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[var(--fos-accent)]" />
            <h3 className="text-[var(--fos-text)] text-sm font-semibold">New Email</h3>
          </div>
          <button onClick={onClose} className="text-[var(--fos-muted)] hover:text-[var(--fos-text)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[var(--fos-muted)] mb-1">From</label>
            <select
              value={identityId}
              onChange={(e) => setIdentityId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--fos-border)] bg-[var(--fos-bg)] text-[var(--fos-text)] text-sm"
            >
              {FROM_IDENTITIES.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} &lt;{i.email}&gt;
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[var(--fos-muted)] mb-1">To</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 rounded-lg border border-[var(--fos-border)] bg-[var(--fos-bg)] text-[var(--fos-text)] text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[var(--fos-muted)] mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full px-3 py-2 rounded-lg border border-[var(--fos-border)] bg-[var(--fos-bg)] text-[var(--fos-text)] text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[var(--fos-muted)] mb-1">Body</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="Write your message…"
              className="w-full px-3 py-2 rounded-lg border border-[var(--fos-border)] bg-[var(--fos-bg)] text-[var(--fos-text)] text-sm font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-[var(--fos-border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--fos-border)] text-[var(--fos-text)] text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={sending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--fos-accent)] text-[#0B1120] text-xs font-semibold hover:opacity-90 disabled:opacity-60"
          >
            <Send className="w-3.5 h-3.5" /> {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}