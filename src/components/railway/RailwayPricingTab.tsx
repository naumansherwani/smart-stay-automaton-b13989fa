import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, DollarSign, Brain, TrendingUp, TrendingDown, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const RailwayPricingTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    train_id: "", route_id: "", coach_class: "economy", override_price: 0,
    override_type: "fixed", reason: "", valid_from: "", valid_until: "",
  });

  const { data: trains = [] } = useQuery({
    queryKey: ["railway-trains"],
    queryFn: async () => {
      const { data } = await supabase.from("railway_trains").select("*");
      return data || [];
    },
  });

  const { data: routes = [] } = useQuery({
    queryKey: ["railway-routes"],
    queryFn: async () => {
      const { data } = await supabase.from("railway_routes").select("*, railway_trains(train_name)");
      return data || [];
    },
  });

  const { data: overrides = [], isLoading } = useQuery({
    queryKey: ["railway-pricing-overrides"],
    queryFn: async () => {
      const { data } = await supabase.from("railway_pricing_overrides")
        .select("*, railway_trains(train_name), railway_routes(route_name)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (override: any) => {
      const { error } = await supabase.from("railway_pricing_overrides").insert({
        ...override,
        user_id: user!.id,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["railway-pricing-overrides"] });
      setOpen(false);
      toast.success("Price override added");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("railway_pricing_overrides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["railway-pricing-overrides"] });
      toast.success("Override removed — AI pricing restored");
    },
  });

  const pricingRules = [
    { icon: TrendingUp, label: "High Demand", desc: "Price increases when 70%+ seats booked", color: "text-red-400" },
    { icon: AlertTriangle, label: "Scarcity Surge", desc: "Last 10% seats trigger price surge", color: "text-yellow-400" },
    { icon: TrendingDown, label: "Low Demand", desc: "Price drops for empty routes", color: "text-green-400" },
    { icon: Brain, label: "Time-Based", desc: "Last-minute bookings cost more", color: "text-blue-400" },
  ];

  return (
    <div className="space-y-6">
      {/* AI Pricing Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pricingRules.map(r => (
          <Card key={r.label} className="border-border/50 bg-card/80">
            <CardContent className="p-4 flex items-start gap-3">
              <r.icon className={`w-5 h-5 mt-0.5 ${r.color}`} />
              <div>
                <h4 className="font-semibold text-sm text-foreground">{r.label}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Manual Overrides */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Manual Price Overrides</h3>
            <p className="text-sm text-muted-foreground">Override AI pricing for specific trains, routes, or classes</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Add Override</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Price Override</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Train (optional)</Label>
                  <Select value={form.train_id} onValueChange={v => setForm(f => ({ ...f, train_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Any train" /></SelectTrigger>
                    <SelectContent>
                      {trains.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.train_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Route (optional)</Label>
                  <Select value={form.route_id} onValueChange={v => setForm(f => ({ ...f, route_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Any route" /></SelectTrigger>
                    <SelectContent>
                      {routes.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.route_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={form.coach_class} onValueChange={v => setForm(f => ({ ...f, coach_class: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["economy","business","sleeper","first_class"].map(c => <SelectItem key={c} value={c}>{c.replace("_"," ").toUpperCase()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Override Price ($)</Label>
                    <Input type="number" min={0} value={form.override_price} onChange={e => setForm(f => ({ ...f, override_price: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valid From</Label>
                    <Input type="date" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until</Label>
                    <Input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Input placeholder="e.g. Festival season" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
                </div>
                <Button onClick={() => {
                  if (!form.override_price) return toast.error("Set a price");
                  addMutation.mutate(form);
                }} className="w-full">Add Override</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {overrides.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Brain className="w-10 h-10 mx-auto mb-3 text-primary/50" />
              <h4 className="font-semibold">AI Pricing Active</h4>
              <p className="text-sm text-muted-foreground">No manual overrides — AI controls all pricing</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {overrides.map((o: any) => (
              <Card key={o.id} className="group border-border/50 border-l-4 border-l-yellow-500">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-yellow-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">${o.override_price}</span>
                        <Badge variant="outline" className="text-xs">{o.coach_class?.replace("_"," ")}</Badge>
                        {o.railway_trains?.train_name && <Badge variant="secondary" className="text-xs">{o.railway_trains.train_name}</Badge>}
                        {o.railway_routes?.route_name && <Badge variant="secondary" className="text-xs">{o.railway_routes.route_name}</Badge>}
                        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">MANUAL</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {o.reason || "No reason"} • {o.valid_from || "always"} → {o.valid_until || "always"}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => deleteMutation.mutate(o.id)}>
                    <RefreshCw className="w-3 h-3" /> Reset to AI
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RailwayPricingTab;
