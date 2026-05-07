import { useState } from "react";
import { Send as SendIcon, Pencil, Sparkles } from "lucide-react";
import { useOwnerMailbox } from "@/hooks/useOwnerMailbox";
import ComposeModal, { ComposeInitial } from "@/components/founder/email/ComposeModal";

export default function Emails() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeInitial, setComposeInitial] = useState<ComposeInitial | undefined>();
  const mb = useOwnerMailbox("inbox", "");

  const openCompose = (init?: ComposeInitial) => { setComposeInitial(init); setComposeOpen(true); };

  return (
    <>
      <div className="founder-card p-8 min-h-[calc(100vh-200px)] flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[var(--fos-text)] text-xl font-semibold tracking-tight flex items-center gap-2">
              <SendIcon className="w-5 h-5 text-[var(--fos-accent)]" /> Compose &amp; Send
            </h2>
            <p className="text-[var(--fos-muted)] text-xs mt-1">
              Outbound email via Resend · From <span className="text-[var(--fos-text)] font-medium">noreply@hostflowai.net</span> · Replies route to your founder mailbox.
            </p>
          </div>
          <button
            onClick={() => openCompose()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--fos-accent)] text-[#0B1120] text-xs font-semibold hover:opacity-90"
          >
            <Pencil className="w-3.5 h-3.5" /> New Email
          </button>
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

        <div className="mt-8 p-5 rounded-xl border border-[var(--fos-border)] bg-[var(--fos-bg)]/50">
          <h3 className="text-[var(--fos-text)] text-sm font-semibold mb-2">Inbox &amp; Replies</h3>
          <p className="text-[var(--fos-muted)] text-[12px] leading-relaxed">
            Resend is a send-only service — there is no in-app inbox. All replies to outgoing email go to{" "}
            <span className="text-[var(--fos-text)] font-medium">naumansherwani@hostflowai.net</span> via the Reply-To header.
            Read &amp; reply directly from your existing mail client.
          </p>
        </div>

        {mb.error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
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