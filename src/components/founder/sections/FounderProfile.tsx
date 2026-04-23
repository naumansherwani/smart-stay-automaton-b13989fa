import { useAuth } from "@/hooks/useAuth";
export default function FounderProfile() {
  const { user } = useAuth();
  return (
    <div className="founder-card p-8 max-w-2xl">
      <div className="flex items-center gap-5 mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--fos-accent)] to-[#0EA5E9] flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-[var(--fos-accent)]/30">
          {(user?.email || "F").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="text-[var(--fos-text)] text-xl font-bold">Founder</div>
          <div className="text-[var(--fos-muted)] text-sm">{user?.email}</div>
          <div className="text-[var(--fos-success)] text-xs mt-1 flex items-center gap-1">● Admin · Lifetime Premium</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-4 rounded-lg bg-[var(--fos-bg)] border border-[var(--fos-border)]/50">
          <div className="text-[var(--fos-muted)] text-[10px] uppercase tracking-wider">Role</div>
          <div className="text-[var(--fos-text)] font-semibold mt-1">Owner / Admin</div>
        </div>
        <div className="p-4 rounded-lg bg-[var(--fos-bg)] border border-[var(--fos-border)]/50">
          <div className="text-[var(--fos-muted)] text-[10px] uppercase tracking-wider">Company</div>
          <div className="text-[var(--fos-text)] font-semibold mt-1">HostFlow AI Technologies</div>
        </div>
      </div>
    </div>
  );
}
