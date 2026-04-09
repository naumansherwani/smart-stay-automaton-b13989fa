import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Route, Edit, Trash2, MapPin, Clock, ArrowRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const RailwayRoutesTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ route_name: "", train_id: "", days_of_operation: [1,2,3,4,5,6,7] as number[] });

  const { data: trains = [] } = useQuery({
    queryKey: ["railway-trains"],
    queryFn: async () => {
      const { data } = await supabase.from("railway_trains").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ["railway-routes"],
    queryFn: async () => {
      const { data } = await supabase.from("railway_routes").select("*, railway_trains(train_name, train_number)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: stopsMap = {} } = useQuery({
    queryKey: ["railway-route-stops-all"],
    queryFn: async () => {
      const { data } = await supabase.from("railway_route_stops").select("*, railway_stations(name, code)").order("stop_sequence");
      const map: Record<string, any[]> = {};
      (data || []).forEach((s: any) => {
        if (!map[s.route_id]) map[s.route_id] = [];
        map[s.route_id].push(s);
      });
      return map;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (route: typeof form) => {
      const { error } = await supabase.from("railway_routes").insert({ ...route, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["railway-routes"] });
      queryClient.invalidateQueries({ queryKey: ["railway-routes-count"] });
      setOpen(false);
      setForm({ route_name: "", train_id: "", days_of_operation: [1,2,3,4,5,6,7] });
      toast.success("Route created");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("railway_routes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["railway-routes"] });
      toast.success("Route deleted");
    },
  });

  const toggleDay = (day: number) => {
    setForm(f => ({
      ...f,
      days_of_operation: f.days_of_operation.includes(day)
        ? f.days_of_operation.filter(d => d !== day)
        : [...f.days_of_operation, day].sort(),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Train Routes</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Route</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Route</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Route Name</Label>
                <Input placeholder="e.g. Lahore → Karachi Express" value={form.route_name} onChange={e => setForm(f => ({ ...f, route_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Train</Label>
                <Select value={form.train_id} onValueChange={v => setForm(f => ({ ...f, train_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select train" /></SelectTrigger>
                  <SelectContent>
                    {trains.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.train_name} (#{t.train_number})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Days of Operation</Label>
                <div className="flex gap-1.5">
                  {DAYS.map((d, i) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(i + 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.days_of_operation.includes(i + 1) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={() => {
                if (!form.route_name || !form.train_id) return toast.error("Fill all fields");
                addMutation.mutate(form);
              }} className="w-full">Create Route</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2].map(i => <Card key={i} className="animate-pulse h-24 bg-muted/50" />)}</div>
      ) : routes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Route className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold text-lg mb-1">No routes yet</h3>
            <p className="text-sm text-muted-foreground">Create your first route with stops</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {routes.map((route: any) => {
            const stops = stopsMap[route.id] || [];
            return (
              <Card key={route.id} className="group hover:shadow-lg transition-all border-border/50 hover:border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground">{route.route_name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {(route as any).railway_trains?.train_name}
                        </Badge>
                      </div>
                      {stops.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {stops.map((s: any, i: number) => (
                            <div key={s.id} className="flex items-center gap-1">
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs">
                                <MapPin className="w-3 h-3" />
                                {s.railway_stations?.code || "?"}
                                {s.departure_time && <span className="text-muted-foreground ml-1">{s.departure_time?.slice(0,5)}</span>}
                              </div>
                              {i < stops.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-1">
                        {route.days_of_operation?.map((d: number) => (
                          <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                            {DAYS[d - 1]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={() => deleteMutation.mutate(route.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RailwayRoutesTab;
