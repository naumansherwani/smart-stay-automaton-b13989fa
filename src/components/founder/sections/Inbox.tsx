import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, AlertTriangle, Briefcase, Ticket, CreditCard, Archive, Reply, Flag, Plus, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type InboxItem = {
  id: string;
  type: "enterprise_lead" | "ticket" | "alert" | "refund";
  title: string;
  subtitle: string;
  body?: string;
  createdAt: string;
  severity?: "low" | "medium" | "high" | "critical";
  raw: any;
};

const TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  enterprise_lead: { icon: Briefcase, color: "text-[var(--fos-accent)]", label: "Enterprise Lead" },
  ticket: { icon: Ticket, color: "text-[var(--fos-warning)]", label: "Support Ticket" },
  alert: { icon: AlertTriangle, color: "text-[var(--fos-danger)]", label: "System Alert" },
  refund: { icon: CreditCard, color: "text-[var(--fos-warning)]", label: "Refund / Payment" },
};

export default function Inbox() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [filter, setFilter] = useState<"all" | InboxItem["type"]>("all");
  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [archived, setArchived] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("fos-inbox-archived") || "[]")); } catch { return new Set(); }
  });
  const [urgent, setUrgent] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("fos-inbox-urgent") || "[]")); } catch { return new Set(); }
  });
  const { toast } = useToast();

  const persist = (key: string, set: Set<string>) => localStorage.setItem(key, JSON.stringify([...set]));

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const [leadsR, ticketsR, alertsR, refundsR] = await Promise.all([
      supabase.from("enterprise_leads").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(50),
      supabase.from("crm_tickets").select("id,subject,description,status,priority,created_at,ticket_number").gte("created_at", since).order("created_at", { ascending: false }).limit(50),
      supabase.from("admin_alerts").select("*").eq("is_resolved", false).order("created_at", { ascending: false }).limit(50),
      supabase.from("payment_refunds").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(30),
    ]);
    const merged: InboxItem[] = [];
    (leadsR.data || []).forEach((l: any) => merged.push({
      id: "lead-" + l.id, type: "enterprise_lead",
      title: l.full_name + " · " + (l.company_name || "—"),
      subtitle: l.work_email + (l.country ? " · " + l.country : ""),
      body: l.current_challenges || l.features_needed,
      createdAt: l.created_at, raw: l,
    }));
    (ticketsR.data || []).forEach((t: any) => merged.push({
      id: "ticket-" + t.id, type: "ticket",
      title: "#" + t.ticket_number + " · " + t.subject,
      subtitle: "Status: " + t.status + " · Priority: " + t.priority,
      body: t.description, createdAt: t.created_at, raw: t,
      severity: t.priority === "high" || t.priority === "urgent" ? "high" : "medium",
    }));
    (alertsR.data || []).forEach((a: any) => merged.push({
      id: "alert-" + a.id, type: "alert",
      title: a.title, subtitle: a.alert_type + " · " + a.severity,
      body: a.message, createdAt: a.created_at, raw: a, severity: a.severity,
    }));
    (refundsR.data || []).forEach((r: any) => merged.push({
      id: "refund-" + r.id, type: "refund",
      title: "Refund · £" + Number(r.amount).toLocaleString(),
      subtitle: (r.plan || "—") + " · " + r.status,
      body: r.reason_details || r.reason, createdAt: r.created_at, raw: r,
    }));
    merged.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    setItems(merged);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    return () => clearInterval(i);
  }, []);

  const visible = items.filter((it) => {
    if (archived.has(it.id)) return false;
    if (filter === "all") return true;
    return it.type === filter;
  });

  const toggleSet = (set: Set<string>, key: string, storageKey: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next); persist(storageKey, next);
  };

  const counts = {
    all: items.filter((i) => !archived.has(i.id)).length,
    enterprise_lead: items.filter((i) => i.type === "enterprise_lead" && !archived.has(i.id)).length,
    ticket: items.filter((i) => i.type === "ticket" && !archived.has(i.id)).length,
    alert: items.filter((i) => i.type === "alert" && !archived.has(i.id)).length,
    refund: items.filter((i) => i.type === "refund" && !archived.has(i.id)).length,
  };

  const reply = (it: InboxItem) => {
    if (it.type === "enterprise_lead" && it.raw.work_email) {
      window.location.href = `mailto:${it.raw.work_email}?subject=Re: HostFlow AI Enterprise Inquiry`;
    } else {
      toast({ title: "Reply", description: "Open this item in its source module to reply." });
    }
  };

  const createDeal = async (it: InboxItem) => {
    if (it.type !== "enterprise_lead") return toast({ title: "Only enterprise leads can be converted." });
    const { error } = await supabase.from("ent_deals").insert({
      title: (it.raw.company_name || it.raw.full_name) + " · Enterprise Deal",
      stage: "new", value_gbp: it.raw.estimated_value_gbp || 0, lead_id: it.raw.id, company_name: it.raw.company_name,
    } as any);
    if (error) toast({ title: "Could not create deal", description: error.message, variant: "destructive" });
    else toast({ title: "Deal created", description: "Available in Enterprise CRM pipeline." });
  };

  const FilterTab = ({ id, label, count }: any) => (
    <button onClick={() => { setFilter(id); setSelected(null); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === id ? "bg-[var(--fos-accent)]/15 text-[var(--fos-accent)]" : "text-[var(--fos-muted)] hover:text-[var(--fos-text)] hover:bg-[var(--fos-card)]"}`}>
      {label} <span className="ml-1 opacity-60">{count}</span>
    </button>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-180px)]">
      <div className="lg:col-span-2 founder-card flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--fos-border)] flex flex-wrap gap-1.5">
          <FilterTab id="all" label="All" count={counts.all} />
          <FilterTab id="enterprise_lead" label="Leads" count={counts.enterprise_lead} />
          <FilterTab id="ticket" label="Tickets" count={counts.ticket} />
          <FilterTab id="alert" label="Alerts" count={counts.alert} />
          <FilterTab id="refund" label="Refunds" count={counts.refund} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <div className="p-6 text-center text-[var(--fos-muted)] text-sm flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading inbox…</div>}
          {!loading && visible.length === 0 && <div className="p-12 text-center text-[var(--fos-muted)] text-sm">Inbox zero. Nothing waiting on you.</div>}
          {visible.map((it) => {
            const meta = TYPE_META[it.type];
            const Icon = meta.icon;
            const isUrgent = urgent.has(it.id);
            return (
              <button key={it.id} onClick={() => setSelected(it)} className={`w-full text-left px-4 py-3 border-b border-[var(--fos-border)]/40 hover:bg-[var(--fos-bg)] transition ${selected?.id === it.id ? "bg-[var(--fos-bg)]" : ""}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${meta.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-[var(--fos-text)] text-sm font-medium truncate">{it.title}</div>
                      {isUrgent && <Flag className="w-3 h-3 text-[var(--fos-danger)] shrink-0" />}
                    </div>
                    <div className="text-[var(--fos-muted)] text-xs truncate mt-0.5">{it.subtitle}</div>
                  </div>
                  <div className="text-[10px] text-[var(--fos-muted)] shrink-0">{new Date(it.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-3 founder-card flex flex-col overflow-hidden">
        {selected ? (
          <>
            <div className="px-6 py-4 border-b border-[var(--fos-border)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--fos-muted)]">{TYPE_META[selected.type].label}</div>
                  <h3 className="text-[var(--fos-text)] font-semibold text-base mt-0.5">{selected.title}</h3>
                  <div className="text-[var(--fos-muted)] text-xs mt-0.5">{selected.subtitle} · {new Date(selected.createdAt).toLocaleString("en-GB")}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button onClick={() => reply(selected)} className="px-3 py-1.5 rounded-lg bg-[var(--fos-accent)] text-white text-xs font-semibold flex items-center gap-1.5"><Reply className="w-3.5 h-3.5" /> Reply</button>
                <button onClick={() => toggleSet(urgent, selected.id, "fos-inbox-urgent", setUrgent)} className="px-3 py-1.5 rounded-lg bg-[var(--fos-card)] border border-[var(--fos-border)] text-[var(--fos-text)] text-xs font-semibold flex items-center gap-1.5"><Flag className="w-3.5 h-3.5" /> {urgent.has(selected.id) ? "Unmark Urgent" : "Mark Urgent"}</button>
                <button onClick={() => createDeal(selected)} className="px-3 py-1.5 rounded-lg bg-[var(--fos-card)] border border-[var(--fos-border)] text-[var(--fos-text)] text-xs font-semibold flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Create Deal</button>
                <button onClick={() => { toggleSet(archived, selected.id, "fos-inbox-archived", setArchived); setSelected(null); }} className="px-3 py-1.5 rounded-lg bg-[var(--fos-card)] border border-[var(--fos-border)] text-[var(--fos-muted)] text-xs font-semibold flex items-center gap-1.5"><Archive className="w-3.5 h-3.5" /> Archive</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 text-sm text-[var(--fos-text)] leading-relaxed whitespace-pre-wrap">
              {selected.body || <span className="text-[var(--fos-muted)] italic">No message body.</span>}
              {selected.type === "enterprise_lead" && (
                <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                  {[["Industry", selected.raw.industry], ["Team", selected.raw.team_size], ["Country", selected.raw.country], ["Phone", selected.raw.phone], ["Status", selected.raw.status], ["Source", selected.raw.source]].map(([k, v]) => v ? (
                    <div key={k as string} className="flex justify-between border-b border-[var(--fos-border)]/40 py-1.5">
                      <span className="text-[var(--fos-muted)]">{k}</span><span className="text-[var(--fos-text)]">{String(v)}</span>
                    </div>
                  ) : null)}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--fos-muted)] text-sm">
            <div className="text-center">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Select an item to view details and take action.
              <div className="mt-4"><a href="/owner-crm" className="text-[var(--fos-accent)] hover:underline inline-flex items-center gap-1 text-xs">Open Enterprise CRM <ExternalLink className="w-3 h-3" /></a></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}