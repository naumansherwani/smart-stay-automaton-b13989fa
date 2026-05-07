import { LayoutDashboard, Crown, TrendingUp, Users, Target, Briefcase, ShieldCheck, CheckSquare, Sparkles, BarChart3, Settings, UserCircle, LogOut, Moon, Sun, Mail, Search, Activity } from "lucide-react";
import { useFounderTheme } from "./FounderTheme";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import logoImg from "@/assets/logo-h-cal-4.png";

export type FounderSection =
  | "overview" | "executive" | "revenue" | "customers" | "leads" | "crm"
  | "emails" | "tasks" | "ai" | "sherlock" | "analytics" | "security" | "settings" | "profile"
  | "revenue_intel";

const SHERLOCK_USER_ID = "d089432d-5d6b-416e-bd29-abe913121d99";

const items: { id: FounderSection; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "executive", label: "Executive HQ", icon: Crown },
  { id: "revenue", label: "Revenue", icon: TrendingUp },
  { id: "revenue_intel", label: "Revenue Intelligence", icon: Activity },
  { id: "customers", label: "Customers", icon: Users },
  { id: "leads", label: "Leads", icon: Target },
  { id: "crm", label: "Enterprise CRM", icon: Briefcase },
  { id: "emails", label: "AI Email Center", icon: Mail },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "ai", label: "AI Advisor", icon: Sparkles },
  { id: "sherlock", label: "Sherlock", icon: Search },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "profile", label: "Founder Profile", icon: UserCircle },
];

export default function FounderSidebar({ active, onSelect }: { active: FounderSection; onSelect: (s: FounderSection) => void }) {
  const { mode, toggle } = useFounderTheme();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const visibleItems = items.filter((it) => it.id !== "sherlock" || user?.id === SHERLOCK_USER_ID);

  return (
    <aside className="founder-sidebar fixed left-0 top-0 h-screen w-[280px] flex flex-col z-40">
      <Link
        to="/"
        className="px-6 py-6 border-b border-[var(--fos-border)] flex items-center gap-3 hover:bg-[var(--fos-card)]/50 transition-colors group"
        title="Return to landing page"
      >
        <img src={logoImg} alt="HostFlow AI" className="w-10 h-10 shrink-0 object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] group-hover:scale-105 transition-transform" />
        <div>
          <div className="text-[var(--fos-text)] text-sm font-semibold leading-tight">Founder OS</div>
          <div className="text-[var(--fos-muted)] text-[10px] tracking-widest uppercase">HostFlow AI</div>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleItems.map((it, i) => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onSelect(it.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[var(--fos-accent)]/10 text-[var(--fos-accent)] shadow-[0_0_0_1px_var(--fos-accent)]/20"
                  : "text-[var(--fos-muted)] hover:text-[var(--fos-text)] hover:bg-[var(--fos-card)]"
              }`}
            >
              <span className={`text-[10px] tabular-nums w-4 ${isActive ? "text-[var(--fos-accent)]" : "text-[var(--fos-muted)]/60"}`}>{i + 1}</span>
              <Icon className="w-4 h-4 shrink-0" />
              <span>{it.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-[var(--fos-border)] p-4 space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[var(--fos-card)] text-[var(--fos-muted)] hover:text-[var(--fos-text)] text-xs font-medium transition-colors"
          >
            {mode === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {mode === "dark" ? "Light" : "Dark"}
          </button>
          <button
            onClick={() => { signOut(); navigate("/"); }}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[var(--fos-card)] text-[var(--fos-muted)] hover:text-[var(--fos-danger)] text-xs font-medium transition-colors"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[10px] text-[var(--fos-muted)]/70">
          <span className="px-2 py-0.5 rounded bg-[var(--fos-card)] font-mono">v1.0.0</span>
          <span className="text-[var(--fos-success)]">● Operational</span>
        </div>
      </div>
    </aside>
  );
}
