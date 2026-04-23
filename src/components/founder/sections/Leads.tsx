import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Leads() {
  const [rows, setRows] = useState<any[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("enterprise_leads").select("*").order("created_at", { ascending: false }).limit(50);
      setRows(data || []);
    })();
  }, []);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => navigate("/owner-crm")} className="text-xs text-[var(--fos-accent)] hover:underline flex items-center gap-1">
          Open Enterprise CRM <ExternalLink className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((l) => (
          <div key={l.id} className="founder-card p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-[var(--fos-text)] font-semibold text-sm">{l.full_name}</div>
                <div className="text-[var(--fos-muted)] text-xs">{l.company_name} · {l.country}</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-[var(--fos-accent)]/10 text-[var(--fos-accent)] text-[10px] uppercase font-semibold">{l.status}</span>
            </div>
            <div className="text-[var(--fos-muted)] text-xs mt-2">{l.work_email}</div>
            {l.current_challenges && <p className="text-[var(--fos-muted)] text-xs mt-2 line-clamp-2">{l.current_challenges}</p>}
          </div>
        ))}
        {rows.length === 0 && <div className="col-span-2 founder-card p-12 text-center text-[var(--fos-muted)] text-sm">No enterprise leads yet.</div>}
      </div>
    </div>
  );
}
