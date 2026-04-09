import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, TicketCheck, AlertTriangle, Clock, CheckCircle2, XCircle, Sparkles, Loader2 } from "lucide-react";
import { useCrmTickets, useCrmContacts } from "@/hooks/useCrm";
import { getCrmConfig } from "@/lib/crmConfig";
import type { IndustryType } from "@/lib/industryConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props { industry: IndustryType; isPremium: boolean; }

const STATUS_ICONS: Record<string, React.ReactNode> = {
  open: <Clock className="h-4 w-4 text-blue-500" />,
  in_progress: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  resolved: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  closed: <XCircle className="h-4 w-4 text-muted-foreground" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500", medium: "bg-blue-500", high: "bg-orange-500", critical: "bg-red-600",
};

export default function CrmTicketsTab({ industry, isPremium }: Props) {
  const config = getCrmConfig(industry);
  const { tickets, loading, addTicket, updateTicket } = useCrmTickets();
  const { contacts } = useCrmContacts();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [form, setForm] = useState({ subject: "", description: "", category: "general", priority: "medium", contact_id: "" });

  const filtered = tickets.filter(t => {
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || t.ticket_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAdd = async () => {
    if (!form.subject.trim()) { toast.error("Subject is required"); return; }
    const payload: any = { subject: form.subject, description: form.description, category: form.category, priority: form.priority };
    if (form.contact_id) payload.contact_id = form.contact_id;
    const res = await addTicket(payload);
    if (res?.error) toast.error("Failed to create ticket");
    else { toast.success(`${config.ticketLabel} created`); setOpen(false); setForm({ subject: "", description: "", category: "general", priority: "medium", contact_id: "" }); }
  };

  const handleAiAnalyze = async (ticket: { id: string; subject: string; description: string | null; category: string }) => {
    if (!isPremium) { toast.error("AI features require Premium subscription"); return; }
    setAiLoading(ticket.id);
    try {
      const { data, error } = await supabase.functions.invoke("crm-ai-assistant", {
        body: { action: "analyze_ticket", data: { subject: ticket.subject, description: ticket.description || "", industry, category: ticket.category } },
      });
      if (error) throw error;
      await updateTicket(ticket.id, {
        ai_summary: data.summary,
        ai_category: data.suggested_category,
        ai_sentiment: data.sentiment,
        ai_suggested_resolution: data.resolution_steps?.join("\n") || "",
      });
      toast.success("AI analysis complete!");
    } catch {
      toast.error("AI analysis failed");
    } finally {
      setAiLoading(null);
    }
  };

  const statusCounts = {
    open: tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    closed: tickets.filter(t => t.status === "closed").length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card key={status} className={`cursor-pointer ${statusFilter === status ? "ring-2 ring-primary" : ""}`} onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}>
            <CardContent className="p-3 flex items-center gap-2">
              {STATUS_ICONS[status]}
              <div>
                <p className="text-lg font-bold">{count}</p>
                <p className="text-xs text-muted-foreground capitalize">{status.replace("_", " ")}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={`Search ${config.ticketLabelPlural.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New {config.ticketLabel}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New {config.ticketLabel}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Subject *</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{config.ticketCategories.map(c => <SelectItem key={c} value={c}>{c.replace(/-/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(config.priorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {contacts.length > 0 && (
                <div>
                  <Label>{config.contactLabel}</Label>
                  <Select value={form.contact_id} onValueChange={v => setForm(p => ({ ...p, contact_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Link to contact..." /></SelectTrigger>
                    <SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleAdd} className="w-full">Create {config.ticketLabel}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="text-center py-12">
          <TicketCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No {config.ticketLabelPlural.toLowerCase()} yet.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(ticket => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {STATUS_ICONS[ticket.status]}
                      <span className="font-mono text-xs text-muted-foreground">#{ticket.ticket_number}</span>
                      <Badge className={`${PRIORITY_COLORS[ticket.priority]} text-white text-xs`}>{ticket.priority}</Badge>
                      <Badge variant="outline" className="text-xs">{ticket.category.replace(/-/g, " ")}</Badge>
                    </div>
                    <p className="font-medium">{ticket.subject}</p>
                    {ticket.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ticket.description}</p>}
                    {ticket.contact && <p className="text-xs text-muted-foreground mt-1">{config.contactLabel}: {ticket.contact.name}</p>}
                    {ticket.ai_summary && (
                      <div className="mt-2 p-2 bg-primary/5 rounded-md border border-primary/10">
                        <p className="text-xs font-medium text-primary flex items-center gap-1"><Sparkles className="h-3 w-3" />AI Summary</p>
                        <p className="text-xs mt-1">{ticket.ai_summary}</p>
                      </div>
                    )}
                    {ticket.ai_suggested_resolution && (
                      <div className="mt-2 p-2 bg-green-500/5 rounded-md border border-green-500/10">
                        <p className="text-xs font-medium text-green-600 flex items-center gap-1"><Sparkles className="h-3 w-3" />AI Resolution</p>
                        <p className="text-xs mt-1 whitespace-pre-line">{ticket.ai_suggested_resolution}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Select value={ticket.status} onValueChange={v => updateTicket(ticket.id, { status: v, ...(v === "resolved" ? { resolved_at: new Date().toISOString() } : {}) })}>
                      <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    {isPremium && (
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => handleAiAnalyze(ticket)} disabled={aiLoading === ticket.id}>
                        {aiLoading === ticket.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                        AI Analyze
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
