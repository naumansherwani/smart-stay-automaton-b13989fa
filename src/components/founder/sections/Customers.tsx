import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Customers() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("user_id,plan,status,created_at,current_period_end")
        .order("created_at", { ascending: false })
        .limit(100);
      setRows(data || []);
    })();
  }, []);
  return (
    <div className="founder-card overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--fos-border)] flex items-center justify-between">
        <h3 className="text-[var(--fos-text)] font-semibold text-sm">All Customers</h3>
        <span className="text-[var(--fos-muted)] text-xs">{rows.length} shown</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--fos-muted)] text-[11px] uppercase tracking-wider border-b border-[var(--fos-border)]">
              <th className="text-left px-6 py-3 font-medium">User</th>
              <th className="text-left px-6 py-3 font-medium">Plan</th>
              <th className="text-left px-6 py-3 font-medium">Status</th>
              <th className="text-left px-6 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-[var(--fos-border)]/40 hover:bg-[var(--fos-bg)]">
                <td className="px-6 py-3 text-[var(--fos-text)] font-mono text-xs">{r.user_id?.slice(0, 8)}…</td>
                <td className="px-6 py-3"><span className="px-2 py-0.5 rounded bg-[var(--fos-accent)]/10 text-[var(--fos-accent)] text-xs font-medium uppercase">{r.plan}</span></td>
                <td className="px-6 py-3 text-[var(--fos-muted)]">{r.status}</td>
                <td className="px-6 py-3 text-[var(--fos-muted)] text-xs">{new Date(r.created_at).toLocaleDateString("en-GB")}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="text-center text-[var(--fos-muted)] py-12 text-sm">No customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
