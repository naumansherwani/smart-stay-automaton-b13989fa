import { useState, useEffect } from "react";
import { Bell, Plus, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const TZ = [
  { city: "London", tz: "Europe/London" },
  { city: "NYC", tz: "America/New_York" },
  { city: "Dubai", tz: "Asia/Dubai" },
];

export default function FounderHeader({ title }: { title: string }) {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);

  const initials = (user?.email || "F").slice(0, 2).toUpperCase();

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

        <button className="relative w-9 h-9 rounded-lg bg-[var(--fos-card)] border border-[var(--fos-border)] hover:border-[var(--fos-accent)]/40 flex items-center justify-center text-[var(--fos-muted)] hover:text-[var(--fos-text)] transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--fos-danger)]" />
        </button>

        <button className="h-9 px-3 rounded-lg bg-[var(--fos-accent)] hover:bg-[var(--fos-accent)]/90 text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-lg shadow-[var(--fos-accent)]/20 transition-all">
          <Plus className="w-3.5 h-3.5" />
          Quick Add
        </button>

        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--fos-accent)] to-[#0EA5E9] flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-[var(--fos-accent)]/20 cursor-pointer">
          {initials}
        </div>
      </div>
    </header>
  );
}
