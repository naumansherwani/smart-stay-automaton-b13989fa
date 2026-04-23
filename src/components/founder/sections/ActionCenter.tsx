import { useState } from "react";
import { Send, RefreshCw, RotateCcw, Plus, CalendarPlus, MessageSquarePlus, StickyNote, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type ActionId = "invoice" | "retry" | "refund_review" | "task" | "demo" | "follow_up" | "note";

const ACTIONS: { id: ActionId; label: string; icon: any; description: string }[] = [
  { id: "invoice", label: "Send Invoice", icon: Send, description: "Email a GBP invoice link to a customer." },
  { id: "retry", label: "Retry Payment", icon: RotateCcw, description: "Re-attempt a failed subscription charge." },
  { id: "refund_review", label: "Refund Review", icon: RefreshCw, description: "Open a refund request for review and approval." },
  { id: "task", label: "Create Task", icon: Plus, description: "Add a personal founder task to today's queue." },
  { id: "demo", label: "Book Demo", icon: CalendarPlus, description: "Schedule an enterprise demo and notify the lead." },
  { id: "follow_up", label: "Send Follow-up", icon: MessageSquarePlus, description: "Templated follow-up email to a lead or customer." },
  { id: "note", label: "Add Note", icon: StickyNote, description: "Drop a private founder note tied to context." },
];

export default function ActionCenter() {
  const [open, setOpen] = useState<ActionId | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<ActionId | null>(null);
  const [text, setText] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handle = async () => {
    if (!open) return;
    setBusy(true);
    try {
      if (open === "task" || open === "note") {
        const stash = JSON.parse(localStorage.getItem(`fos-${open}s`) || "[]");
        stash.unshift({ id: Date.now(), text, createdAt: new Date().toISOString() });
        localStorage.setItem(`fos-${open}s`, JSON.stringify(stash.slice(0, 100)));
      } else if (open === "refund_review") {
        await supabase.from("admin_alerts").insert({
          alert_type: "refund_review_requested", severity: "medium",
          title: "Refund review requested",
          message: `Founder requested refund review for ${email || "—"}: ${text}`,
        } as any);
      } else {
        // invoice / retry / demo / follow_up — log as admin alert for now (real billing integration is separate phase)
        await supabase.from("admin_alerts").insert({
          alert_type: `founder_action_${open}`, severity: "low",
          title: `Founder action · ${open}`,
          message: `${email ? "Target: " + email + "\n" : ""}${text}`,
        } as any);
      }
      setDone(open);
      toast({ title: "Action queued", description: ACTIONS.find((a) => a.id === open)?.label + " logged successfully." });
      setTimeout(() => { setOpen(null); setDone(null); setText(""); setEmail(""); }, 1200);
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const needsEmail = open && ["invoice", "retry", "refund_review", "demo", "follow_up"].includes(open);

  return (
    <div className="space-y-6">
      <div className="founder-card p-5">
        <h3 className="text-[var(--fos-text)] font-semibold text-sm">Quick Actions</h3>
        <p className="text-[var(--fos-muted)] text-xs mt-1">One-click founder operations. Each click opens a focused dialog.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <button key={a.id} onClick={() => setOpen(a.id)} className="founder-card p-5 text-left hover:border-[var(--fos-accent)]/40 hover:bg-[var(--fos-card)] transition group">
              <div className="w-10 h-10 rounded-lg bg-[var(--fos-accent)]/10 text-[var(--fos-accent)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-[var(--fos-text)] font-semibold text-sm">{a.label}</div>
              <div className="text-[var(--fos-muted)] text-xs mt-1 leading-relaxed">{a.description}</div>
            </button>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => !busy && setOpen(null)}>
          <div className="founder-card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-[var(--fos-text)] font-semibold text-sm mb-1">{ACTIONS.find((a) => a.id === open)?.label}</h4>
            <p className="text-[var(--fos-muted)] text-xs mb-4">{ACTIONS.find((a) => a.id === open)?.description}</p>
            {needsEmail && (
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Customer / lead email" className="w-full mb-3 bg-[var(--fos-bg)] border border-[var(--fos-border)] rounded-lg px-3 py-2 text-sm text-[var(--fos-text)] focus:outline-none focus:border-[var(--fos-accent)]/50" />
            )}
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Details / context" className="w-full bg-[var(--fos-bg)] border border-[var(--fos-border)] rounded-lg px-3 py-2 text-sm text-[var(--fos-text)] focus:outline-none focus:border-[var(--fos-accent)]/50" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setOpen(null)} disabled={busy} className="px-3 py-2 rounded-lg text-xs text-[var(--fos-muted)] hover:text-[var(--fos-text)]">Cancel</button>
              <button onClick={handle} disabled={busy || !text.trim()} className="px-4 py-2 rounded-lg bg-[var(--fos-accent)] text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5">
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {done === open ? <><CheckCircle2 className="w-3.5 h-3.5" /> Done</> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}