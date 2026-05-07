import { useMemo, useState } from "react";
import { Send as SendIcon, Pencil, Sparkles, Inbox, AlertTriangle, Clock3, ChevronRight, RefreshCw, MailOpen } from "lucide-react";
import { useOwnerMailbox } from "@/hooks/useOwnerMailbox";
import ComposeModal, { ComposeInitial } from "@/components/founder/email/ComposeModal";

export default function Emails() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeInitial, setComposeInitial] = useState<ComposeInitial | undefined>();
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const mb = useOwnerMailbox("inbox", "");
  const selectedMail = useMemo(() => mb.messages.find((msg) => msg.uid === selectedUid) || mb.messages[0] || null, [mb.messages, selectedUid]);

  const openCompose = (init?: ComposeInitial) => { setComposeInitial(init); setComposeOpen(true); };

  return (
    <>
      <div className="space-y-6">
        <div className="founder-card p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[var(--fos-text)] text-xl font-semibold tracking-tight flex items-center gap-2">
              <Inbox className="w-5 h-5 text-[var(--fos-accent)]" /> Founder Inbox
            </h2>
            <p className="text-[var(--fos-muted)] text-xs mt-1">
              Full in-app mailbox restored · Outbound mail still sends from <span className="text-[var(--fos-text)] font-medium">noreply@hostflowai.net</span>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void mb.refresh()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--fos-border)] bg-[var(--fos-bg)] text-[var(--fos-text)] text-xs font-semibold hover:border-[var(--fos-accent)]/40"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={() => openCompose()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--fos-accent)] text-[#0B1120] text-xs font-semibold hover:opacity-90"
            >
              <Pencil className="w-3.5 h-3.5" /> New Email
            </button>
          </div>
        </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => openCompose({ fromIdentity: "advisor" })}
            className="text-left p-5 rounded-xl border border-[var(--fos-border)] bg-[var(--fos-bg)] hover:border-[var(--fos-accent)]/50 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" style={{ color: "#06B6D4" }} />
              <span className="text-[var(--fos-text)] text-sm font-semibold">AI Advisor</span>
            </div>
            <p className="text-[var(--fos-muted)] text-[11px] leading-relaxed">
              Compose as <span className="text-[var(--fos-text)]">HostFlow ConnectAI</span> with the auto-appended advisor signature.
            </p>
          </button>
          <button
            onClick={() => openCompose({ fromIdentity: "support" })}
            className="text-left p-5 rounded-xl border border-[var(--fos-border)] bg-[var(--fos-bg)] hover:border-[var(--fos-accent)]/50 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <SendIcon className="w-4 h-4" style={{ color: "#10B981" }} />
              <span className="text-[var(--fos-text)] text-sm font-semibold">Support</span>
            </div>
            <p className="text-[var(--fos-muted)] text-[11px] leading-relaxed">
              Customer Support persona for resolving customer issues.
            </p>
          </button>
          <button
            onClick={() => openCompose({ fromIdentity: "general" })}
            className="text-left p-5 rounded-xl border border-[var(--fos-border)] bg-[var(--fos-bg)] hover:border-[var(--fos-accent)]/50 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <Pencil className="w-4 h-4" style={{ color: "#8B5CF6" }} />
              <span className="text-[var(--fos-text)] text-sm font-semibold">Founder</span>
            </div>
            <p className="text-[var(--fos-muted)] text-[11px] leading-relaxed">
              Send personally as Nauman Sherwani · Founder, HostFlow AI.
            </p>
          </button>
        </div>

        <div className="founder-card overflow-hidden min-h-[640px] grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="border-r border-[var(--fos-border)] bg-[var(--fos-bg)]/50">
            <div className="px-5 py-4 border-b border-[var(--fos-border)] flex items-center justify-between">
              <div>
                <div className="text-[var(--fos-text)] text-sm font-semibold">Inbox</div>
                <div className="text-[var(--fos-muted)] text-[11px]">{mb.counts.inbox?.total || 0} messages · {mb.counts.inbox?.unread || 0} attention needed</div>
              </div>
              {mb.loading && <Clock3 className="w-4 h-4 text-[var(--fos-muted)] animate-pulse" />}
            </div>

            <div className="max-h-[560px] overflow-y-auto divide-y divide-[var(--fos-border)]/60">
              {mb.messages.length === 0 ? (
                <div className="p-6 text-center">
                  <MailOpen className="w-8 h-8 text-[var(--fos-muted)] mx-auto mb-3" />
                  <div className="text-[var(--fos-text)] text-sm font-medium">No messages yet</div>
                  <p className="text-[var(--fos-muted)] text-xs mt-1">Sent founder emails and delivery activity will appear here automatically.</p>
                </div>
              ) : mb.messages.map((msg) => {
                const active = selectedMail?.uid === msg.uid;
                return (
                  <button
                    key={msg.uid}
                    onClick={() => setSelectedUid(msg.uid)}
                    className={`w-full text-left px-5 py-4 transition-colors ${active ? "bg-[var(--fos-accent)]/10" : "hover:bg-[var(--fos-card)]/60"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full ${msg.unread ? "bg-[var(--fos-accent)]" : "bg-[var(--fos-border)]"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[var(--fos-text)] text-sm font-semibold truncate">{msg.subject}</div>
                          <div className="text-[10px] text-[var(--fos-muted)] shrink-0">{new Date(msg.date).toLocaleString()}</div>
                        </div>
                        <div className="text-[11px] text-[var(--fos-muted)] mt-1 truncate">To: {msg.to[0]?.address}</div>
                        <div className="text-[11px] text-[var(--fos-muted)] mt-1 line-clamp-2">{msg.preview}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 xl:p-8">
            {selectedMail ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[var(--fos-text)] text-xl font-semibold tracking-tight">{selectedMail.subject}</h3>
                    <div className="mt-2 space-y-1 text-[12px] text-[var(--fos-muted)]">
                      <div>From: <span className="text-[var(--fos-text)]">{selectedMail.from.name} &lt;{selectedMail.from.address}&gt;</span></div>
                      <div>To: <span className="text-[var(--fos-text)]">{selectedMail.to.map((entry) => entry.address).join(", ")}</span></div>
                      <div>{new Date(selectedMail.date).toLocaleString()}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => openCompose({ to: selectedMail.to[0]?.address, subject: `Re: ${selectedMail.subject}`, fromIdentity: selectedMail.identity || "general" })}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--fos-accent)] text-[#0B1120] text-xs font-semibold hover:opacity-90"
                  >
                    <ChevronRight className="w-3.5 h-3.5" /> Reply
                  </button>
                </div>

                <div className="rounded-xl border border-[var(--fos-border)] bg-[var(--fos-bg)]/50 p-5">
                  <div className="text-[var(--fos-text)] text-sm font-medium whitespace-pre-wrap break-words">{selectedMail.preview}</div>
                </div>

                {selectedMail.unread && (
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--fos-border)] bg-[var(--fos-bg)] text-[11px] text-[var(--fos-muted)]">
                    <AlertTriangle className="w-3.5 h-3.5 text-[var(--fos-accent)]" /> This thread needs attention.
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[300px] grid place-items-center text-center">
                <div>
                  <Inbox className="w-10 h-10 text-[var(--fos-muted)] mx-auto mb-3" />
                  <div className="text-[var(--fos-text)] text-base font-semibold">Inbox restored</div>
                  <p className="text-[var(--fos-muted)] text-sm mt-1">Select a message from the left to inspect it here.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {mb.error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {mb.error}
          </div>
        )}
      </div>

      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSend={mb.send}
        initial={composeInitial}
      />
    </>
  );
}