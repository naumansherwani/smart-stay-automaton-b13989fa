import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, TrainFront, Edit, Trash2, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const TRAIN_TYPES = ["express", "superfast", "local", "freight", "high-speed", "metro"];

const RailwayTrainsTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingTrain, setEditingTrain] = useState<any>(null);
  const [form, setForm] = useState({ train_number: "", train_name: "", train_type: "express", total_coaches: 0 });

  const { data: trains = [], isLoading } = useQuery({
    queryKey: ["railway-trains"],
    queryFn: async () => {
      const { data, error } = await supabase.from("railway_trains").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (train: typeof form) => {
      const { error } = await supabase.from("railway_trains").insert({ ...train, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["railway-trains"] });
      queryClient.invalidateQueries({ queryKey: ["railway-trains-count"] });
      setOpen(false);
      resetForm();
      toast.success("Train added successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...train }: any) => {
      const { error } = await supabase.from("railway_trains").update(train).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["railway-trains"] });
      setEditingTrain(null);
      setOpen(false);
      resetForm();
      toast.success("Train updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("railway_trains").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["railway-trains"] });
      queryClient.invalidateQueries({ queryKey: ["railway-trains-count"] });
      toast.success("Train deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => setForm({ train_number: "", train_name: "", train_type: "express", total_coaches: 0 });

  const handleSubmit = () => {
    if (!form.train_number || !form.train_name) return toast.error("Train number and name required");
    if (editingTrain) {
      updateMutation.mutate({ id: editingTrain.id, ...form });
    } else {
      addMutation.mutate(form);
    }
  };

  const handleEdit = (train: any) => {
    setEditingTrain(train);
    setForm({ train_number: train.train_number, train_name: train.train_name, train_type: train.train_type, total_coaches: train.total_coaches });
    setOpen(true);
  };

  const filtered = trains.filter((t: any) =>
    t.train_name.toLowerCase().includes(search.toLowerCase()) || t.train_number.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search trains..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingTrain(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Train</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTrain ? "Edit Train" : "Add New Train"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Train Number</Label>
                  <Input placeholder="e.g. 101" value={form.train_number} onChange={e => setForm(f => ({ ...f, train_number: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Train Name</Label>
                  <Input placeholder="e.g. Karachi Express" value={form.train_name} onChange={e => setForm(f => ({ ...f, train_name: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.train_type} onValueChange={v => setForm(f => ({ ...f, train_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRAIN_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Total Coaches</Label>
                  <Input type="number" min={0} value={form.total_coaches} onChange={e => setForm(f => ({ ...f, total_coaches: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={addMutation.isPending || updateMutation.isPending}>
                {editingTrain ? "Update Train" : "Add Train"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Card key={i} className="animate-pulse h-32 bg-muted/50" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <TrainFront className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold text-lg mb-1">No trains yet</h3>
            <p className="text-sm text-muted-foreground">Add your first train to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((train: any) => (
            <Card key={train.id} className="group hover:shadow-lg transition-all border-border/50 hover:border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[hsl(200,70%,50%,0.1)] flex items-center justify-center">
                      <TrainFront className="w-5 h-5 text-[hsl(200,70%,50%)]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{train.train_name}</h3>
                      <p className="text-xs text-muted-foreground">#{train.train_number}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(train)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(train.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{train.train_type}</Badge>
                  <Badge variant="outline" className="text-xs">{train.total_coaches} coaches</Badge>
                  <Badge className={`text-xs ${train.is_active ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
                    {train.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RailwayTrainsTab;
