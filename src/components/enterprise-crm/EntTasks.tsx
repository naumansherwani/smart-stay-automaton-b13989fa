import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEntTasks } from "@/hooks/useEnterpriseCrm";

const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-slate-500/15 text-slate-300",
  medium: "bg-blue-500/15 text-blue-400",
  high: "bg-amber-500/15 text-amber-400",
  urgent: "bg-red-500/15 text-red-400",
};

export default function EntTasks() {
  const { data, refetch } = useEntTasks();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", due_date: "", priority: "medium" });

  const save = async () => {
    if (!form.title.trim()) return toast.error("Title required");
    const { error } = await supabase.from("ent_tasks").insert({
      title: form.title,
      description: form.description || null,
      due_date: form.due_date || null,
      priority: form.priority,
    });
    if (error) toast.error("Failed"); else { toast.success("Task added"); setForm({ title: "", description: "", due_date: "", priority: "medium" }); setOpen(false); refetch(); }
  };

  const toggleDone = async (id: string, done: boolean) => {
    const { error } = await supabase.from("ent_tasks").update({ status: done ? "done" : "open" }).eq("id", id);
    if (error) toast.error("Update failed"); else refetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("ent_tasks").delete().eq("id", id);
    if (error) toast.error("Delete failed"); else { toast.success("Removed"); refetch(); }
  };

  const open_ = data.filter((t) => t.status !== "done");
  const done = data.filter((t) => t.status === "done");

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{open_.length} open • {done.length} done</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Task</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Sales Task</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Task title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={save}>Add</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-border/40">
          {[...open_, ...done].length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No tasks yet.</div>
          ) : [...open_, ...done].map((t) => (
            <div key={t.id} className="flex items-start gap-3 p-3 hover:bg-muted/20">
              <Checkbox checked={t.status === "done"} onCheckedChange={(v) => toggleDone(t.id, !!v)} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                {t.description && <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>}
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-[10px] ${PRIORITY_COLOR[t.priority]}`} variant="outline">{t.priority}</Badge>
                  {t.due_date && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(t.due_date).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(t.id)}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}