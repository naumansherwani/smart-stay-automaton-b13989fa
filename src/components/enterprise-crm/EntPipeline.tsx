import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useEntDeals, DEAL_STAGES, STAGE_COLORS, fmtGBP, type DealStage } from "@/hooks/useEnterpriseCrm";

export default function EntPipeline() {
  const { data, refetch } = useEntDeals();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", value_gbp: "", probability: "30", stage: "new" as DealStage, expected_close_date: "", notes: "" });
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const save = async () => {
    if (!form.title.trim()) return toast.error("Deal title required");
    const { error } = await supabase.from("ent_deals").insert({
      title: form.title,
      stage: form.stage,
      value_gbp: Number(form.value_gbp) || 0,
      probability: Math.min(100, Math.max(0, Number(form.probability) || 0)),
      expected_close_date: form.expected_close_date || null,
      notes: form.notes || null,
    });
    if (error) toast.error("Failed to create deal");
    else { toast.success("Deal created"); setForm({ title: "", value_gbp: "", probability: "30", stage: "new", expected_close_date: "", notes: "" }); setOpen(false); refetch(); }
  };

  const moveStage = async (dealId: string, stage: DealStage) => {
    const { error } = await supabase.from("ent_deals").update({ stage }).eq("id", dealId);
    if (error) toast.error("Move failed"); else { toast.success(`Moved to ${stage}`); refetch(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Drag deals between stages • All values in GBP</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Deal</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Deal</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Deal title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Value (GBP)" value={form.value_gbp} onChange={(e) => setForm({ ...form, value_gbp: e.target.value })} />
                <Input type="number" placeholder="Probability %" value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} />
                <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as DealStage })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DEAL_STAGES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="date" value={form.expected_close_date} onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} />
              </div>
              <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
            <DialogFooter><Button onClick={save}>Create Deal</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="grid grid-flow-col auto-cols-[260px] gap-3 min-w-max">
          {DEAL_STAGES.map((stage) => {
            const stageDeals = data.filter((d) => d.stage === stage);
            const total = stageDeals.reduce((s, d) => s + Number(d.value_gbp || 0), 0);
            return (
              <div
                key={stage}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (draggingId) { moveStage(draggingId, stage); setDraggingId(null); } }}
                className="bg-muted/20 rounded-lg p-2 border border-border/50 min-h-[300px]"
              >
                <div className={`flex items-center justify-between p-2 rounded-md mb-2 border ${STAGE_COLORS[stage]}`}>
                  <div className="text-xs font-semibold uppercase">{stage}</div>
                  <div className="text-[10px] opacity-80">{stageDeals.length} • {fmtGBP(total)}</div>
                </div>
                <div className="space-y-2">
                  {stageDeals.map((d) => (
                    <Card
                      key={d.id}
                      draggable
                      onDragStart={() => setDraggingId(d.id)}
                      onDragEnd={() => setDraggingId(null)}
                      className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition"
                    >
                      <CardContent className="p-3 space-y-1.5">
                        <div className="flex items-start gap-1">
                          <GripVertical className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="text-sm font-medium leading-tight">{d.title}</div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-foreground tabular-nums">{fmtGBP(Number(d.value_gbp))}</span>
                          <span className="text-muted-foreground">{d.probability}%</span>
                        </div>
                        {d.expected_close_date && (
                          <div className="text-[10px] text-muted-foreground">Close: {new Date(d.expected_close_date).toLocaleDateString()}</div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}