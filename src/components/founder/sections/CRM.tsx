import { useNavigate } from "react-router-dom";
import { ArrowRight, Briefcase, Users, Building2 } from "lucide-react";

export default function CRM() {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="founder-card p-6 hover:border-[var(--fos-accent)]/40 transition-all cursor-pointer" onClick={() => navigate("/owner-crm")}>
        <Briefcase className="w-8 h-8 text-[var(--fos-accent)] mb-3" />
        <h3 className="text-[var(--fos-text)] font-semibold mb-1">Enterprise Sales CRM</h3>
        <p className="text-[var(--fos-muted)] text-sm mb-4">Pipeline, deals, companies, tasks for enterprise leads.</p>
        <span className="text-[var(--fos-accent)] text-xs font-semibold flex items-center gap-1">Open CRM <ArrowRight className="w-3 h-3" /></span>
      </div>
      <div className="founder-card p-6 hover:border-[var(--fos-accent)]/40 transition-all cursor-pointer" onClick={() => navigate("/crm")}>
        <Users className="w-8 h-8 text-[var(--fos-accent)] mb-3" />
        <h3 className="text-[var(--fos-text)] font-semibold mb-1">Customer CRM</h3>
        <p className="text-[var(--fos-muted)] text-sm mb-4">Day-to-day operational CRM for customers.</p>
        <span className="text-[var(--fos-accent)] text-xs font-semibold flex items-center gap-1">Open CRM <ArrowRight className="w-3 h-3" /></span>
      </div>
    </div>
  );
}
