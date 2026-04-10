import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, DollarSign, TrendingUp, Trophy, XCircle, ChevronRight, ChevronLeft, Eye, Edit2, Save, X, ArrowLeft, Sparkles, Calendar, User } from "lucide-react";
import { useCrmDeals, useCrmContacts } from "@/hooks/useCrm";
import { getCrmConfig } from "@/lib/crmConfig";
import type { IndustryType } from "@/lib/industryConfig";
import type { CrmDeal } from "@/hooks/useCrm";
import { format } from "date-fns";
import { toast } from "sonner";

interface Props { industry: IndustryType; }

const STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
const STAGE_COLORS: Record<string, string> = {
  Lead: "border-blue-500 bg-blue-500/5", Qualified: "border-yellow-500 bg-yellow-500/5", Proposal: "border-purple-500 bg-purple-500/5",
  Negotiation: "border-orange-500 bg-orange-500/5", Won: "border-green-500 bg-green-500/5", Lost: "border-red-500 bg-red-500/5",
};

export default function CrmDealsTab({ industry }: Props) {
  const config = getCrmConfig(industry);
  const { deals, loading, addDeal, updateDeal } = useCrmDeals();
  const { contacts } = useCrmContacts();
  const [open, setOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<CrmDeal | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", value: "", notes: "", probability: "" });
  const [form, setForm] = useState({ title: "", value: "", stage: "Lead", contact_id: "", probability: "50", expected_close_date: "", notes: "" });

  const handleAdd = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    const payload: any = { title: form.title, value: parseFloat(form.value) || 0, stage: form.stage, probability: parseInt(form.probability) || 0, notes: form.notes || null };
    if (form.contact_id) payload.contact_id = form.contact_id;
    if (form.expected_close_date) payload.expected_close_date = form.expected_close_date;
    const res = await addDeal(payload);
    if (res?.error) toast.error("Failed to create deal");
    else { toast.success(`${config.dealLabel} created`); setOpen(false); setForm({ title: "", value: "", stage: "Lead", contact_id: "", probability: "50", expected_close_date: "", notes: "" }); }
  };

  const moveDeal = async (deal: CrmDeal, direction: "forward" | "backward") => {
    const currentIdx = STAGES.indexOf(deal.stage);
    const newIdx = direction === "forward" ? currentIdx + 1 : currentIdx - 1;
    if (newIdx < 0 || newIdx >= STAGES.length) return;
    const newStage = STAGES[newIdx];
    const updates: Record<string, unknown> = { stage: newStage };
    if (newStage === "Won") updates.won_at = new Date().toISOString();
    if (newStage === "Lost") updates.lost_at = new Date().toISOString();
    await updateDeal(deal.id, updates);
    toast.success(`Moved to ${newStage}`);
  };

  const startEdit = (deal: CrmDeal) => {
    setEditForm({ title: deal.title, value: String(deal.value || 0), notes: deal.notes || "", probability: String(deal.probability || 0) });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selectedDeal) return;
    await updateDeal(selectedDeal.id, {
      title: editForm.title,
      value: parseFloat(editForm.value) || 0,
      notes: editForm.notes || null,
      probability: parseInt(editForm.probability) || 0,
    });
    setEditing(false);
    toast.success("Deal updated");
  };

  const totalValue = deals.reduce((s, d) => s + (d.value || 0), 0);
  const wonValue = deals.filter(d => d.stage === "Won").reduce((s, d) => s + (d.value || 0), 0);
  const activeDeals = deals.filter(d => d.stage !== "Won" && d.stage !== "Lost");
  const weightedPipeline = activeDeals.reduce((s, d) => s + (d.value || 0) * (d.probability || 0) / 100, 0);

  // Detail view
  if (selectedDeal) {
    const deal = deals.find(d => d.id === selectedDeal.id) || selectedDeal;
    const stageIdx = STAGES.indexOf(deal.stage);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedDeal(null); setEditing(false); }}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1">
            <h2 className="text-lg font-bold">{deal.title}</h2>
            <p className="text-sm text-muted-foreground">{deal.stage} • ${(deal.value || 0).toLocaleString()}</p>
          </div>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => startEdit(deal)}><Edit2 className="h-4 w-4 mr-1" />Edit</Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit}><Save className="h-4 w-4 mr-1" />Save</Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
            </div>
          )}
        </div>

        {/* Stage Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1">
              {STAGES.map((stage, i) => (
                <div key={stage} className="flex items-center flex-1">
                  <div
                    className={`flex-1 py-2 px-3 text-center text-xs font-medium rounded cursor-pointer transition-all ${
                      i <= stageIdx
                        ? stage === "Won" ? "bg-green-500 text-white" : stage === "Lost" ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                    onClick={() => updateDeal(deal.id, {
                      stage,
                      ...(stage === "Won" ? { won_at: new Date().toISOString() } : {}),
                      ...(stage === "Lost" ? { lost_at: new Date().toISOString() } : {}),
                    })}
                  >
                    {stage}
                  </div>
                  {i < STAGES.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mx-0.5" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                <>
                  <div><Label>Title</Label><Input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} /></div>
                  <div><Label>Value ($)</Label><Input type="number" value={editForm.value} onChange={e => setEditForm(p => ({ ...p, value: e.target.value }))} /></div>
                  <div><Label>Probability (%)</Label><Input type="number" min="0" max="100" value={editForm.probability} onChange={e => setEditForm(p => ({ ...p, probability: e.target.value }))} /></div>
                  <div><Label>Notes</Label><Textarea value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} rows={4} /></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Value</span><span className="font-bold text-primary">${(deal.value || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Probability</span><span className="font-medium">{deal.probability}%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Weighted Value</span><span className="font-medium">${Math.round((deal.value || 0) * (deal.probability || 0) / 100).toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Currency</span><span>{deal.currency || "USD"}</span></div>
                  {deal.expected_close_date && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Expected Close</span><span>{format(new Date(deal.expected_close_date), "MMM d, yyyy")}</span></div>}
                  {deal.won_at && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Won At</span><span className="text-green-600">{format(new Date(deal.won_at), "MMM d, yyyy")}</span></div>}
                  {deal.lost_at && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Lost At</span><span className="text-red-600">{format(new Date(deal.lost_at), "MMM d, yyyy")}</span></div>}
                  {deal.lost_reason && <div className="text-sm"><span className="text-muted-foreground">Lost Reason:</span><p className="mt-1">{deal.lost_reason}</p></div>}
                  {deal.notes && <div className="p-2 bg-muted/50 rounded text-sm"><p className="text-xs font-medium mb-1">Notes</p><p className="whitespace-pre-line">{deal.notes}</p></div>}
                  <p className="text-xs text-muted-foreground">Created {format(new Date(deal.created_at), "MMM d, yyyy h:mm a")}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {deal.contact && (
                <div className="p-3 bg-muted/30 rounded flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{deal.contact.name}</p>
                    {deal.contact.email && <p className="text-xs text-muted-foreground">{deal.contact.email}</p>}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" disabled={stageIdx <= 0} onClick={() => moveDeal(deal, "backward")}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Prev Stage
                </Button>
                <Button size="sm" className="flex-1" disabled={stageIdx >= STAGES.length - 1} onClick={() => moveDeal(deal, "forward")}>
                  Next Stage<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              {deal.stage !== "Won" && deal.stage !== "Lost" && (
                <div className="flex gap-2">
                  <Button variant="default" size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => { updateDeal(deal.id, { stage: "Won", won_at: new Date().toISOString() }); toast.success("Deal won! 🎉"); }}>
                    <Trophy className="h-4 w-4 mr-1" />Mark Won
                  </Button>
                  <Button variant="destructive" size="sm" className="flex-1" onClick={() => { updateDeal(deal.id, { stage: "Lost", lost_at: new Date().toISOString() }); toast.success("Deal marked as lost"); }}>
                    <XCircle className="h-4 w-4 mr-1" />Mark Lost
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <div><p className="text-lg font-bold">${totalValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Pipeline</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-green-500" />
            <div><p className="text-lg font-bold">${wonValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Won Revenue</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <div><p className="text-lg font-bold">{activeDeals.length}</p><p className="text-xs text-muted-foreground">Active {config.dealLabelPlural}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <div><p className="text-lg font-bold">${Math.round(weightedPipeline).toLocaleString()}</p><p className="text-xs text-muted-foreground">Weighted Pipeline</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{config.dealLabel} Pipeline</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />New {config.dealLabel}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New {config.dealLabel}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Value ($)</Label><Input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} /></div>
                <div><Label>Probability (%)</Label><Input type="number" min="0" max="100" value={form.probability} onChange={e => setForm(p => ({ ...p, probability: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Stage</Label>
                  <Select value={form.stage} onValueChange={v => setForm(p => ({ ...p, stage: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Expected Close</Label><Input type="date" value={form.expected_close_date} onChange={e => setForm(p => ({ ...p, expected_close_date: e.target.value }))} /></div>
              </div>
              {contacts.length > 0 && (
                <div>
                  <Label>{config.contactLabel}</Label>
                  <Select value={form.contact_id} onValueChange={v => setForm(p => ({ ...p, contact_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Link..." /></SelectTrigger>
                    <SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <Button onClick={handleAdd} className="w-full">Create {config.dealLabel}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map(stage => {
            const stageDeals = deals.filter(d => d.stage === stage);
            const stageValue = stageDeals.reduce((s, d) => s + (d.value || 0), 0);
            return (
              <div key={stage} className="space-y-2">
                <div className={`text-sm font-medium p-2 rounded-t border-t-2 ${STAGE_COLORS[stage]}`}>
                  <span>{stage}</span>
                  <span className="text-xs text-muted-foreground ml-1">({stageDeals.length})</span>
                  <p className="text-xs text-muted-foreground">${stageValue.toLocaleString()}</p>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 pr-2">
                    {stageDeals.map(deal => (
                      <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => setSelectedDeal(deal)}>
                        <CardContent className="p-2">
                          <p className="text-sm font-medium truncate">{deal.title}</p>
                          <p className="text-xs text-primary font-semibold">${(deal.value || 0).toLocaleString()}</p>
                          {deal.contact && <p className="text-xs text-muted-foreground truncate">{deal.contact.name}</p>}
                          <div className="flex items-center gap-1 mt-1">
                            <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${deal.probability}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                          </div>
                          {/* Move buttons on hover */}
                          <div className="flex gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-5 text-[10px] flex-1 px-1" disabled={STAGES.indexOf(stage) <= 0} onClick={() => moveDeal(deal, "backward")}>
                              <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-5 text-[10px] flex-1 px-1" disabled={STAGES.indexOf(stage) >= STAGES.length - 1} onClick={() => moveDeal(deal, "forward")}>
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
