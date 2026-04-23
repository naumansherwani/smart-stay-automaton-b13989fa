import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, RefreshCw, Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { useEntLeads, DEAL_STAGES, STAGE_COLORS, type DealStage, type EntLead, fmtGBP } from "@/hooks/useEnterpriseCrm";
import EntLeadDetailSheet from "./EntLeadDetailSheet";

export default function EntLeads() {
  const { data, loading, refetch } = useEntLeads();
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [selected, setSelected] = useState<EntLead | null>(null);

  // Keep selected lead in sync after refetch (status updates from drawer)
  const refreshSelected = (id: string) => {
    const fresh = data.find((l) => l.id === id);
    if (fresh) setSelected(fresh);
  };

  const filtered = data.filter((l) => {
    if (stageFilter !== "all" && l.status !== stageFilter) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      l.full_name?.toLowerCase().includes(s) ||
      l.company_name?.toLowerCase().includes(s) ||
      l.work_email?.toLowerCase().includes(s) ||
      l.country?.toLowerCase().includes(s)
    );
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("enterprise_leads").update({ status }).eq("id", id);
    if (error) toast.error("Update failed"); else { toast.success("Status updated"); refetch(); }
  };

  const convertToDeal = async (lead: typeof data[number]) => {
    const { error } = await supabase.from("ent_deals").insert({
      title: `${lead.company_name} — Enterprise`,
      lead_id: lead.id,
      stage: "qualified",
      value_gbp: lead.estimated_value_gbp || 0,
      probability: 30,
    });
    if (error) toast.error("Could not create deal"); else toast.success("Deal created — see Pipeline tab");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, company, email…" className="pl-9" />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {DEAL_STAGES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No enterprise leads match your filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-3 px-4 font-medium">Lead</th>
                    <th className="py-3 px-4 font-medium">Contact</th>
                    <th className="py-3 px-4 font-medium">Country</th>
                    <th className="py-3 px-4 font-medium">Industry</th>
                    <th className="py-3 px-4 font-medium">Est. Value</th>
                    <th className="py-3 px-4 font-medium">Submitted</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr
                      key={l.id}
                      onClick={() => setSelected(l)}
                      className="border-t border-border/40 hover:bg-amber-500/5 align-top cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium">{l.full_name}</div>
                        <div className="text-xs text-muted-foreground">{l.company_name}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <a href={`mailto:${l.work_email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 hover:text-primary">
                          <Mail className="w-3 h-3" /> {l.work_email}
                        </a>
                        {l.phone && <span className="flex items-center gap-1 text-muted-foreground mt-0.5"><Phone className="w-3 h-3" /> {l.phone}</span>}
                      </td>
                      <td className="py-3 px-4 text-xs">{l.country || "—"}</td>
                      <td className="py-3 px-4 text-xs">{l.industry ? <Badge variant="outline" className="text-[10px]">{l.industry}</Badge> : "—"}</td>
                      <td className="py-3 px-4 text-xs tabular-nums">{l.estimated_value_gbp ? fmtGBP(Number(l.estimated_value_gbp)) : "—"}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <Select value={l.status} onValueChange={(v) => setStatus(l.id, v)}>
                          <SelectTrigger className={`h-7 text-[11px] w-[120px] border ${STAGE_COLORS[l.status as DealStage] || ""}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DEAL_STAGES.map((s) => <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" className="h-7 text-[11px] mr-1" onClick={() => setSelected(l)}>
                          Open
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => convertToDeal(l)}>
                          <Plus className="w-3 h-3 mr-1" /> Deal
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <EntLeadDetailSheet
        lead={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onChanged={() => { refetch(); if (selected) setTimeout(() => refreshSelected(selected.id), 300); }}
      />
    </div>
  );
}