import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Mail, Shield, Bell, PenTool, Sparkles, Save } from "lucide-react";
import { toast } from "sonner";

const SIG_KEY = "founder-signature";
const PREF_KEY = "founder-ai-prefs";

export default function FounderProfile() {
  const { user } = useAuth();
  const businessEmail = "naumansherwani@hostflowai.live";
  const lastLogin = user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("en-GB") : "—";

  const [signature, setSignature] = useState<string>("");
  const [aiTone, setAiTone] = useState<string>("founder");
  const [notifyNewLead, setNotifyNewLead] = useState(true);
  const [notifyHighChurn, setNotifyHighChurn] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);

  useEffect(() => {
    setSignature(localStorage.getItem(SIG_KEY) || "Best,\nNauman Sherwani\nFounder, HostFlow AI Technologies\nnaumansherwani@hostflowai.live");
    try {
      const prefs = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
      if (prefs.tone) setAiTone(prefs.tone);
      if (prefs.notifyNewLead != null) setNotifyNewLead(prefs.notifyNewLead);
      if (prefs.notifyHighChurn != null) setNotifyHighChurn(prefs.notifyHighChurn);
      if (prefs.notifyEmail != null) setNotifyEmail(prefs.notifyEmail);
    } catch {}
  }, []);

  const save = () => {
    localStorage.setItem(SIG_KEY, signature);
    localStorage.setItem(PREF_KEY, JSON.stringify({ tone: aiTone, notifyNewLead, notifyHighChurn, notifyEmail }));
    toast.success("Profile preferences saved");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="founder-card p-8">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--fos-accent)] to-[#0EA5E9] flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-[var(--fos-accent)]/30">
            NS
          </div>
          <div className="flex-1">
            <div className="text-[var(--fos-text)] text-xl font-bold">Nauman Sherwani</div>
            <div className="text-[var(--fos-muted)] text-sm">Founder · HostFlow AI Technologies</div>
            <div className="text-[var(--fos-success)] text-xs mt-1 flex items-center gap-1">● Admin · Lifetime Premium · Verified</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 text-sm">
          <Field label="Role" value="Owner / Founder" />
          <Field label="Company" value="HostFlow AI Technologies" />
          <Field label="Business Email" value={businessEmail} icon={Mail} accent />
          <Field label="Account Email" value={user?.email || "—"} />
          <Field label="Last Login" value={lastLogin} />
          <Field label="Security Status" value="MFA recommended · Sessions OK" icon={Shield} />
        </div>
      </div>

      <div className="founder-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <PenTool className="w-4 h-4 text-[var(--fos-accent)]" />
          <h3 className="text-[var(--fos-text)] font-semibold text-sm">Email Signature</h3>
        </div>
        <textarea
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          rows={5}
          className="w-full bg-[var(--fos-bg)] border border-[var(--fos-border)] rounded-lg p-3 text-sm text-[var(--fos-text)] outline-none focus:border-[var(--fos-accent)]"
        />
        <p className="text-[10px] text-[var(--fos-muted)] mt-2">Appended automatically when using AI templates in Compose.</p>
      </div>

      <div className="founder-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[var(--fos-accent)]" />
          <h3 className="text-[var(--fos-text)] font-semibold text-sm">AI Preferences</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {["founder", "sales", "warm", "concise", "executive"].map((t) => (
            <button
              key={t}
              onClick={() => setAiTone(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${aiTone === t ? "bg-[var(--fos-accent)]/10 text-[var(--fos-accent)] border-[var(--fos-accent)]/40" : "bg-[var(--fos-bg)] text-[var(--fos-muted)] border-[var(--fos-border)]"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="founder-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-[var(--fos-accent)]" />
          <h3 className="text-[var(--fos-text)] font-semibold text-sm">Notifications</h3>
        </div>
        <div className="space-y-2">
          <Toggle label="New enterprise lead arrives" value={notifyNewLead} onChange={setNotifyNewLead} />
          <Toggle label="High-value churn detected" value={notifyHighChurn} onChange={setNotifyHighChurn} />
          <Toggle label="New email in Owner Inbox" value={notifyEmail} onChange={setNotifyEmail} />
        </div>
      </div>

      <button onClick={save} className="px-4 py-2 rounded-lg bg-[var(--fos-accent)] text-[#0B1120] text-sm font-semibold flex items-center gap-2 hover:opacity-90">
        <Save className="w-4 h-4" /> Save Profile
      </button>
    </div>
  );
}

function Field({ label, value, icon: Icon, accent }: { label: string; value: string; icon?: any; accent?: boolean }) {
  return (
    <div className={`p-4 rounded-lg bg-[var(--fos-bg)] border border-[var(--fos-border)]/50 ${accent ? "border-[var(--fos-accent)]/30" : ""}`}>
      <div className="text-[var(--fos-muted)] text-[10px] uppercase tracking-wider flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </div>
      <div className={`font-semibold mt-1 truncate ${accent ? "text-[var(--fos-accent)]" : "text-[var(--fos-text)]"}`}>{value}</div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between p-3 rounded-lg bg-[var(--fos-bg)] border border-[var(--fos-border)]/50 hover:border-[var(--fos-accent)]/30"
    >
      <span className="text-sm text-[var(--fos-text)]">{label}</span>
      <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${value ? "bg-[var(--fos-accent)]" : "bg-[var(--fos-border)]"}`}>
        <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${value ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}
