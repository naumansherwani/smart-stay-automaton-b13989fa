import { useState } from "react";
import { useFounderTheme } from "../FounderTheme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function Settings() {
  const { mode, toggle } = useFounderTheme();
  const [testEmail, setTestEmail] = useState("naumansherwani@hostflowai.live");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const sendTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("zoho-smtp-send", {
        body: { action: "test", to: testEmail },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || "SMTP send failed");
      setResult({ ok: true, msg: `✓ Test email sent to ${testEmail} (id: ${data.messageId || "n/a"})` });
      toast.success("Test email sent successfully");
    } catch (e: any) {
      const msg = e?.message || String(e);
      setResult({ ok: false, msg });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="founder-card p-6">
        <h3 className="text-[var(--fos-text)] font-semibold text-sm mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[var(--fos-text)] text-sm font-medium">Theme</div>
            <div className="text-[var(--fos-muted)] text-xs">{mode === "dark" ? "Dark mode (default)" : "Light mode"}</div>
          </div>
          <button onClick={toggle} className="px-4 py-2 rounded-lg bg-[var(--fos-accent)] text-white text-xs font-semibold">Switch to {mode === "dark" ? "Light" : "Dark"}</button>
        </div>
      </div>
      <div className="founder-card p-6">
        <h3 className="text-[var(--fos-text)] font-semibold text-sm mb-2">Currency</h3>
        <p className="text-[var(--fos-muted)] text-xs">Base currency: <span className="text-[var(--fos-text)] font-semibold">GBP (£)</span> · multi-currency display via the public site switcher.</p>
      </div>

      <div className="founder-card p-6">
        <h3 className="text-[var(--fos-text)] font-semibold text-sm mb-1 flex items-center gap-2">
          <Mail className="w-4 h-4 text-[var(--fos-accent)]" /> Email System (Zoho SMTP)
        </h3>
        <p className="text-[var(--fos-muted)] text-xs mb-4">
          smtp.zoho.com:587 · STARTTLS · From: <span className="text-[var(--fos-text)] font-semibold">naumansherwani@hostflowai.live</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="recipient@example.com"
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--fos-bg)] border border-[var(--fos-border)] text-[var(--fos-text)] text-sm"
          />
          <button
            onClick={sendTest}
            disabled={testing || !testEmail}
            className="px-4 py-2 rounded-lg bg-[var(--fos-accent)] text-white text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-2 justify-center"
          >
            {testing ? <><Loader2 className="w-3 h-3 animate-spin" /> Sending…</> : "Send Test Email"}
          </button>
        </div>
        {result && (
          <div className={`mt-3 p-3 rounded-lg text-xs flex items-start gap-2 ${result.ok ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"}`}>
            {result.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            <span className="break-all">{result.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
