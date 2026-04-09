import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, DollarSign, TrendingUp, Trophy, XCircle } from "lucide-react";
import { useCrmDeals, useCrmContacts } from "@/hooks/useCrm";
import { getCrmConfig } from "@/lib/crmConfig";
import type { IndustryType } from "@/lib/industryConfig";
import { toast } from "sonner";

interface Props { industry: IndustryType; }

const STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
const STAGE_COLORS: Record<string, string> = {
  Lead: "border-blue-500", Qualified: "border-yellow-500", Proposal: "border-purple-500",
  Negotiation: "border-orange-500", Won: "border-green-500", Lost: "border-red-500",
};

export default function CrmDealsTab({ industry }: Props) {
  const config = getCrmConfig(industry);
  const { deals, loading, addDeal, updateDeal } = useCrmDeals();
  const { contacts } = useCrmContacts();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", value: "", stage: "Lead", contact_id: "", probability: "50", expected_close_date: "" });

  const handleAdd = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    const payload: any = { title: form.title, value: parseFloat(form.value) || 0, stage: form.stage, probability: parseInt(form.probability) || 0 };
    if (form.contact_id) payload.contact_id = form.contact_id;
    if (form.expected_close_date) payload.expected_close_date = form.expected_close_date;
    const res = await addDeal(payload);
    if (res?.error) toast.error("Failed to create deal");
    else { toast.success(`${config.dealLabel} created`); setOpen(false); setForm({ title: "", value: "", stage: "Lead", contact_id: "", probability: "50", expected_close_date: "" }); }
  };

  const totalValue = deals.reduce((s, d) => s + (d.value || 0), 0);
  const wonValue = deals.filter(d => d.stage === "Won").reduce((s, d) => s + (d.value || 0), 0);
  const activeDeals = deals.filter(d => d.stage !== "Won" && d.stage !== "Lost");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <div><p className="text-lg font-bold">${totalValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Pipeline Value</p></div>
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
                <div className={`text-sm font-medium p-2 rounded-t border-t-2 ${STAGE_COLORS[stage]} bg-muted/50`}>
                  <span>{stage}</span>
                  <span className="text-xs text-muted-foreground ml-1">({stageDeals.length})</span>
                  <p className="text-xs text-muted-foreground">${stageValue.toLocaleString()}</p>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {stageDeals.map(deal => (
                    <Card key={deal.id} className="cursor-pointer hover:shadow-sm">
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
