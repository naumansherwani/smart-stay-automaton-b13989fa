import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Mail, Phone, Globe, Users, Building2, Inbox } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface EnterpriseLead {
  id: string;
  full_name: string;
  company_name: string;
  work_email: string;
  phone: string | null;
  industry: string | null;
  team_size: string | null;
  country: string | null;
  current_challenges: string | null;
  features_needed: string | null;
  preferred_contact_method: string | null;
  source: string;
  status: string;
  currency_context: string;
  created_at: string;
}

const STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;

const statusVariant = (s: string) => {
  switch (s) {
    case "new": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "contacted": return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "qualified": return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    case "won": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "lost": return "bg-red-500/15 text-red-400 border-red-500/30";
    default: return "bg-muted text-muted-foreground";
  }
};

export default function OwnerLeadsTab({ showSecret = true }: { showSecret?: boolean }) {
  const [leads, setLeads] = useState<EnterpriseLead[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("enterprise_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error(error);
      toast.error("Failed to load enterprise leads");
    } else {
      setLeads((data || []) as EnterpriseLead[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("enterprise_leads")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Could not update status");
    } else {
      toast.success("Status updated");
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    }
  };

  const newCount = leads.filter((l) => l.status === "new").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-2.5">
        <div className="text-xs">
          <span className="font-semibold text-amber-400">New:</span>{" "}
          <span className="text-muted-foreground">Full Enterprise Sales CRM with pipeline, deals, tasks & analytics.</span>
        </div>
        <Link to="/owner-crm" className="text-xs font-medium text-amber-400 hover:text-amber-300 underline underline-offset-2">
          Open Enterprise CRM →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Inbox className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs text-muted-foreground">New Leads</div>
              <div className="text-xl font-bold">{newCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Total Leads</div>
              <div className="text-xl font-bold">{leads.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs text-muted-foreground">Won</div>
              <div className="text-xl font-bold">{leads.filter((l) => l.status === "won").length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-xs text-muted-foreground">Currency</div>
              <div className="text-xl font-bold">GBP £</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            Enterprise Leads
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchLeads} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No enterprise leads yet. New submissions from the public pricing page appear here instantly.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Company</th>
                    <th className="pb-2 font-medium">Contact</th>
                    <th className="pb-2 font-medium">Country</th>
                    <th className="pb-2 font-medium">Team</th>
                    <th className="pb-2 font-medium">Industry</th>
                    <th className="pb-2 font-medium">Submitted</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} className="border-b border-border/50 align-top">
                      <td className="py-3 text-foreground font-medium">
                        {showSecret ? l.full_name : "•••"}
                      </td>
                      <td className="py-3 text-foreground">
                        {showSecret ? l.company_name : "•••"}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {showSecret ? (
                          <div className="space-y-0.5">
                            <a href={`mailto:${l.work_email}`} className="flex items-center gap-1 text-foreground hover:text-primary">
                              <Mail className="w-3 h-3" /> {l.work_email}
                            </a>
                            {l.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {l.phone}
                              </span>
                            )}
                          </div>
                        ) : "•••"}
                      </td>
                      <td className="py-3 text-xs">{l.country || "—"}</td>
                      <td className="py-3 text-xs">{l.team_size || "—"}</td>
                      <td className="py-3 text-xs">
                        {l.industry ? <Badge variant="outline" className="text-[10px]">{l.industry}</Badge> : "—"}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {new Date(l.created_at).toLocaleDateString()}<br />
                        <span className="opacity-70">{new Date(l.created_at).toLocaleTimeString()}</span>
                      </td>
                      <td className="py-3">
                        <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                          <SelectTrigger className={`h-7 text-[11px] w-[110px] border ${statusVariant(l.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
