import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutGrid, Trash2, Armchair } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CLASS_TYPES = ["economy", "business", "sleeper", "first_class", "ac_business", "ac_sleeper"];
const CLASS_COLORS: Record<string, string> = {
  economy: "bg-green-500/10 text-green-500",
  business: "bg-blue-500/10 text-blue-500",
  sleeper: "bg-purple-500/10 text-purple-500",
  first_class: "bg-amber-500/10 text-amber-500",
  ac_business: "bg-cyan-500/10 text-cyan-500",
  ac_sleeper: "bg-indigo-500/10 text-indigo-500",
};

const RailwayCoachesTab = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState("");
  const [form, setForm] = useState({ train_id: "", coach_number: "", coach_class: "economy", total_seats: 72, rows_count: 18, seats_per_row: 4, layout: "WA-AW" });

  const { data: trains = [] } = useQuery({
    queryKey: ["railway-trains"],
    queryFn: async () => {
      const { data } = await supabase.from("railway_trains").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: coaches = [], isLoading } = useQuery({
    queryKey: ["railway-coaches", selectedTrain],
    queryFn: async () => {
      let q = supabase.from("railway_coaches").select("*, railway_trains(train_name)").order("coach_number");
      if (selectedTrain) q = q.eq("train_id", selectedTrain);
      const { data } = await q;
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (coach: typeof form) => {
      const { error } = await supabase.from("railway_coaches").insert(coach);
      if (error) throw error;
      // Auto-generate seats for this coach
      const { data: newCoach } = await supabase.from("railway_coaches").select("id").eq("train_id", coach.train_id).eq("coach_number", coach.coach_number).single();
      if (newCoach) {
        const positions = coach.layout === "WA-AW" ? ["window", "aisle", "aisle", "window"] : ["window", "middle", "aisle", "aisle", "middle", "window"];
        const seats = [];
        for (let r = 1; r <= coach.rows_count; r++) {
          for (let s = 0; s < coach.seats_per_row; s++) {
            seats.push({
              coach_id: newCoach.id,
              seat_number: `${r}${String.fromCharCode(65 + s)}`,
              row_number: r,
              position: positions[s % positions.length],
            });
          }
        }
        await supabase.from("railway_seats").insert(seats);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["railway-coaches"] });
      setOpen(false);
      toast.success("Coach added with seats generated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("railway_coaches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["railway-coaches"] });
      toast.success("Coach deleted");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Select value={selectedTrain} onValueChange={setSelectedTrain}>
          <SelectTrigger className="w-64"><SelectValue placeholder="All trains" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All trains</SelectItem>
            {trains.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.train_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Coach</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Coach</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Train</Label>
                <Select value={form.train_id} onValueChange={v => setForm(f => ({ ...f, train_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select train" /></SelectTrigger>
                  <SelectContent>
                    {trains.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.train_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Coach Number</Label>
                  <Input placeholder="e.g. A1" value={form.coach_number} onChange={e => setForm(f => ({ ...f, coach_number: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={form.coach_class} onValueChange={v => setForm(f => ({ ...f, coach_class: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CLASS_TYPES.map(c => <SelectItem key={c} value={c}>{c.replace("_", " ").toUpperCase()}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Rows</Label>
                  <Input type="number" min={1} value={form.rows_count} onChange={e => setForm(f => ({ ...f, rows_count: parseInt(e.target.value) || 1, total_seats: (parseInt(e.target.value) || 1) * f.seats_per_row }))} />
                </div>
                <div className="space-y-2">
                  <Label>Seats/Row</Label>
                  <Input type="number" min={1} value={form.seats_per_row} onChange={e => setForm(f => ({ ...f, seats_per_row: parseInt(e.target.value) || 1, total_seats: f.rows_count * (parseInt(e.target.value) || 1) }))} />
                </div>
                <div className="space-y-2">
                  <Label>Total Seats</Label>
                  <Input value={form.total_seats} disabled className="bg-muted" />
                </div>
              </div>
              <Button onClick={() => {
                if (!form.train_id || !form.coach_number) return toast.error("Fill required fields");
                addMutation.mutate(form);
              }} className="w-full">Add Coach & Generate Seats</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Card key={i} className="animate-pulse h-28 bg-muted/50" />)}
        </div>
      ) : coaches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <LayoutGrid className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold text-lg mb-1">No coaches yet</h3>
            <p className="text-sm text-muted-foreground">Add coaches and seats will be auto-generated</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map((coach: any) => (
            <Card key={coach.id} className="group hover:shadow-lg transition-all border-border/50">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Armchair className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Coach {coach.coach_number}</h3>
                      <p className="text-xs text-muted-foreground">{(coach as any).railway_trains?.train_name}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={() => deleteMutation.mutate(coach.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-xs ${CLASS_COLORS[coach.coach_class] || "bg-muted"}`}>
                    {coach.coach_class?.replace("_", " ").toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{coach.total_seats} seats</Badge>
                  <Badge variant="outline" className="text-xs">{coach.rows_count}×{coach.seats_per_row}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RailwayCoachesTab;
