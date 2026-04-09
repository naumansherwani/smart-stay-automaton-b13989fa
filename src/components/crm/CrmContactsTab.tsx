import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, User, Mail, Phone, Building2, Trash2, Sparkles } from "lucide-react";
import { useCrmContacts } from "@/hooks/useCrm";
import { getCrmConfig } from "@/lib/crmConfig";
import type { IndustryType } from "@/lib/industryConfig";
import { toast } from "sonner";

interface Props { industry: IndustryType; }

export default function CrmContactsTab({ industry }: Props) {
  const config = getCrmConfig(industry);
  const { contacts, loading, addContact, updateContact, deleteContact } = useCrmContacts();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", lifecycle_stage: "lead", source: "direct", notes: "" });

  const filtered = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || c.lifecycle_stage === stageFilter;
    return matchSearch && matchStage;
  });

  const handleAdd = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    const res = await addContact(form);
    if (res?.error) toast.error("Failed to add contact");
    else { toast.success(`${config.contactLabel} added`); setOpen(false); setForm({ name: "", email: "", phone: "", company: "", lifecycle_stage: "lead", source: "direct", notes: "" }); }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteContact(id);
    if (res?.error) toast.error("Failed to delete");
    else toast.success("Deleted");
  };

  const handleStageChange = async (id: string, stage: string) => {
    await updateContact(id, { lifecycle_stage: stage });
  };

  const getStageColor = (stage: string) => {
    const found = config.lifecycleStages.find(s => s.value === stage);
    return found?.color || "bg-muted";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={`Search ${config.contactLabelPlural.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {config.lifecycleStages.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
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
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <Button onClick={handleAdd} className="w-full">Add {config.contactLabel}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="text-center py-12">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No {config.contactLabelPlural.toLowerCase()} yet. Add your first one!</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(contact => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{contact.name}</p>
                        {contact.ai_score > 0 && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            <Sparkles className="h-3 w-3 mr-1" />Score: {contact.ai_score}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {contact.email && <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" />{contact.email}</span>}
                        {contact.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{contact.phone}</span>}
                        {contact.company && <span className="flex items-center gap-1 truncate"><Building2 className="h-3 w-3" />{contact.company}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select value={contact.lifecycle_stage} onValueChange={v => handleStageChange(contact.id, v)}>
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <Badge className={`${getStageColor(contact.lifecycle_stage)} text-white text-xs`}>
                          {config.lifecycleStages.find(s => s.value === contact.lifecycle_stage)?.label || contact.lifecycle_stage}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>{config.lifecycleStages.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                    {contact.churn_risk === "high" && <Badge variant="destructive" className="text-xs">Churn Risk</Badge>}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(contact.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
