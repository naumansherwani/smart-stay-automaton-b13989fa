import { useState, useEffect } from "react";
import { Plus, Search, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import FounderNotifications from "./FounderNotifications";
import { useOwnerMailbox } from "@/hooks/useOwnerMailbox";
import UserHalo from "@/components/identity/UserHalo";

const TZ = [
  { city: "London", tz: "Europe/London" },
  { city: "NYC", tz: "America/New_York" },
  { city: "Dubai", tz: "Asia/Dubai" },
];

export default function FounderHeader({ title, onSelect }: { title: string; onSelect?: (s: string) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const mailbox = useOwnerMailbox("inbox", "");
  const unread = mailbox.counts.inbox?.unread || 0;
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);

  return (
    <header className="founder-header sticky top-0 z-30 h-[72px] flex items-center justify-between px-6 gap-4">
      <div className="min-w-[160px]">
        <h1 className="text-[var(--fos-text)] text-lg font-semibold tracking-tight">{title}</h1>
        <p className="text-[var(--fos-muted)] text-[11px] tracking-wide">Founder Command Center</p>
      </div>

      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--fos-muted)]" />
          <input
            placeholder="Search customers, leads, deals, emails…"
            className="w-full bg-[var(--fos-card)] border border-[var(--fos-border)] rounded-lg pl-9 pr-3 py-2 text-[13px] text-[var(--fos-text)] placeholder:text-[var(--fos-muted)] focus:outline-none focus:border-[var(--fos-accent)]/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-3 text-[10px] text-[var(--fos-muted)] tabular-nums">
          {TZ.map((z) => (
            <div key={z.tz} className="flex flex-col items-end leading-tight">
              <span className="text-[9px] uppercase tracking-wider opacity-70">{z.city}</span>
              <span className="text-[var(--fos-text)] font-medium">{now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: z.tz })}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => onSelect ? onSelect("emails") : navigate("/owner/email")}
          className="relative w-9 h-9 rounded-lg bg-[var(--fos-card)] border border-[var(--fos-border)] hover:border-[var(--fos-accent)]/40 flex items-center justify-center text-[var(--fos-muted)] hover:text-[var(--fos-text)] transition-colors"
          aria-label="Compose Email"
          title="Compose Email"
        >
          <Mail className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--fos-accent)] text-[#0B1120] text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        <FounderNotifications />

        <button className="h-9 px-3 rounded-lg bg-[var(--fos-accent)] hover:bg-[var(--fos-accent)]/90 text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-lg shadow-[var(--fos-accent)]/20 transition-all">
          <Plus className="w-3.5 h-3.5" />
          Quick Add
        </button>

        <div className="relative">
          <UserHalo
            size={36}
            founderBadge
            pulse="idle"
            onClick={() => onSelect?.("profile")}
            title="Founder Profile"
          />
          <span className="absolute -bottom-0 -left-0 w-2.5 h-2.5 rounded-full bg-[var(--fos-success)] border-2 border-[var(--fos-bg)] z-[3]" />
        </div>
      </div>
    </header>
  );
}
