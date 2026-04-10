import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, User, Mail, Phone, Building2, Trash2, Sparkles, Download, Upload, Eye, MoreHorizontal, Tag, Filter } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCrmContacts } from "@/hooks/useCrm";
import { getCrmConfig } from "@/lib/crmConfig";
import type { IndustryType } from "@/lib/industryConfig";
import type { CrmContact } from "@/hooks/useCrm";
import CrmContactDetailPanel from "./CrmContactDetailPanel";
import { toast } from "sonner";
import { useTrialLimits } from "@/hooks/useTrialLimits";
import LimitReachedPopup from "@/components/conversion/LimitReachedPopup";
import FirstSuccessMessage from "@/components/conversion/FirstSuccessMessage";
import SmartEmptyState from "@/components/conversion/SmartEmptyState";
import UpgradeNudge from "@/components/conversion/UpgradeNudge";

interface Props { industry: IndustryType; }

export default function CrmContactsTab({ industry }: Props) {
  const config = getCrmConfig(industry);
  const { contacts, loading, addContact, updateContact, deleteContact } = useCrmContacts();
  const { limits, isTrial } = useTrialLimits();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", lifecycle_stage: "lead", source: "direct", notes: "", tags: "" });
  const [limitPopup, setLimitPopup] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);
  const [lastAddedName, setLastAddedName] = useState("");
  const hadContactsBefore = useRef(contacts.length > 0);

  const filtered = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || c.lifecycle_stage === stageFilter;
    const matchSource = sourceFilter === "all" || c.source === sourceFilter;
    const matchRisk = riskFilter === "all" || c.churn_risk === riskFilter;
    return matchSearch && matchStage && matchSource && matchRisk;
  });

  const handleAdd = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    // Check trial limit
    if (isTrial && limits.crmContacts > 0 && contacts.length >= limits.crmContacts) {
      setLimitPopup(true);
      return;
    }
    const res = await addContact({ ...form });
    if (res?.error) toast.error("Failed to add contact");
    else {
      toast.success(`${config.contactLabel} added`);
      // Show first success message
      if (!hadContactsBefore.current && contacts.length === 0) {
        setLastAddedName(form.name);
        setSuccessPopup(true);
        hadContactsBefore.current = true;
      }
      setOpen(false);
      setForm({ name: "", email: "", phone: "", company: "", lifecycle_stage: "lead", source: "direct", notes: "", tags: "" });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    for (const id of ids) { await deleteContact(id); }
    setSelectedIds(new Set());
    toast.success(`${ids.length} contacts deleted`);
  };

  const handleBulkStageChange = async (stage: string) => {
    const ids = Array.from(selectedIds);
    for (const id of ids) { await updateContact(id, { lifecycle_stage: stage }); }
    setSelectedIds(new Set());
    toast.success(`${ids.length} contacts updated`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(c => c.id)));
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Email", "Phone", "Company", "Stage", "Source", "AI Score", "Revenue", "Bookings", "Churn Risk"].join(","),
      ...contacts.map(c => [c.name, c.email || "", c.phone || "", c.company || "", c.lifecycle_stage, c.source || "", c.ai_score, c.total_revenue, c.total_bookings, c.churn_risk].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `crm-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("Contacts exported!");
  };

  // If a contact is selected, show detail panel
  if (selectedContact) {
    return (
      <CrmContactDetailPanel
        contact={selectedContact}
        industry={industry}
        onBack={() => setSelectedContact(null)}
        onUpdate={updateContact}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <Badge variant="secondary">{selectedIds.size} selected</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">Change Stage</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {config.lifecycleStages.map(s => (
                <DropdownMenuItem key={s.value} onClick={() => handleBulkStageChange(s.value)}>{s.label}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={`Search ${config.contactLabelPlural.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {config.lifecycleStages.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {config.sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Risk" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Export</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add {config.contactLabel}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New {config.contactLabel}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                </div>
                <div><Label>Company</Label><Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Stage</Label>
                    <Select value={form.lifecycle_stage} onValueChange={v => setForm(p => ({ ...p, lifecycle_stage: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{config.lifecycleStages.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Source</Label>
                    <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{config.sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="vip, corporate, returning" /></div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
                <Button onClick={handleAdd} className="w-full">Add {config.contactLabel}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Trial limit indicator */}
      {isTrial && limits.crmContacts > 0 && (
        <UpgradeNudge
          variant="inline"
          message={`${contacts.length} of ${limits.crmContacts} contacts used — upgrade for unlimited`}
          feature="Unlimited Contacts"
        />
      )}

      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{filtered.length} of {contacts.length} {config.contactLabelPlural.toLowerCase()}</span>
        {contacts.filter(c => c.churn_risk === "high").length > 0 && (
          <Badge variant="destructive" className="text-[10px]">{contacts.filter(c => c.churn_risk === "high").length} high churn risk</Badge>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="text-center py-12">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No {config.contactLabelPlural.toLowerCase()} yet. Add your first one!</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {/* Select all header */}
          <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 rounded text-xs text-muted-foreground">
            <Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={selectAll} />
            <span className="flex-1">Name</span>
            <span className="w-24 text-center hidden md:block">AI Score</span>
            <span className="w-24 text-center hidden md:block">Revenue</span>
            <span className="w-24 text-center">Stage</span>
            <span className="w-20 text-center">Actions</span>
          </div>
          {filtered.map(contact => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedContact(contact)}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div onClick={e => { e.stopPropagation(); toggleSelect(contact.id); }}>
                    <Checkbox checked={selectedIds.has(contact.id)} />
                  </div>
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{contact.name}</p>
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="hidden lg:flex gap-1">
                          {contact.tags.slice(0, 2).map((t, i) => <Badge key={i} variant="outline" className="text-[10px] py-0">{t}</Badge>)}
                          {contact.tags.length > 2 && <Badge variant="outline" className="text-[10px] py-0">+{contact.tags.length - 2}</Badge>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {contact.email && <span className="truncate max-w-[150px]">{contact.email}</span>}
                      {contact.company && <span className="hidden sm:inline truncate max-w-[120px]">• {contact.company}</span>}
                    </div>
                  </div>
                  <div className="w-24 text-center hidden md:block">
                    {contact.ai_score > 0 ? (
                      <Badge variant="secondary" className="text-xs"><Sparkles className="h-3 w-3 mr-1" />{contact.ai_score}</Badge>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                  <div className="w-24 text-center hidden md:block">
                    <span className="text-xs font-medium">${(contact.total_revenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="w-24 text-center" onClick={e => e.stopPropagation()}>
                    <Select value={contact.lifecycle_stage} onValueChange={v => updateContact(contact.id, { lifecycle_stage: v })}>
                      <SelectTrigger className="h-7 text-[10px] border-none bg-transparent">
                        <Badge className={`${config.lifecycleStages.find(s => s.value === contact.lifecycle_stage)?.color || "bg-muted"} text-white text-[10px]`}>
                          {config.lifecycleStages.find(s => s.value === contact.lifecycle_stage)?.label || contact.lifecycle_stage}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>{config.lifecycleStages.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="w-20 text-center" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-center">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedContact(contact)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteContact(contact.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
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
